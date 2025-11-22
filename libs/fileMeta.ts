import {
  faFile,
  faFileArchive,
  faFileAudio,
  faFileImage,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export const getFileIcon = (filename: string): IconDefinition => {
  const extension = filename.split(".").pop();
  switch (extension) {
    case "wav":
    case "mp3":
      return faFileAudio;
    case "zip":
      return faFileArchive;
    case "png":
    case "jpg":
    case "jpeg":
      return faFileImage;
    default:
      return faFile;
  }
};

export const isAudio = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension === "mp3" || extension === "wav";
};

export const formatFileSize = (sizeInBytes: number) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (sizeInBytes === 0) return "0 Byte";

  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  if (i === 0) return `${sizeInBytes} ${sizes[i]}`;
  return `${(sizeInBytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const convertToJST = (dateString: string) => {
  const date = new Date(dateString);
  const jstDate = new Date(date.getTime());

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(jstDate);
};
