import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import { normalizePath, validateFileName } from "./utils/path";

const storage = new Storage({ keyFilename: process.env.STORAGE_SA_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    res.status(500).send("Server misconfiguration");
    return;
  }

  try {
    if (req.method === "POST") {
      const { path: rawPath, name, force } = req.body;
      const path = normalizePath(rawPath);
      const folderName = validateFileName(name);

      const bucket = storage.bucket(bucketName);
      const prefix = `uploads/${path}${folderName}/`;
      const placeholder = bucket.file(`${prefix}.keep`);

      const [exists] = await placeholder.exists();
      if (exists && !force) {
        res.status(409).json({ message: "Folder already exists" });
        return;
      }

      await placeholder.save("", { contentType: "application/octet-stream" });
      res.status(200).json({ message: "Folder created" });
      return;
    }

    if (req.method === "DELETE") {
      const rawPath = req.query.path as string | undefined;
      const targetPath = normalizePath(rawPath);
      if (!targetPath) {
        res.status(400).json({ message: "Path is required" });
        return;
      }

      const bucket = storage.bucket(bucketName);
      const prefix = `uploads/${targetPath}`;

      const [files] = await bucket.getFiles({ prefix });
      if (files.length === 0) {
        res.status(200).json({ message: "Folder deleted" });
        return;
      }

      await bucket.deleteFiles({ prefix });
      res.status(200).json({ message: "Folder deleted" });
      return;
    }

    res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in folders API:", error);
    res.status(500).json({ message: "Error handling folder request" });
  }
}
