import React from "react";

interface Props {
  uploading: boolean;
  uploadStatus: {
    currentFileName: string | null;
    currentIndex: number;
    total: number;
  };
  uploadProgress: number;
}

const UploadProgress: React.FC<Props> = ({
  uploading,
  uploadStatus,
  uploadProgress,
}) => {
  if (!uploading) return null;

  return (
    <div className="bg-white/80 border border-white/60 rounded-lg shadow-sm px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <span>
          アップロード中 ({uploadStatus.currentIndex + 1}/
          {uploadStatus.total}件)
        </span>
        <span className="text-slate-700 font-semibold">
          {uploadStatus.currentFileName}
        </span>
        <span>{uploadProgress.toFixed(1)}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ width: `${Math.min(uploadProgress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default UploadProgress;
