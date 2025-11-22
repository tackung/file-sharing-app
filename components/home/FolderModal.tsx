import React from "react";

interface Props {
  isOpen: boolean;
  currentPath: string;
  newFolderName: string;
  folderNameError: string | null;
  folderNameInputRef: React.RefObject<HTMLInputElement>;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

const FolderModal: React.FC<Props> = ({
  isOpen,
  currentPath,
  newFolderName,
  folderNameError,
  folderNameInputRef,
  onChangeName,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-slate-100">
        <div>
          <p className="text-xs text-slate-500">フォルダ作成</p>
          <h3 className="text-lg font-semibold text-slate-800">
            新しいフォルダを追加
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            作成先: uploads/{currentPath || ""}
          </p>
        </div>
        <div className="space-y-2">
          <input
            ref={folderNameInputRef}
            type="text"
            value={newFolderName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder="フォルダ名を入力"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {folderNameError && (
            <p className="text-xs text-red-500">{folderNameError}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
          >
            キャンセル
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-sm"
          >
            作成する
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
