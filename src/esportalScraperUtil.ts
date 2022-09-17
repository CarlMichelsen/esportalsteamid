import * as puppeteer from "puppeteer";

export const parseSteamLinkFromHtml = (html:string): string|null => {
    const regexp = /user-profile-steam-link/g;
    const instance: RegExpExecArray|null = regexp.exec(html);
    if (instance) {
        const spread = 100;
        const searchSpace = html.substring(instance.index-spread, instance.index+spread);
        const classStartIndex = spread;
        const hrefQuoteIndex = searchSpace.indexOf('href', classStartIndex)+6;
        const hrefEndQuoteIndex = searchSpace.indexOf('"', hrefQuoteIndex);

        return searchSpace.substring(hrefQuoteIndex, hrefEndQuoteIndex);
    }
    return null;
}

export const getSteamLinkForEsportalUser = async(username:string, page: puppeteer.Page, viewport?: puppeteer.Viewport, userAgentList?: string[]): Promise<string|null> => {
    if (viewport) await page.setViewport(viewport);
    if (userAgentList) {
        const userAgentIndex = Math.round(Math.random()*(userAgentList.length-1));
        const userAgent = userAgentList[userAgentIndex];
        await page.setUserAgent(userAgent);
    }
    await page.goto(`https://esportal.com/da/profile/${username.trim()}`);
    const html = await page.content();
    return parseSteamLinkFromHtml(html);
}

export const parseSteamId = (steamLink: string|null): string|null => {
    if (!steamLink) return null;
    return steamLink.substring(steamLink.lastIndexOf("/")+1, steamLink.length).trim();
}