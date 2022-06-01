import fs from "fs-extra";
import { NFTStorage } from "nft.storage";

// Uploads file to IPFS, empties dir, returns CID

export default async function fileToCid(
  file: {
    data: Buffer | null;
    path: string;
  },
  downloadPath: string,
  client: NFTStorage
): Promise<string | null> {
  if (file.data) {
    try {
      const blob = new Blob([file.data]);
      const cid = await client.storeBlob(blob);

      console.log("Emptying download directory: " + downloadPath);
      await fs.emptyDir(downloadPath);

      return cid;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  return null;
}
