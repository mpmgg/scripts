import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

dotenv.config();

puppeteer.use(StealthPlugin());

export default async function launchWebBrowser() {
  // Launch webbrowser
  const CHROME_PATH = process.env.CHROME_PATH || "";
  const browserArr: Browser[] = new Array();

  const downloadPathArr: string[] = new Array();

  const pageArr: Page[] = new Array();

  for (let i = 0; i < 7; i++) {
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: CHROME_PATH,
    });
    browserArr.push(browser);

    const page = (await browser.pages())[0];
    pageArr.push(page);
    const pageClient = await page.target().createCDPSession();
    const downloadPath = path.resolve(`./downloads${i}`);
    await pageClient.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath,
    });
    fs.ensureDir(downloadPath);
    downloadPathArr.push(downloadPath);
  }
  return { pageArr, downloadPathArr };
}
