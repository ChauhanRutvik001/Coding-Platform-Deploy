import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, type = "default" }) => {
  if (!isOpen) return null;

  // Different content based on modal type
  let title, message, confirmButtonText, confirmButtonClass;
  
  switch (type) {
    case "logout":
      title = "Logout Confirmation";
      message = "Are you sure you want to log out of your account?";
      confirmButtonText = "Yes, Logout";
      confirmButtonClass = "bg-red-600 hover:bg-red-700";
      break;
    
    case "back":
      title = "Are you sure?";
      message = "Your changes will not be saved if you go back. Do you want to proceed?";
      confirmButtonText = "Yes, Go Back";
      confirmButtonClass = "bg-red-600 hover:bg-red-700";
      break;
    
    default:
      title = "Confirmation Required";
      message = "Are you sure you want to proceed with this action?";
      confirmButtonText = "Confirm";
      confirmButtonClass = "bg-blue-600 hover:bg-blue-700";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn">
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 lg:p-10 w-11/12 md:w-96 lg:w-1/3 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-5 text-center">
          {title}
        </h2>
        <hr className="border-gray-600 mb-4"/>
        <p className="text-gray-300 mb-6 text-center text-sm md:text-base lg:text-lg">
          {message}
        </p>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-4 py-2 md:px-5 md:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200 mb-2 md:mb-0 md:mr-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`w-full md:w-auto px-4 py-2 md:px-5 md:py-3 ${confirmButtonClass} text-white rounded-lg transition duration-200`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
