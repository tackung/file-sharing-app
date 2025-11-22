import { NextApiRequest, NextApiResponse } from "next";
import { Storage, GetFileMetadataResponse } from "@google-cloud/storage";
import { normalizePath, validateFileName } from "./utils/path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { file, path: rawPath } = req.query;

  if (!file || Array.isArray(file)) {
    return res.status(400).json({ error: "Invalid file parameter" });
  }

  const bucketName = process.env.BUCKET_NAME;
  if (!bucketName) {
    console.error("Environment variable BUCKET_NAME is not defined.");
    return res.status(500).send("Server misconfiguration: BUCKET_NAME not set");
  }

  try {
    const safeFileName = validateFileName(file);
    const path = normalizePath(
      Array.isArray(rawPath) ? rawPath[0] : (rawPath as string | undefined)
    );
    const storage = new Storage({
      keyFilename: process.env.STORAGE_SA_KEY, // サービスアカウントJSONへのパス
    });
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(`uploads/${path}${safeFileName}`);
    const [fileExists] = await fileRef.exists();
    if (!fileExists) {
      console.error(`File not found on GCS: ${file}`);
      return res.status(404).json({ error: "File not found" });
    }

    // GCS メタデータの取得
    let [metadata] = (await fileRef.getMetadata()) as GetFileMetadataResponse;
    console.log("GCS Metadata for file:", file, metadata);

    // ファイルサイズや Content-Type を取り出す
    let fileSize = 0;
    if (metadata.size) {
      fileSize = parseInt(String(metadata.size), 10);
    }

    let contentType = metadata.contentType || "";

    // GCS 側で不正な contentType の場合 or 取得できない場合は拡張子で補正
    const fileLower = file.toLowerCase();
    if (
      !contentType ||
      contentType === "application/octet-stream" ||
      contentType === "audio/mpeg"
    ) {
      if (fileLower.endsWith(".wav")) {
        contentType = "audio/wav";
      } else if (fileLower.endsWith(".mp3")) {
        contentType = "audio/mpeg";
      } else {
        // 必要に応じて他の拡張子もチェック
        contentType = "application/octet-stream";
      }
    }

    console.log(
      `Final contentType for ${file}: ${contentType}, size=${fileSize}`
    );

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");

    const range = req.headers.range;
    if (range) {
      console.log(`Range request for ${file}: ${range}`);
      // 例: "bytes=0-XXXX"
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      const readStream = fileRef.createReadStream({ start, end });

      // Cloud Run で途中終了しないよう、Promiseでストリーム終了まで待つ
      return new Promise<void>((resolve, reject) => {
        readStream.on("error", (err) => {
          console.error("ReadStream error:", err);
          reject(err);
        });
        readStream.on("end", () => {
          console.log(`Range stream ended: bytes ${start}-${end}`);
          resolve();
        });
        readStream.pipe(res);
      });
    } else {
      // Range ヘッダがない場合は全体送信
      console.log(`No Range, sending entire file ${file}. Size=${fileSize}`);

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": fileSize,
      });

      const readStream = fileRef.createReadStream();
      return new Promise<void>((resolve, reject) => {
        readStream.on("error", (err) => {
          console.error("ReadStream error:", err);
          reject(err);
        });
        readStream.on("end", () => {
          console.log(`Full file stream ended for ${file}`);
          resolve();
        });
        readStream.pipe(res);
      });
    }
  } catch (error) {
    console.error("Error retrieving file:", error);
    return res.status(500).send("Error retrieving file");
  }
}
