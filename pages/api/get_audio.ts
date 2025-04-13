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

    // メタデータからファイルサイズやContent-Typeを取得
    const [metadata] = await fileRef.getMetadata();
    const fileSize = parseInt(metadata.size, 10); // byteサイズ
    const contentType = metadata.contentType || "audio/mpeg";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Accept-Ranges", "bytes");

    // クライアントがRangeヘッダを送ってきていれば、部分的コンテンツを返す
    const range = req.headers.range;
    if (range) {
      // 例: "bytes=0-" "bytes=1024-2048" などをパース
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      // 終了位置が指定されていなければファイル末尾まで
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;  // チャンクサイズを計算

      // ヘッダを設定し、HTTP 206で返す
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Type": contentType,
        "Content-Length": chunkSize,
        "Accept-Ranges": "bytes",
      });

      // 指定範囲だけ GCS から読み込み、レスポンスへストリーミング
      fileRef.createReadStream({ start, end }).pipe(res);
    } else {
      // Range指定がなければ全体を一括返却
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": fileSize,
      });
      fileRef.createReadStream().pipe(res);
    }
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).send("Error retrieving file");
  }
}