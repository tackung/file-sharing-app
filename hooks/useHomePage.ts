import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth";
import { getFileIcon, isAudio, formatFileSize, convertToJST } from "@/libs/fileMeta";

export interface FileData {
  name: string;
  size: string;
  updated: string;
}

export interface DialogConfig {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

type SortKey = "name" | "updated";

const useHomePage = () => {
  const user = useAuth();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<DialogConfig | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<{
    currentFileName: string | null;
    currentIndex: number;
    total: number;
  }>({
    currentFileName: null,
    currentIndex: 0,
    total: 0,
  });
  const [uploading, setUploading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [folderNameError, setFolderNameError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [currentPlayingFile, setCurrentPlayingFile] = useState<string | null>(
    null
  );
  const [loadingAudioFile, setLoadingAudioFile] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterText, setFilterText] = useState<string>("");

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderNameInputRef = useRef<HTMLInputElement | null>(null);

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

  const openConfirm = (config: DialogConfig) => {
    setConfirmDialog(config);
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setSelectedFiles((prev) => {
        const existingNames = new Set(prev.map((file) => file.name));
        const newFiles = fileArray.filter(
          (file) => !existingNames.has(file.name)
        );
        return [...prev, ...newFiles];
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveSelectedFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const performUpload = async (uploadTargets: File[]) => {
    if (uploadTargets.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({
      currentFileName: uploadTargets[0].name,
      currentIndex: 0,
      total: uploadTargets.length,
    });

    try {
      for (let i = 0; i < uploadTargets.length; i++) {
        const file = uploadTargets[i];
        setUploadStatus({
          currentFileName: file.name,
          currentIndex: i,
          total: uploadTargets.length,
        });
        setUploadProgress(0);

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
          throw new Error(`${file.name} のアップロードURL取得に失敗しました`);
        }

        const { url } = await response.json();

        const uploadResult = await new Promise<boolean>((resolve) => {
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
              resolve(true);
            } else {
              resolve(false);
            }
          };

          xhr.onerror = () => {
            resolve(false);
          };

          xhr.ontimeout = () => {
            resolve(false);
          };

          xhr.send(file);
        });

        if (!uploadResult) {
          throw new Error(`${file.name} のアップロードに失敗しました`);
        }
      }

      alert("ファイルがアップロードされました！");
      setSelectedFiles([]);
      setUploadProgress(0);
      setUploadStatus({ currentFileName: null, currentIndex: 0, total: 0 });
      fetchFileList();
    } catch (error) {
      console.log("アップロード中にエラーが発生しました", error);
      const message =
        error instanceof Error
          ? error.message
          : "アップロード中にエラーが発生しました";
      alert(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert("ファイルを選択してください");
      return;
    }

    const existingNames = new Set(files.map((f) => f.name));
    const duplicateFiles = selectedFiles.filter((file) =>
      existingNames.has(file.name)
    );

    const uploadWithoutDuplicates = () => {
      const targets = selectedFiles.filter(
        (file) => !existingNames.has(file.name)
      );
      if (targets.length === 0) {
        alert("すべて同名ファイルのためアップロードを中止しました");
        return;
      }
      performUpload(targets);
    };

    if (duplicateFiles.length > 0) {
      const duplicateList = duplicateFiles
        .map((file) => `・${file.name}`)
        .join("\n");
      openConfirm({
        message: `同じフォルダに以下のファイルが存在します。\n${duplicateList}\n\n上書きしてアップロードしますか？`,
        confirmLabel: "上書きしてアップロード",
        cancelLabel: "重複をスキップ",
        variant: "primary",
        onConfirm: () => {
          closeConfirm();
          performUpload(selectedFiles);
        },
        onCancel: () => {
          closeConfirm();
          uploadWithoutDuplicates();
        },
      });
      return;
    }

    await performUpload(selectedFiles);
  };

  const displayFiles = useMemo(() => {
    const keyword = filterText.trim().toLowerCase();
    const filtered = keyword
      ? files.filter((file) => file.name.toLowerCase().includes(keyword))
      : files;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      const aTime = new Date(a.updated).getTime();
      const bTime = new Date(b.updated).getTime();
      return aTime - bTime;
    });

    if (sortDirection === "desc") {
      sorted.reverse();
    }

    return sorted;
  }, [files, filterText, sortDirection, sortKey]);

  const handleSortKeyChange = (value: SortKey) => {
    setSortKey(value);
  };

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleFilterTextChange = (value: string) => {
    setFilterText(value);
  };

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

  const handleFolderNameChange = (value: string) => {
    setNewFolderName(value);
    setFolderNameError(null);
  };

  return {
    user,
    breadcrumbs,
    selectedFiles,
    files,
    folders,
    confirmDialog,
    uploadProgress,
    uploadStatus,
    uploading,
    downloading,
    currentPath,
    newFolderName,
    folderNameError,
    loadingList,
    isFolderModalOpen,
    currentPlayingFile,
    loadingAudioFile,
    sortKey,
    sortDirection,
    filterText,
    fileInputRef,
    folderNameInputRef,
    displayFiles,
    handleFileChange,
    handleRemoveSelectedFile,
    handleUpload,
    handlePlayAudio,
    handleDownload,
    handleDeleteClick,
    handleDeleteFolderClick,
    handleFolderClick,
    closeConfirm,
    openFolderModal,
    closeFolderModal,
    setCurrentPath,
    fetchFileList,
    setNewFolderName,
    handleFolderNameChange,
    handleCreateFolder,
    handleSortKeyChange,
    handleToggleSortDirection,
    handleFilterTextChange,
    getFileIcon,
    isAudio,
    formatFileSize,
    convertToJST,
  };
};

export default useHomePage;
