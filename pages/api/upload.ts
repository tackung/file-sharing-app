import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, File } from "formidable";
import { Storage } from "@google-cloud/storage";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    res.status(500).send("Server misconfiguration");
    return;
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).send(err);
      return;
    }

    let file: File | undefined;
    if (Array.isArray(files.file)) {
      file = files.file[0];
    } else {
      file = files.file;
    }

    if (!file || !file.filepath) {
      res.status(400).send("No file uploaded");
      return;
    } else if (Array.isArray(file)) {
      file = file[0];
    }

    const storage = new Storage({
      keyFilename: process.env.STORAGE_SA_KEY,
    });
    const bucket = storage.bucket(bucketName);

    if (file && file.filepath) {
      try {
        await bucket.upload(file.filepath, {
          destination: `uploads/${file.originalFilename}`,
        });
        res.status(200).send("File uploaded successfully");
      } catch (error) {
        console.error("Error uploading to GCS:", error);
        res.status(500).send("Error uploading to GCS");
      } finally {
        fs.unlink(file.filepath, (err) => {
          if (err) console.error("Error removing temp file", err);
        });
      }
    } else {
      res.status(400).send("File path not found");
    }
  });
}
