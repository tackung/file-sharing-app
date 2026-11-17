import { useEffect, useId, useRef } from "react";
import type { FileData } from "@/hooks/useHomePage";
import type { ImagePreviewController } from "@/hooks/useImagePreview";
import { ImageContent } from "./ImageThumbnail";

interface Props {
  file: FileData;
  preview: ImagePreviewController;
  currentIndex: number;
  imageCount: number;
  onNavigate: (direction: -1 | 1) => void;
}

export default function ImagePreviewModal({ file, preview, currentIndex, imageCount, onNavigate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const { closeImage } = preview;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < imageCount - 1;
  const navigate = (direction: -1 | 1) => {
    const destination = currentIndex + direction;
    if (destination < 0 || destination >= imageCount) return;
    const buttonToDisable = destination === 0 ? previousButton.current
      : destination === imageCount - 1 ? nextButton.current : null;
    if (buttonToDisable && document.activeElement === buttonToDisable) {
      closeButton.current?.focus({ preventScroll: true });
    }
    onNavigate(direction);
  };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    // Native modal dialogs make the rest of the page inert and contain Tab focus.
    element.showModal();
    closeButton.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    // Reaching either end must not leave keyboard focus on a disabled button.
    const focused = document.activeElement;
    if ((!hasPrevious && focused === previousButton.current) ||
        (!hasNext && focused === nextButton.current)) {
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [hasPrevious, hasNext]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => { event.preventDefault(); closeImage(); }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeImage();
      }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-5xl max-h-[90dvh] overflow-auto rounded-2xl bg-white p-4 text-slate-800 shadow-xl backdrop:bg-slate-900/70 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={titleId} className="min-w-0 break-all text-lg font-semibold">{file.name}</h2>
        <button
          ref={closeButton}
          type="button"
          onClick={closeImage}
          className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500"
        >✗ Close</button>
      </div>
      <div className="relative flex min-h-40 items-center justify-center rounded-lg bg-slate-100 p-2">
        <ImageContent file={file} preview={preview} />
      </div>
      <nav aria-label="画像の切り替え" className="mt-4 flex items-center justify-between gap-2">
        <button
          ref={previousButton}
          type="button"
          disabled={!hasPrevious}
          onClick={() => navigate(-1)}
          aria-label="Prev image"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100"
        >◀ Prev</button>
        <span role="status" aria-atomic="true" className="shrink-0 text-sm text-slate-600">
          {currentIndex + 1} / {imageCount}
        </span>
        <button
          ref={nextButton}
          type="button"
          disabled={!hasNext}
          onClick={() => navigate(1)}
          aria-label="Next image"
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-100"
        >Next ▶</button>
      </nav>
    </dialog>
  );
}
