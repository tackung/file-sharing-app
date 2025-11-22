import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";
import { normalizePath, validateFileName } from "./utils/path";

const storage = new Storage({ keyFilename: process.env.STORAGE_SA_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { fileName, contentType, path: rawPath } = req.body;
  if (!fileName || !contentType) {
    res
      .status(400)
      .json({ message: "File name and content type are required" });
    return;
  }

  try {
    const path = normalizePath(rawPath);
    const safeFileName = validateFileName(fileName);
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      throw new Error("Environment variable BUCKET_NAME is not defined");
    }
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`uploads/${path}${safeFileName}`);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 30 * 60 * 1000, // 30分後に失効
      contentType,
    });

    res.status(200).json({ url });
  } catch (error) {
    console.log("Error generating signed URL: ", error);
    res.status(500).json({ message: "Error generating signed URL" });
  }
}
