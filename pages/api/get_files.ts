import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import { normalizePath } from "./utils/path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    res.status(500).send("Server misconfiguration");
    return;
  }

  try {
    const rawPath = Array.isArray(req.query.path)
      ? req.query.path[0]
      : (req.query.path as string | undefined);
    const path = normalizePath(rawPath);
    const storage = new Storage({ keyFilename: process.env.STORAGE_SA_KEY });
    const bucket = storage.bucket(bucketName);
    const prefix = `uploads/${path}`;
    const [myFiles, , apiResponse] = await bucket.getFiles({
      prefix,
      delimiter: "/",
      autoPaginate: false,
    });

    const prefixes =
      (apiResponse as { prefixes?: string[] } | undefined)?.prefixes || [];
    const folderSet = new Set<string>();
    prefixes.forEach((p) => {
      folderSet.add(p.replace(prefix, ""));
    });

    // フォルダ内にファイル(.keepを含む)がある場合はファイルパスからもフォルダを抽出
    myFiles.forEach((file) => {
      const relative = file.name.replace(prefix, "");
      const firstSlash = relative.indexOf("/");
      if (firstSlash > 0) {
        folderSet.add(relative.slice(0, firstSlash + 1));
      }
    });
    const folders = Array.from(folderSet);

    const files = myFiles
      .filter((file) => file.name !== prefix)
      .map((file) => ({
        name: file.name.replace(prefix, ""),
        size: file.metadata.size,
        updated: file.metadata.updated,
      }))
      .filter((file) => file.name !== ".keep");

    res.status(200).json({ folders, files });
  } catch (error) {
    console.log("Error retrieving file list:", error);
    res.status(500).json({ message: "Error retrieving file list" });
  }
}
