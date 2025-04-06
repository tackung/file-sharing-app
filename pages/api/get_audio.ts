import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from "@google-cloud/storage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { file } = req.query;

  if (!file || Array.isArray(file)) {
    res.status(400).json({ error: 'Invalid file parameter' });
    return;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    res.status(500).send("Server misconfiguration");
    return;
  }

  try {
    const storage = new Storage({
      keyFilename: process.env.STORAGE_SA_KEY,
    });
    const bucket = storage.bucket(bucketName);

    const fileRef = bucket.file(`uploads/${file}`);
    const [fileExists] = await fileRef.exists();

    if (!fileExists) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const [fileData] = await fileRef.download();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(fileData);
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).send("Error retrieving file");
  }
}
