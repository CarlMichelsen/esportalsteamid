import express from "express";
import dotenv from "dotenv";
import * as puppeteer from "puppeteer";

import userAgents from "./userAgents";
import { getHtmlForEsportalUser, parseSteamId, parseSteamLinkFromHtml } from "./esportalScraperUtil";
import { SteamIdResponse } from "./steamIdResponse";

// Load environment variables
dotenv.config();

// default port is 8080
const port = isNaN(Number(process.env.PORT)) ? 8080 : Number(process.env.PORT);

// create very simple http server
const app = express();

// dependencies
let browser: puppeteer.Browser;
const viewport: puppeteer.Viewport = {
    width: 1366,
    height: 768
};
const cache = new Map<string, string>();

// actual webscraping
app.get("/esportal-steamid/:username", async (req, res) => {
    const responseObject = new SteamIdResponse();
    const usernameParam = req.params.username;
    if (usernameParam) {
        const username = usernameParam.trim();
        let steamId: string|null = cache.get(username) ?? null;
        if (steamId == null) {
            const page = await browser.newPage();
            const html: string|null = await getHtmlForEsportalUser(username, page, viewport, userAgents);
            page.close();
            const linkParse = parseSteamLinkFromHtml(html);
            steamId = parseSteamId(linkParse);
            if (steamId) {
                console.log("scraped:", username, "steamid:", steamId);
                responseObject.steamId = steamId;
                cache.set(username, steamId);
            } else {
                if (html != null) responseObject.transientError = true;
                responseObject.success = false;
            }
        } else {
            console.log("found cached for:", username, "steamid:", steamId);
            responseObject.steamId = steamId;
            responseObject.cached = true;
        }
    }

    res.send(responseObject);
});

// status endpoint
app.get("/status", (req, res) => {
    res.status(200).send("OK");
});

// start http server on preset port
app.listen(port, async() => {
    browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN,
        args: ['--no-sandbox', '--disable-gpu', '--headless']
    });
    console.log(`HTTP server started on localhost:${port}`);
});

/*
if (!steamId) {
            const page = await browser.newPage();
            const steamLink: string|null = await getSteamLinkForEsportalUser(username, page, viewport, userAgents);
            steamId = parseSteamId(steamLink);
            if (steamId) {
                cache.set(username, steamId); // cache
                console.log("scraped", username, steamId);
            }
            page.close();
        } else {
            console.log("found cached", username, steamId);
            responseObject.cached = true;
        }

        if (steamId === null) {
            const str = "Failed esportal request";
            console.error(str);
            responseObject.success = false;
        }
        responseObject.steamId = steamId;
    } else {
        const str = "No username";
        console.error(str);
        responseObject.success = false;
    }
*/