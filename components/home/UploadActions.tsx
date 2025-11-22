import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faPlus, faUpload } from "@fortawesome/free-solid-svg-icons";
import SelectedFiles from "@/components/home/SelectedFiles";

interface Props {
  currentPath: string;
  selectedFiles: File[];
  uploading: boolean;
  onUpload: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onOpenFolderModal: () => void;
  onReload: () => void;
  onRemoveSelectedFile: (fileName: string) => void;
}

const UploadActions: React.FC<Props> = ({
  currentPath,
  selectedFiles,
  uploading,
  onUpload,
  onFileChange,
  fileInputRef,
  onOpenFolderModal,
  onReload,
  onRemoveSelectedFile,
}) => {
  const selectedCount = selectedFiles.length;

  return (
    <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm border border-white/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">アップロード先</p>
          <p className="text-base font-semibold text-slate-800">
            uploads/{currentPath || ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 cursor-pointer rounded-full bg-blue-600 text-white px-4 py-2 text-sm shadow-sm hover:bg-blue-700 transition-colors"
          >
            <FontAwesomeIcon icon={faFile} className="h-4" />
            <span>ファイルを選択</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              ref={fileInputRef}
              onChange={onFileChange}
              multiple
              accept=".wav,.mp3,.zip,.png,.pdf,.jpg,.jpeg"
            />
          </label>
          <button
            onClick={onUpload}
            disabled={selectedCount === 0 || uploading}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
              selectedCount > 0 && !uploading
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <FontAwesomeIcon icon={faUpload} className="h-4" />
            {uploading ? "アップロード中..." : "アップロード"}
          </button>
          <button
            onClick={onOpenFolderModal}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors bg-white text-blue-700 border border-blue-100 hover:border-blue-300"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4" />
            フォルダ作成
          </button>
          <button
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition-colors bg-white text-slate-600 border border-slate-100 hover:border-slate-300"
          >
            ↺ 再読み込み
          </button>
        </div>
      </div>
      <SelectedFiles
        selectedFiles={selectedFiles}
        onRemove={onRemoveSelectedFile}
      />
    </div>
  );
};

export default UploadActions;
