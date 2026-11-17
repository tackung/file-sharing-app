import { useEffect, useMemo } from "react";
import useImagePreview, { imageKey } from "@/hooks/useImagePreview";
import { isImage } from "@/libs/fileMeta";
import FileGrid, { type FileGridProps } from "./FileGrid";
import ImagePreviewModal from "./ImagePreviewModal";

// This component's key in home.tsx defines the lifetime of signed URLs.
export default function ImageFileBrowser({ currentPath, ...props }: Omit<FileGridProps, "imagePreview"> & { currentPath: string }) {
  const preview = useImagePreview(currentPath);
  const images = useMemo(() => props.files.filter((file) => isImage(file.name)), [props.files]);
  const { selectedFile, closeImage } = preview;
  const currentIndex = selectedFile
    ? images.findIndex((file) => imageKey(file) === imageKey(selectedFile))
    : -1;

  useEffect(() => {
    if (selectedFile && currentIndex < 0) closeImage();
  }, [selectedFile, currentIndex, closeImage]);

  const navigate = (direction: -1 | 1) => {
    const nextFile = images[currentIndex + direction];
    if (currentIndex >= 0 && nextFile) preview.openImage(nextFile);
  };

  return (
    <>
      <FileGrid {...props} imagePreview={preview} />
      {selectedFile && currentIndex >= 0 && (
        <ImagePreviewModal
          file={selectedFile}
          preview={preview}
          currentIndex={currentIndex}
          imageCount={images.length}
          onNavigate={navigate}
        />
      )}
    </>
  );
}
