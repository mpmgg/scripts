import fs from "fs-extra";
import path from "path";

// Checks when file is downloaded, returns file data and path

export default async function checkIfFileIsDownloaded(
  downloadPath: string
): Promise<{
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
    console.log("pathOfFile: ", path.resolve(downloadPath, files[0]));
    return { data: fileData, path: file };
  } else {
    fs.emptyDir(downloadPath);
    return { data: null, path: "" };
  }
}
