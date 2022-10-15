import * as puppeteer from "puppeteer";
import { SteamIdResponse } from "../steamIdResponse";
import userAgents from "../userAgents";

export class BrowserService
{
    browser: puppeteer.Browser|null = null;
    viewport: puppeteer.Viewport;
    options: puppeteer.WaitForOptions;
    cache: Map<string, SteamIdResponse>;
    

    constructor() {
        this.cache = new Map<string, SteamIdResponse>();
        this.viewport = {
            width: 1366,
            height: 768
        };
        this.options = {
            waitUntil: "networkidle2"
        };
    }

    async start(): Promise<void>
    {
        this.browser = await puppeteer.launch({
            executablePath: process.env.CHROME_BIN,
            args: ['--no-sandbox', '--disable-gpu', '--headless']
        });
    }

    async getPage(): Promise<puppeteer.Page>
    {
        if (!this.browser) throw new Error("Attempted to open a tab without a browser!");
        const page = await this.browser.newPage();
        const agent = this.getRandomUserAgent();
        await page.setUserAgent(agent);
        await page.setViewport(this.viewport);
        return page;
    }

    async fetchSteamLinkForEsportalUser(esportalUsername: string): Promise<string|null>
    {
        const username = esportalUsername.trim();
        const url = `https://esportal.com/en/profile/${username}`;
        const page = await this.getPage();
        await page.goto(url, this.options);
        const result = await page.evaluate(this.evaluateOnPage);
        await page.close();
        return result;
    }

    async fetchSteamId(esportalUsername: string): Promise<SteamIdResponse>
    {
        const cachedValue = this.cache.get(esportalUsername) ?? null;
        if (cachedValue) return cachedValue;

        const steamIdResponse = new SteamIdResponse();
        const steamLink = await this.fetchSteamLinkForEsportalUser(esportalUsername);
        if (steamLink)
        {
            const steamId64 = this.cutSteamId64FromSteamLink(steamLink);
            if (steamId64 && steamId64.length === 17)
            {
                steamIdResponse.success = true;
                steamIdResponse.steamId = steamId64;
                this.cache.set(esportalUsername, { ...steamIdResponse, cached: true });
                return steamIdResponse;
            }
        }

        // if there is no steamLink the webrequest probably failed and this could be transient
        steamIdResponse.transientError = !steamLink;
        steamIdResponse.success = false;
        return steamIdResponse;
    }

    cutSteamId64FromSteamLink(steamLink: string): string|null
    {
        const lastSlashIndex = steamLink.lastIndexOf("/");
        const result = steamLink.substring(lastSlashIndex+1).trim();
        return result;
    }

    getRandomUserAgent(): string
    {
        const userAgentIndex = Math.round(Math.random()*(userAgents.length-1));
        return userAgents[userAgentIndex];
    }

    evaluateOnPage(): string|null
    {
        const links = document.querySelectorAll("a");
        for (const link of links) {
            if (link.href.includes("https://steamcommunity.com/profiles/")) return link.href;
        }
        return null;
    }
}