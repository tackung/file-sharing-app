import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/router";
import { logout } from "@/libs/auth";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAudio,
  faFileArchive,
  faFileImage,
  faFile,
  faDownload,
  faUpload,
  faTrash,
  faPause,
  faPlay,
  faFolder,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { TailSpin, ThreeDots } from "react-loader-spinner";

interface FileData {
  name: string;
  size: string;
  updated: string;
}

interface DialogConfig {
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const Home: React.FC = () => {
  const user = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<DialogConfig | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [folderNameError, setFolderNameError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const fetchFileList = async (path = currentPath) => {
    setLoadingList(true);
    try {
      const response = await fetch(
        `/api/get_files?path=${encodeURIComponent(path)}`
      );
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
        setFiles(data.files || []);
      } else {
        console.error("Failed to fetch files");
      }
    } catch (error) {
      console.error("Failed to fetch files", error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchFileList();
  }, [currentPath]);

  useEffect(() => {
    if (!isFolderModalOpen) return;
    const timer = window.setTimeout(() => {
      folderNameInputRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isFolderModalOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFile(files[0]);
      setSelectedFileName(files[0].name);
    }
  };

  const openConfirm = (config: DialogConfig) => {
    setConfirmDialog(config);
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const openFolderModal = () => {
    setNewFolderName("");
    setFolderNameError(null);
    setIsFolderModalOpen(true);
  };

  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
    setNewFolderName("");
    setFolderNameError(null);
  };

  const performUpload = async () => {
    if (!file) return;
    try {
      const response = await fetch("/api/generate_upload_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          path: currentPath,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { url } = await response.json();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.timeout = 600000; // 600,000ms = 10min

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          alert("ファイルがアップロードされました！");
          setFile(null);
          setSelectedFileName(null);
          fetchFileList();
          setUploadProgress(0);
        } else {
          alert("ファイルのアップロードに失敗しました");
          setUploadProgress(0);
        }
      };

      xhr.onerror = () => {
        alert("アップロード中にエラーが発生しました");
        setUploadProgress(0);
      };

      xhr.send(file);
    } catch (error) {
      console.log("アップロード中にエラーが発生しました", error);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    const exists = files.some((f) => f.name === file.name);
    if (exists) {
      openConfirm({
        message: `同じフォルダに"${file.name}"が存在します。上書きしますか？`,
        confirmLabel: "上書きする",
        cancelLabel: "やめる",
        onConfirm: () => {
          closeConfirm();
          performUpload();
        },
      });
      return;
    }

    await performUpload();
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop();
    switch (extension) {
      case "wav":
      case "mp3":
        return faFileAudio;
      case "zip":
        return faFileArchive;
      case "png":
      case "jpg":
      case "jpeg":
        return faFileImage;
      default:
        return faFile;
    }
  };

  const isAudio = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension === "mp3" || extension === "wav";
  };

  const formatFileSize = (sizeInBytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (sizeInBytes === 0) return "0 Byte";

    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    if (i === 0) return `${sizeInBytes} ${sizes[i]}`;
    return `${(sizeInBytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const convertToJST = (dateString: string) => {
    const date = new Date(dateString);
    const jstDate = new Date(date.getTime());

    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(jstDate);
  };

  const [currentPlayingFile, setCurrentPlayingFile] = useState<string | null>(
    null
  );
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const folderNameInputRef = useRef<HTMLInputElement | null>(null);
  const [loadingAudioFile, setLoadingAudioFile] = useState<string | null>(null);

  const handlePlayAudio = async (filename: string) => {
    if (currentPlayingFile === filename && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setCurrentPlayingFile(null);
      currentAudioRef.current = null;
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setCurrentPlayingFile(null);
    }

    const audio = new Audio(
      `/api/get_audio?file=${encodeURIComponent(
        filename
      )}&path=${encodeURIComponent(currentPath)}`
    );
    audio.setAttribute("playsinline", "true");

    setLoadingAudioFile(filename);

    audio.onwaiting = () => {
      setLoadingAudioFile(filename);
    };
    audio.oncanplay = () => {
      setLoadingAudioFile(null);
    };
    audio.oncanplaythrough = () => {
      setLoadingAudioFile(null);
    };
    audio.onerror = () => {
      setLoadingAudioFile(null);
    };
    audio.onended = () => {
      currentAudioRef.current = null;
      setCurrentPlayingFile(null);
      setLoadingAudioFile(null);
    };

    audio
      .play()
      .then(() => {
        currentAudioRef.current = audio;
        setCurrentPlayingFile(filename);
      })
      .catch((err) => {
        console.error("音声再生に失敗しました", err);
        setLoadingAudioFile(null);
      });
  };

  const handleDownload = async (filename: string) => {
    setDownloading(true);
    try {
      const response = await fetch("/api/generate_download_url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: filename, path: currentPath }),
      });

      if (response.ok) {
        const data = await response.json();
        const url = data.url;

        const fileResponse = await fetch(url);
        const blob = await fileResponse.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        console.error("Failed file download");
      }
    } catch (error) {
      console.error("ダウンロード中にエラーが発生しました");
    } finally {
      setDownloading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const encodedFilename = encodeURIComponent(fileName);
      const response = await fetch(
        `/api/delete?file=${encodedFilename}&path=${encodeURIComponent(
          currentPath
        )}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        await fetchFileList();
      } else {
        console.error("削除に失敗しました");
      }
    } catch (error) {
      console.error("削除中にエラーが発生しました", error);
    }
  };

  const handleDeleteClick = (fileName: string) => {
    openConfirm({
      message: `"${fileName}" を削除しますか？\n※この操作は取り消せません`,
      confirmLabel: "削除する",
      cancelLabel: "キャンセル",
      onConfirm: () => {
        closeConfirm();
        deleteFile(fileName);
      },
    });
  };

  const handleCreateFolder = async (force = false) => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      setFolderNameError("フォルダ名を入力してください");
      return;
    }
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          name: trimmedName,
          force,
        }),
      });

      if (response.status === 409 && !force) {
        openConfirm({
          message: `同じ階層に"${trimmedName}"が存在します。同名で作成しますか？`,
          confirmLabel: "同名で作成",
          cancelLabel: "やめる",
          onConfirm: () => {
            closeConfirm();
            handleCreateFolder(true);
          },
        });
        return;
      }

      if (!response.ok) {
        throw new Error("フォルダ作成に失敗しました");
      }

      setNewFolderName("");
      setFolderNameError(null);
      closeFolderModal();
      fetchFileList();
    } catch (error) {
      console.error("フォルダ作成に失敗しました", error);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    try {
      const response = await fetch(
        `/api/folders?path=${encodeURIComponent(folderPath)}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("フォルダ削除に失敗しました");
      }
      fetchFileList();
    } catch (error) {
      console.error("フォルダ削除に失敗しました", error);
    }
  };

  const handleDeleteFolderClick = (folder: string) => {
    const targetPath = `${currentPath}${folder}`;
    openConfirm({
      message: `"${targetPath}" 配下の全ファイル・フォルダを削除しますか？\n※この操作は取り消せません`,
      confirmLabel: "削除する",
      cancelLabel: "やめる",
      onConfirm: () => {
        closeConfirm();
        deleteFolder(targetPath);
      },
    });
  };

  const handleFolderClick = (folder: string) => {
    setCurrentPath(`${currentPath}${folder}`);
  };

  const breadcrumbs = [
    { label: "uploads", path: "" },
    ...currentPath
      .split("/")
      .filter(Boolean)
      .map((segment, index, arr) => {
        const partialPath = arr.slice(0, index + 1).join("/") + "/";
        return { label: segment, path: partialPath };
      }),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-800">
      <Header user={user} logout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600">
            <span className="text-xs text-slate-500 mr-1">現在のフォルダ:</span>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={crumb.path} className="flex items-center gap-2">
                  <button
                    className={`transition-colors ${
                      isLast
                        ? "px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold"
                        : "text-blue-700 hover:text-blue-900"
                    }`}
                    onClick={() => setCurrentPath(crumb.path)}
                  >
                    {crumb.label}
                  </button>
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-slate-400">/</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl shadow-sm border border-white/60 p-4 flex flex-wrap items-center justify-between gap-4">
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
                onChange={handleFileChange}
                accept=".wav,.mp3,.zip,.png,.pdf,.jpg,.jpeg"
              />
            </label>
            <button
              onClick={handleUpload}
              disabled={!file}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                file
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <FontAwesomeIcon icon={faUpload} className="h-4" />
              アップロード
            </button>
            <button
              onClick={openFolderModal}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors bg-white text-blue-700 border border-blue-100 hover:border-blue-300"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4" />
              フォルダ作成
            </button>
            <button
              onClick={() => fetchFileList()}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition-colors bg-white text-slate-600 border border-slate-100 hover:border-slate-300"
            >
              ↺ 再読み込み
            </button>
          </div>
        </div>

        {selectedFileName && (
          <div className="bg-white/80 border border-white/60 rounded-lg shadow-sm px-4 py-3 text-sm text-slate-700">
            選択されたファイル: {selectedFileName}
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="bg-white/80 border border-white/60 rounded-lg shadow-sm px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>アップロード中</span>
              <span>{uploadProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          <section className="bg-white/80 backdrop-blur border border-white/60 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">フォルダ</p>
                <h5 className="text-xl font-semibold text-slate-800">
                  フォルダ一覧
                </h5>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {folders.length}件
              </span>
            </div>
            {loadingList ? (
              <div className="flex items-center justify-center text-slate-600 py-6">
                <TailSpin color="#3b82f6" height={30} width={30} />
                <span className="ml-2">読み込み中...</span>
              </div>
            ) : folders.length === 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span>
                  フォルダはありません。右上の「フォルダ作成」で追加できます。
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder}
                    className="relative group rounded-xl border border-white/60 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolderClick(folder);
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
            )}
          </section>

          <section className="bg-white/80 backdrop-blur border border-white/60 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">ファイル</p>
                <h5 className="text-xl font-semibold text-slate-800">
                  ファイル一覧
                </h5>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {files.length}件
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 mt-1">
                ※ステレオ(2ch)wavファイルはブラウザ再生できません
              </p>
            </div>
            {loadingList ? (
              <div className="flex items-center justify-center text-slate-600 py-6">
                <TailSpin color="#3b82f6" height={30} width={30} />
                <span className="ml-2">読み込み中...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span>ファイルはありません。アップロードしてください。</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="rounded-xl border border-white/60 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                        <FontAwesomeIcon
                          icon={getFileIcon(file.name)}
                          className="text-lg"
                        />
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
                          isAudio(file.name)
                            ? () => handlePlayAudio(file.name)
                            : undefined
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
                        {isAudio(file.name) &&
                        loadingAudioFile === file.name ? (
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
                        onClick={() => handleDownload(file.name)}
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
                        onClick={() => handleDeleteClick(file.name)}
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
            )}
          </section>
        </div>

        {confirmDialog && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={closeConfirm}
            confirmLabel={confirmDialog.confirmLabel}
            cancelLabel={confirmDialog.cancelLabel}
          />
        )}

        {isFolderModalOpen && (
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
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    setFolderNameError(null);
                  }}
                  placeholder="フォルダ名を入力"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {folderNameError && (
                  <p className="text-xs text-red-500">{folderNameError}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={closeFolderModal}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleCreateFolder(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-sm"
                >
                  作成する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {downloading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="flex items-center justify-center">
            <TailSpin color="#3b82f6" height={70} width={70} />
            <span className="ml-4 text-white text-lg">ダウンロード中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
