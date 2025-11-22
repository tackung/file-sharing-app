import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import { normalizePath, validateFileName } from "./utils/path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { fileName, path: rawPath } = req.body;

  if (!fileName) {
    res.status(400).json({ message: "File name is required" });
    return;
  }

  try {
    const path = normalizePath(rawPath);
    const safeFileName = validateFileName(fileName);
    const storage = new Storage({ keyFilename: process.env.STORAGE_SA_KEY });
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      console.error("Environment variable BUCKET_NAME is not defined");
      res.status(500).send("Server misconfigration");
      return;
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`uploads/${path}${safeFileName}`);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 30 * 60 * 1000, // 30分後に失効
    });

    res.status(200).json({ url });
  } catch (error) {
    console.log("Error generating signed URL: ", error);
    res.status(500).json({ message: "Error generating signed URL" });
  }
}
