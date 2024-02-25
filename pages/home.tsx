import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/context/auth";
import { useRouter } from "next/router";
import { login, logout } from "@/libs/auth";
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
  // const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
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
      //setFiles(data);

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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("ファイルがアップロードされました");
        setFile(null); // アップロード成功後、ファイル選択をリセット
        setSelectedFileName(null);
        await fetchFileList(); // ファイルリスト更新
      } else {
        alert("ファイルのアップロードに失敗しました");
      }
    } catch (error) {
      console.error("アップロード中にエラーが発生しました", error);
    }
  };

  const getFileIcon = (filename: string) => {
    const extenstion = filename.split(".").pop();
    switch (extenstion) {
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

  // byte -> 適切な単位のファイルサイズに変換
  const formatFileSize = (sizeInBytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (sizeInBytes === 0) return "0 Byte";

    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    if (i === 0) return `${sizeInBytes} ${sizes[i]}`; // Bytesの場合はそのまま
    return `${(sizeInBytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`; // 小数点2桁まで
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
    try {
      const response = await fetch(`/api/download?file=${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        console.error("ダウンロードに失敗しました");
      }
    } catch (error) {
      console.error("ダウンロード中にエラーが発生しました", error);
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
        const response = await fetch(`/api/delete?file=${fileName}`, {
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
          <div>
            {files.map((file, index) => (
              <div key={index} className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={getFileIcon(file.name)}
                      className="text-2xl"
                    />
                  </div>
                </div>
                <div className="ml-4">
                  <h6 className="text-lg font-semibold">{file.name}</h6>
                  <p className="text-gray-600">
                    ファイルサイズ：{formatFileSize(parseInt(file.size, 10))}
                  </p>
                  <p className="text-gray-600">
                    アップロード日時：{convertToJST(file.updated)}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    <FontAwesomeIcon icon={faDownload} className="h-7 ml-6" />
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => handleDeleteClick(file.name)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-7 ml-4" />
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
    </div>
  );
};

export default Home;
