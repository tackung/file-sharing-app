import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImage } from "@fortawesome/free-solid-svg-icons";
import type { FileData } from "@/hooks/useHomePage";
import { imageKey, type ImagePreviewController } from "@/hooks/useImagePreview";

interface Props {
  file: FileData;
  preview: ImagePreviewController;
}

function LoadedImage({ file, url, preview, thumbnail }: Props & { url: string; thumbnail: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && <span role="status" className="absolute text-sm text-slate-500">画像を読み込み中...</span>}
      {/* Signed original URLs are intentionally loaded directly without an image proxy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={file.name}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => preview.imageFailed(file, url)}
        className={`${thumbnail ? "h-40 w-full" : "max-h-[70dvh] max-w-full"} object-contain ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export function ImageContent({ file, preview, thumbnail = false }: Props & { thumbnail?: boolean }) {
  const entry = preview.entries[imageKey(file)];
  if (entry?.status === "ready" && entry.url) {
    return <LoadedImage key={entry.url} file={file} url={entry.url} preview={preview} thumbnail={thumbnail} />;
  }
  if (entry?.status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 p-4 text-sm text-slate-600">
        <FontAwesomeIcon icon={faFileImage} className="h-6" />
        <span role="status">画像を読み込めませんでした。</span>
        <button
          type="button"
          onClick={() => preview.retryImage(file)}
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 font-semibold text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          再試行
        </button>
      </div>
    );
  }
  return <span role="status" className="text-sm text-slate-500">画像を読み込み中...</span>;
}

export default function ImageThumbnail({ file, preview }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { ensureImage } = preview;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible) ensureImage(file);
  }, [visible, file, ensureImage]);

  const failed = preview.entries[imageKey(file)]?.status === "error";
  return (
    <div ref={container} className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      {visible ? <ImageContent file={file} preview={preview} thumbnail /> : <FontAwesomeIcon icon={faFileImage} className="h-8 text-slate-400" />}
      {!failed && (
        <button
          type="button"
          onClick={() => preview.openImage(file)}
          aria-label={`${file.name}を表示`}
          className="absolute inset-0 rounded-lg hover:bg-blue-500/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        />
      )}
    </div>
  );
}
