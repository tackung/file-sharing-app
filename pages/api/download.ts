import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    res.status(500).send("Server misconfiguration");
    return;
  }

  try {
    const fileName = req.query.file as string;
    if (!fileName) {
      res.status(400).send("File name is required");
      return;
    }

    const storage = new Storage({
      keyFilename: process.env.STORAGE_SA_KEY,
    });
    const bucket = storage.bucket(bucketName);

    const file = bucket.file(`uploads/${fileName}`);
    const exists = await file.exists();
    if (!exists[0]) {
      res.status(404).send("File not found");
      return;
    }

    const [content] = await file.download();
    const metadata = await file.getMetadata();

    const contentType = metadata[0].contentType || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(content);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).send("Error downloading file");
  }
}
