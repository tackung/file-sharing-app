import React from "react";

interface Props {
  selectedFiles: File[];
  onRemove: (fileName: string) => void;
}

const SelectedFiles: React.FC<Props> = ({ selectedFiles, onRemove }) => {
  if (selectedFiles.length === 0) return null;

  return (
    <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/60">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-slate-800">
          選択されたファイル ({selectedFiles.length}件)
        </span>
        <span className="text-xs text-slate-500">
          不要なファイルは×で削除できます
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedFiles.map((file) => (
          <span
            key={file.name}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm"
          >
            <span className="text-xs truncate max-w-[180px]">{file.name}</span>
            <button
              type="button"
              onClick={() => onRemove(file.name)}
              className="text-slate-400 hover:text-red-500 transition-colors"
              aria-label={`${file.name} を選択から削除`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SelectedFiles;
