import fs from "fs-extra";
import { NFTStorage } from "nft.storage";
import { Page } from "puppeteer";
import checkIfFileIsDownloaded from "./checkIfFileIsDownloaded";
import fileToCid from "./fileToCid";

export default async function mainLogic(
  version: {
    plugId: number;
    id: number;
    url?: string | undefined;
  },
  veridCid: {
    [key: number]: string;
  },
  pagePromises: Promise<void>[],
  pageArr: Page[],
  downloadPathArr: string[],
  i: number,
  client: NFTStorage
) {
  const verid = version.id;
  console.log("verid: ", verid);
  if (veridCid[verid] === undefined || veridCid[verid] === null) {
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

      const waitForPagePromise = new Promise<void>((resolve, reject) => {
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
        }, 20000);
      });

      await waitForPagePromise.catch((e) => {
        console.log(e);
      });

      const cid = await fileToCid(
        await checkIfFileIsDownloaded(downloadPath),
        downloadPath,
        client
      );
      console.log(cid);

      Object.assign(veridCid, {
        [verid]: cid,
      });
    }

    pagePromises.push(loadPage());
  }
  await fs.writeJson("../../repository/verid.json", veridCid);
  return i++;
}
