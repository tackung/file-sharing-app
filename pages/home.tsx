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
} from "@fortawesome/free-solid-svg-icons";
import { TailSpin, ThreeDots } from "react-loader-spinner";

interface FileData {
  name: string;
  size: string;
  updated: string;
}

const Home: React.FC = () => {
  const user = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null); // POSTアップロード用
  const [files, setFiles] = useState<FileData[]>([]); // GETファイルリスト用
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    // ユーザーがログインしていない場合は、ルートページにリダイレクト
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const fetchFileList = async () => {
    const response = await fetch("/api/get_files");
    if (response.ok) {
      const data = await response.json();

      const filterData = data
        .filter((file: FileData) => file.name !== "uploads/")
        .map((file: FileData) => ({
          ...file,
          name: file.name.replace("uploads/", ""), // ファイル名からディレクトリ名を除外
        }));

      setFiles(filterData);
    } else {
      console.error("Failed to fetch files");
    }
  };

  useEffect(() => {
    fetchFileList();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setFile(files[0]);
      setSelectedFileName(files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("ファイルを選択してください");
      return;
    }

    try {
      const response = await fetch("/api/generate_upload_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
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
  const [loadingAudioFile, setLoadingAudioFile] = useState<string | null>(null);

  const handlePlayAudio = async (filename: string) => {
    // すでに同じファイルを再生中なら停止して終了
    if (currentPlayingFile === filename && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setCurrentPlayingFile(null);
      currentAudioRef.current = null;
      return;
    }

    // 他の音声を再生中の場合、一時停止
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setCurrentPlayingFile(null);
    }

    // 新しいAudioオブジェクト生成
    const audio = new Audio(
      `/api/get_audio?file=${encodeURIComponent(filename)}`
    );
    audio.setAttribute("playsinline", "true"); // iOSブラウザでインライン再生を許可する設定

    // ローディング開始：スピナーを出すために対象ファイル名をセット
    setLoadingAudioFile(filename);

    // 音声イベントのハンドラを設定
    audio.onwaiting = () => {
      // バッファ不足などで待ち状態に入ったとき
      setLoadingAudioFile(filename);
    };
    audio.oncanplay = () => {
      setLoadingAudioFile(null);
    };
    audio.oncanplaythrough = () => {
      setLoadingAudioFile(null);
    };
    audio.onerror = () => {
      // エラーが起きたらローディング終了
      setLoadingAudioFile(null);
    };
    audio.onended = () => {
      // 再生しきったら状態リセット
      currentAudioRef.current = null;
      setCurrentPlayingFile(null);
      setLoadingAudioFile(null);
    };

    audio
      .play()
      .then(() => {
        // 再生開始に成功したら、現在再生中のファイル名などをセット
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
        body: JSON.stringify({ fileName: filename }),
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

  const handleDeleteClick = (fileName: string) => {
    setShowConfirmDialog(true);
    setFileToDelete(fileName);
  };

  const handleDelete = async (fileName: string) => {
    setShowConfirmDialog(false);
    if (fileToDelete) {
      try {
        const encodedFilename = encodeURIComponent(fileName);
        const response = await fetch(`/api/delete?file=${encodedFilename}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await fetchFileList();
        } else {
          console.error("削除に失敗しました");
        }
      } catch (error) {
        console.error("削除中にエラーが発生しました", error);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setFileToDelete(null);
  };

  return (
    <div>
      <Header user={user} logout={logout} />
      <div className="bg-gray-50 p-6">
        <div className="flex items-center justify-start mb-4">
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-800 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
          >
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
            className={`ml-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              !file ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            アップロード
            <FontAwesomeIcon icon={faUpload} className="h-4 ml-2" />
          </button>
        </div>
        {selectedFileName && (
          <div>
            <p>選択されたファイル: {selectedFileName}</p>
          </div>
        )}
        {uploadProgress > 0 && (
          <div className="p-4">
            <span>アップロード状況：{uploadProgress.toFixed(1)}%</span>
            <progress value={uploadProgress} max="100"></progress>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h5 className="text-2xl font-bold text-gray-800">ファイル一覧</h5>
            <button
              onClick={fetchFileList}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              ↺
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FontAwesomeIcon
                      icon={getFileIcon(file.name)}
                      className="text-blue-500 text-2xl"
                    />
                  </div>
                  <div>
                    <h6 className="text-lg font-semibold text-gray-700">
                      {file.name}
                    </h6>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(parseInt(file.size, 10))}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  アップロード日時：{convertToJST(file.updated)}
                </p>
                <div className="flex items-start mb-2">
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
                    className={`flex items-center justify-center w-100 px-20 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                      isAudio(file.name)
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isAudio(file.name) && loadingAudioFile === file.name ? (
                      <ThreeDots color="#ffffff" height={30} width={30} />
                    ) : (
                      <FontAwesomeIcon
                        icon={
                          isAudio(file.name)
                            ? currentPlayingFile === file.name
                              ? faPause
                              : faPlay
                            : faFile
                        }
                        className="h-5 mr-5"
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
                </div>
                <div className="flex flex-row items-center space-x-2">
                  <button
                    onClick={() => handleDownload(file.name)}
                    aria-label="Download file"
                    className={`flex items-center px-3 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      downloading
                        ? "border border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border border-blue-500 text-blue-600 hover:border-blue-600 hover:text-blue-800"
                    }`}
                    disabled={downloading}
                  >
                    <FontAwesomeIcon icon={faDownload} className="h-5 mr-1" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(file.name)}
                    aria-label="Delete file"
                    className="flex items-center px-3 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 border border-red-500 text-red-600 hover:border-red-600 hover:text-red-800"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-5 mr-1" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showConfirmDialog && fileToDelete && (
            <ConfirmDialog
              message={`🤔 ほんとうに"${fileToDelete}"を削除してもよいですか？`}
              onConfirm={() => handleDelete(fileToDelete)}
              onCancel={handleCancelDelete}
            />
          )}
        </div>
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
