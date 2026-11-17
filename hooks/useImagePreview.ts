import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/libs/api";
import type { FileData } from "@/hooks/useHomePage";

export interface ImageEntry {
  status: "loading" | "ready" | "error";
  url?: string;
  expiresAt?: number;
  automaticRetries: number;
}

export const imageKey = (file: FileData) => JSON.stringify([file.name, file.updated]);

// The owner is remounted on user, folder, or list revision changes. No signed
// URLs survive that session, and stale asynchronous completions are ignored.
export default function useImagePreview(path: string) {
  const [entries, setEntries] = useState<Record<string, ImageEntry>>({});
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const cache = useRef<Record<string, ImageEntry>>({});
  const queue = useRef<Array<() => void>>([]);
  const running = useRef(0);
  const generation = useRef(0);
  const active = useRef(false);
  const controllers = useRef(new Set<AbortController>());

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      generation.current++;
      controllers.current.forEach((controller) => controller.abort());
      controllers.current.clear();
      queue.current = [];
      running.current = 0;
      cache.current = {};
    };
  }, []);

  const publish = useCallback((key: string, entry: ImageEntry) => {
    cache.current[key] = entry;
    setEntries({ ...cache.current });
  }, []);

  const pump = useCallback(function drain() {
    while (active.current && running.current < 4 && queue.current.length) {
      const job = queue.current.shift();
      if (job) job();
    }
  }, []);

  const request = useCallback((file: FileData, automaticRetries: number) => {
    if (!active.current) return;
    const key = imageKey(file);
    const requestGeneration = generation.current;
    publish(key, { status: "loading", automaticRetries });
    queue.current.push(() => {
      running.current++;
      const controller = new AbortController();
      controllers.current.add(controller);
      const isCurrent = () => active.current && requestGeneration === generation.current;
      // Begin the lifetime before requesting, leaving a minute of margin under
      // the API's 30 minute lifetime even when the response arrives slowly.
      const expiresAt = Date.now() + 29 * 60 * 1000;
      void (async () => {
        try {
          const response = await apiFetch("/api/generate_download_url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, path }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Failed to get image URL");
          const data = await response.json();
          if (typeof data.url !== "string" || !data.url) {
            throw new Error("Invalid image URL");
          }
          if (isCurrent()) {
            publish(key, { status: "ready", url: data.url, expiresAt, automaticRetries });
          }
        } catch {
          if (isCurrent()) publish(key, { status: "error", automaticRetries });
        } finally {
          controllers.current.delete(controller);
          if (isCurrent()) {
            running.current--;
            pump();
          }
        }
      })();
    });
    pump();
  }, [path, publish, pump]);

  const ensureImage = useCallback((file: FileData) => {
    const entry = cache.current[imageKey(file)];
    if (entry?.status === "loading" || entry?.status === "error") return;
    if (entry?.status === "ready" && (entry.expiresAt ?? 0) > Date.now()) return;
    request(file, 0);
  }, [request]);

  const retryImage = useCallback((file: FileData) => {
    if (cache.current[imageKey(file)]?.status !== "loading") request(file, 0);
  }, [request]);

  const imageFailed = useCallback((file: FileData, failedUrl: string) => {
    const key = imageKey(file);
    const entry = cache.current[key];
    // Thumbnail and modal can report the same failure; only handle it once.
    if (!active.current || entry?.status !== "ready" || entry.url !== failedUrl) return;
    if (entry.automaticRetries === 0) request(file, 1);
    else publish(key, { status: "error", automaticRetries: 1 });
  }, [publish, request]);

  const openImage = useCallback((file: FileData) => {
    ensureImage(file);
    setSelectedFile(file);
  }, [ensureImage]);
  const closeImage = useCallback(() => setSelectedFile(null), []);

  return { entries, selectedFile, ensureImage, retryImage, imageFailed, openImage, closeImage };
}

export type ImagePreviewController = ReturnType<typeof useImagePreview>;
