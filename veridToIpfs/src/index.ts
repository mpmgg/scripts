// Imports

import { NFTStorage } from "nft.storage";
import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";
import mainLogic from "./components/mainLogic";
import launchWebBrowser from "./components/launchWebBrowser";
import fetchVersions from "./components/fetchVersions";
// Load environment variables from .env file
dotenv.config();

// Prepare

// Launch WebBrowser

const { pageArr, downloadPathArr } = await launchWebBrowser();

// Initialize NFT.storage client
const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_TOKEN || "";
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const namesRaw = await fs.readFile(path.resolve("../../repository/name.json"));
const names = JSON.parse("" + namesRaw);
const veridCid: { [key: number]: string } = await fs.readJson(
  "../../repository/verid.json"
);
let pagePromises: Promise<void>[] = new Array();
let i = 0;

const fetchVersionsPromises: Promise<
  { plugId: number; id: number; url?: string | undefined }[]
>[] = new Array();
for (const name in names) {
  const id = names[name].spigot;
  console.log(id);
  fetchVersionsPromises.push(fetchVersions(id));
  await new Promise((resolve, reject) => {
    setTimeout(resolve, 50);
  });
}
const versions: { plugId: number; id: number; url?: string }[] = new Array();

Promise.all(fetchVersionsPromises).then((values) => {
  for (let i = 0; i < values.length; i++) {
    versions.push(...values[i]);
  }
});

fs.writeJson("../../repository/versions.json", versions);

for (const version of versions) {
  i = await mainLogic(
    version,
    veridCid,
    pagePromises,
    pageArr,
    downloadPathArr,
    i,
    client
  );
}
