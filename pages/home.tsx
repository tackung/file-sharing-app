import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/router";
import { logout } from "@/libs/auth";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileAudio,
  faFileArchive,
  faFileImage,
  faFile,
  faDownload,
  faUpload,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { TailSpin } from "react-loader-spinner";

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
          <div className="flex items-center mb-4">
            <h5 className="text-xl font-bold">ファイル一覧</h5>
            <button
              onClick={fetchFileList}
              className="text-black bg-transparent hover:bg-gray-100 py-2 px-2"
            >
              ↺
            </button>
          </div>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between mb-4">
              <div className="flex-shrink-0 mr-4">
                <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={getFileIcon(file.name)}
                    className="text-2xl"
                  />
                </div>
              </div>
              <div className="flex flex-col flex-grow">
                <h6 className="text-lg font-semibold">{file.name}</h6>
                <p className="text-gray-600">
                  ファイルサイズ：{formatFileSize(parseInt(file.size, 10))}
                </p>
                <p className="text-gray-600">
                  アップロード日時：{convertToJST(file.updated)}
                </p>
                <div className="flex">
                  <button
                    onClick={() => handleDownload(file.name)}
                    className={`flex items-center text-blue-500 hover:text-blue-700 mr-4 ${
                      downloading ? "cursor-not-allowed" : ""
                    }`}
                    disabled={downloading}
                  >
                    <FontAwesomeIcon icon={faDownload} className="h-5 mr-1" />
                    <span>ダウンロード</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(file.name)}
                    className="flex items-center text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-5 mr-1" />
                    <span>削除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
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
