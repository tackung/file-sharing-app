import Header from "@/components/Header";
import ConfirmDialog from "@/components/ConfirmDialog";
import Breadcrumbs from "@/components/home/Breadcrumbs";
import UploadActions from "@/components/home/UploadActions";
import UploadProgress from "@/components/home/UploadProgress";
import FolderGrid from "@/components/home/FolderGrid";
import FileGrid from "@/components/home/FileGrid";
import FolderModal from "@/components/home/FolderModal";
import { logout } from "@/libs/auth";
import useHomePage from "@/hooks/useHomePage";
import { TailSpin } from "react-loader-spinner";

const Home: React.FC = () => {
  const {
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
    fileInputRef,
    folderNameInputRef,
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
    handleFolderNameChange,
    handleCreateFolder,
    getFileIcon,
    isAudio,
    formatFileSize,
    convertToJST,
  } = useHomePage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-800">
      <Header user={user} logout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={setCurrentPath} />

        <UploadActions
          currentPath={currentPath}
          selectedFiles={selectedFiles}
          uploading={uploading}
          onUpload={handleUpload}
          onFileChange={handleFileChange}
          fileInputRef={fileInputRef}
          onOpenFolderModal={openFolderModal}
          onReload={() => fetchFileList()}
          onRemoveSelectedFile={handleRemoveSelectedFile}
        />

        <UploadProgress
          uploading={uploading}
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
        />

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
            <FolderGrid
              folders={folders}
              loading={loadingList}
              onFolderClick={handleFolderClick}
              onDeleteFolderClick={handleDeleteFolderClick}
            />
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
            <FileGrid
              files={files}
              loading={loadingList}
              currentPlayingFile={currentPlayingFile}
              loadingAudioFile={loadingAudioFile}
              downloading={downloading}
              isAudio={isAudio}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
              convertToJST={convertToJST}
              onPlayAudio={handlePlayAudio}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
            />
          </section>
        </div>

        {confirmDialog && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={confirmDialog.onCancel ?? closeConfirm}
            confirmLabel={confirmDialog.confirmLabel}
            cancelLabel={confirmDialog.cancelLabel}
            variant={confirmDialog.variant}
          />
        )}

        <FolderModal
          isOpen={isFolderModalOpen}
          currentPath={currentPath}
          newFolderName={newFolderName}
          folderNameError={folderNameError}
          folderNameInputRef={folderNameInputRef}
          onChangeName={handleFolderNameChange}
          onClose={closeFolderModal}
          onCreate={() => handleCreateFolder(false)}
        />
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
