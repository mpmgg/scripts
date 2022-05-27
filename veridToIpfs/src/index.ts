// Imports

import { NFTStorage, File, Blob } from "nft.storage";
import dotenv from "dotenv";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import path from "path";
import fs from "fs-extra";
import { Puppeteer } from "puppeteer";
// Load environment variables from .env file
dotenv.config();

puppeteer.use(StealthPlugin());

// Prepare

// Checks when file is downloaded, returns file data and path

async function checkIfFileIsDownloaded(downloadPath: string): Promise<{
  data: Buffer | null;
  path: string;
}> {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 1000);
  });
  const files = await fs.readdir(downloadPath);
  const file = path.resolve(downloadPath, "" + files[0]);

  // Check if jar or sk or zip file is downloaded
  if (
    path.extname(file) === ".jar" ||
    path.extname(file) === ".sk" ||
    path.extname(file) === ".zip"
  ) {
    // Return buffer with file content
    const fileData = await fs.readFile(path.resolve(downloadPath, files[0]));
    return { data: fileData, path: file };
  } else {
    fs.emptyDir(downloadPath);
    return { data: null, path: "" };
  }
}

// Initialize NFT.storage client
const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN || "";
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

// Uploads file to IPFS, empties dir, returns CID

async function fileToCid(
  file: {
    data: Buffer | null;
    path: string;
  },
  downloadPath: string
): Promise<string | null> {
  if (file.data) {
    try {
      const blob = new Blob([file.data]);
      const cid = await client.storeBlob(blob);

      fs.emptyDir(downloadPath);

      return cid;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  return null;
}
// Launch webbrowser
const CHROME_PATH = process.env.CHROME_PATH || "";
const browserArr = new Array();

const downloadPathArr: string[] = new Array();

const pageArr = new Array();

for (let i = 0; i < 7; i++) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    // args: [
    // "--disable-extensions-except=/home/mble/Donwnloads/uBlock/manifest.json",
    // ],
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

const namesRaw = await fs.readFile(path.resolve("../../repository/name.json"));
const names = JSON.parse("" + namesRaw);
const veridCid: { [key: number]: string } = await fs.readJson(
  "../../repository/verid.json"
);
const versions: { plugId: number; id: number; url?: string }[] = new Array();
let pagePromises: Promise<void>[] = new Array();
let i = 0;
async function fetchVersions(id: any) {
  try {
    const res = await fetch(
      `https://api.spiget.org/v2/resources/${id}/versions?size=9999`
    );
    versions.push({ plugId: id, ...(await res.json()) });
  } catch (e: any) {
    console.log(e);
  }
}
for (const name in names) {
  const id = names[name].spigot;
  console.log(id);
  fetchVersions(id);
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 10);
  });
}

for (const version of versions) {
  const verid = version.id;
  console.log("verid: ", verid);
  if (veridCid[verid] === undefined) {
    console.log("passed");
    if (i % 7 === 6) {
      await Promise.all(pagePromises);
      pagePromises = new Array();
    }

    const downloadPath = downloadPathArr[i % 7];
    const page = pageArr[i % 7];

    async function loadPage() {
      const url =
        version.url || `resources/${version.plugId}/download?version=${verid}`;

      console.log(url);

      try {
        const waitForPagePromise = new Promise<void>((resolve, reject) => {
          // await page.goto(url, { waitUntil: "networkidle0" }); timeout after 30 sek
          async function waitForPage() {
            try {
              await page.goto(`https://spigotmc.org/${url}`, {
                waitUntil: "networkidle0",
              });
            } catch (e) {
              console.log(e);
            }
            resolve();
          }

          waitForPage();
          setTimeout(() => {
            reject();
          }, 30000);
        });
        await waitForPagePromise;
      } catch (e) {
        console.log(e);
      }

      const cid = await fileToCid(
        await checkIfFileIsDownloaded(downloadPath),
        downloadPath
      );
      console.log(cid);

      Object.assign(veridCid, {
        [verid]: cid,
      });
    }

    pagePromises.push(loadPage());
    i++;
  }
  await fs.writeJson("../../repository/verid.json", veridCid);
}
