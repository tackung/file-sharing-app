import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faTrash } from "@fortawesome/free-solid-svg-icons";
import { TailSpin } from "react-loader-spinner";

interface Props {
  folders: string[];
  loading: boolean;
  onFolderClick: (folder: string) => void;
  onDeleteFolderClick: (folder: string) => void;
}

const FolderGrid: React.FC<Props> = ({
  folders,
  loading,
  onFolderClick,
  onDeleteFolderClick,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center text-slate-600 py-6">
        <TailSpin color="#3b82f6" height={30} width={30} />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>フォルダはありません。右上の「フォルダ作成」で追加できます。</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {folders.map((folder) => (
        <div
          key={folder}
          className="relative group rounded-xl border border-white/60 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
          onClick={() => onFolderClick(folder)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolderClick(folder);
            }}
            aria-label="Delete folder"
            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
          >
            <FontAwesomeIcon icon={faTrash} className="h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <FontAwesomeIcon icon={faFolder} className="text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-800 truncate">
                {folder}
              </p>
              <p className="text-xs text-slate-500">フォルダを開く</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FolderGrid;
