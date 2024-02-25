import React from "react";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-xl">
        <p>{message}</p>
        <div className="flex justify-center mt-4">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={onConfirm}
          >
            😁 削除しちゃう
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-500 text-black font-bold py-2 px-4 rounded"
            onClick={onCancel}
          >
            😰 やっぱやめた
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
