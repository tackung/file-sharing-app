import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faFile,
  faPause,
  faPlay,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { TailSpin, ThreeDots } from "react-loader-spinner";
import { FileData } from "@/hooks/useHomePage";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Props {
  files: FileData[];
  loading: boolean;
  currentPlayingFile: string | null;
  loadingAudioFile: string | null;
  downloading: boolean;
  isAudio: (filename: string) => boolean;
  getFileIcon: (filename: string) => IconDefinition;
  formatFileSize: (size: number) => string;
  convertToJST: (dateString: string) => string;
  onPlayAudio: (filename: string) => void;
  onDownload: (filename: string) => void;
  onDelete: (filename: string) => void;
}

const FileGrid: React.FC<Props> = ({
  files,
  loading,
  currentPlayingFile,
  loadingAudioFile,
  downloading,
  isAudio,
  getFileIcon,
  formatFileSize,
  convertToJST,
  onPlayAudio,
  onDownload,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center text-slate-600 py-6">
        <TailSpin color="#3b82f6" height={30} width={30} />
        <span className="ml-2">読み込み中...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span>ファイルはありません。アップロードしてください。</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${index}`}
          className="rounded-xl border border-white/60 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <FontAwesomeIcon icon={getFileIcon(file.name)} className="text-lg" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-800 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(parseInt(file.size, 10))}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            アップロード日時: {convertToJST(file.updated)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={
                isAudio(file.name) ? () => onPlayAudio(file.name) : undefined
              }
              disabled={!isAudio(file.name)}
              aria-label={
                isAudio(file.name)
                  ? currentPlayingFile === file.name
                    ? "Stop audio"
                    : "Play audio"
                  : "File"
              }
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                isAudio(file.name)
                  ? currentPlayingFile === file.name
                    ? "bg-blue-700 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isAudio(file.name) && loadingAudioFile === file.name ? (
                <ThreeDots color="#0f172a" height={20} width={20} />
              ) : (
                <FontAwesomeIcon
                  icon={
                    isAudio(file.name)
                      ? currentPlayingFile === file.name
                        ? faPause
                        : faPlay
                      : faFile
                  }
                  className="h-3"
                />
              )}
              <span>
                {isAudio(file.name)
                  ? currentPlayingFile === file.name
                    ? "Stop"
                    : loadingAudioFile === file.name
                    ? "Loading..."
                    : "Play"
                  : ""}
              </span>
            </button>
            <button
              onClick={() => onDownload(file.name)}
              aria-label="Download file"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                downloading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white text-blue-700 border border-blue-100 hover:border-blue-300"
              }`}
              disabled={downloading}
            >
              <FontAwesomeIcon icon={faDownload} className="h-3" />
              Download
            </button>
            <button
              onClick={() => onDelete(file.name)}
              aria-label="Delete file"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors bg-white text-red-600 border border-red-100 hover:border-red-300"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileGrid;
