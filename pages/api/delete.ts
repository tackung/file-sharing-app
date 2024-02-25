import { NextApiRequest, NextApiResponse } from "next";
import { Storage } from "@google-cloud/storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKE_NAME is not defined.");
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
    await file.delete();

    res.status(200).send("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).send("Error deleting file");
  }
}
