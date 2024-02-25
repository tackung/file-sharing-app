import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";

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
    const storage = new Storage({ keyFilename: process.env.STORAGE_SA_KEY });
    const bucket = storage.bucket(bucketName);
    const [myFiles] = await bucket.getFiles({ prefix: "uploads/" });
    const fileData = myFiles.map((file) => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
    }));

    res.status(200).json(fileData);
  } catch (error) {
    console.log("Error retrieving file list:", error);
    res.status(500).json({ message: "Error retrieving file list" });
  }
}
