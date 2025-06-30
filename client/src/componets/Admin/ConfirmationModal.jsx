import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "Are you sure you want to proceed?",
  confirmButtonText = "Yes",
  cancelButtonText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 w-11/12 md:w-96">
        <h2 className="text-xl font-bold text-white mb-4 text-center">{title}</h2>
        <p className="text-gray-300 mb-6 text-center">{message}</p>
        <div className="flex flex-col md:flex-row gap-3 mt-4">
          <button
            onClick={onClose}
            className="w-full md:w-1/2 px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onConfirm}
            className="w-full md:w-1/2 px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;