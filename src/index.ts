import express from "express";
import dotenv from "dotenv";

import { BrowserService } from "./services/browserService";

// Load environment variables
dotenv.config();

// default port is 8080
const port = isNaN(Number(process.env.PORT)) ? 8080 : Number(process.env.PORT);

// create very simple http server
const app = express();

// dependencies
const browserService = new BrowserService();

// actual webscraping
app.get("/:username", async (req, res) => {
    const steamIdResponse = await browserService.fetchSteamId(req.params?.username);
    res.send(steamIdResponse);
});

// status endpoint
app.get("/status", (req, res) => {
    res.status(200).send("OK");
});

// start http server on preset port
app.listen(port, async() => {
    await browserService.start();
    console.log(`HTTP server started on localhost:${port}`);
});