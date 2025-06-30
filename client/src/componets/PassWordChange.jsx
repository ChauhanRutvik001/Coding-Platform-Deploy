import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle, Key, ShieldCheck, X } from "lucide-react";

const PasswordChange = ({ id, isModal = false, onBackToLogin }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    setError("");
    // validatePassword(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    // if (!validatePassword(newPassword)) {
    //   setError("Your password doesn't meet the strength requirements.");
    //   setIsLoading(false);
    //   return;
    // }

    if (newPassword !== confirmPassword) {
      setError("New Password and Confirm Password do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const user = { oldPassword, newPassword };
      const url = "auth/change-password";
      const res = await axiosInstance.post(url, user);

      if (res.status === 200) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success(
          `${res.data.message} Please login with your new password.`
        );
        
        // Always go back to the login form after password change
        if (onBackToLogin) {
          // Signal to parent component to show login form
          onBackToLogin();
        } else {
          // If no callback provided, redirect to login page
          navigate("/");
        }
      } else {
        setError(
          res.data.message || "An error occurred while changing the password."
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while processing your request."
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-4 sm:p-6 shadow-xl relative max-h-[90vh] overflow-y-auto mx-auto w-full"
    >
      {/* Close button - always visible */}
      {onBackToLogin && (
        <button
          onClick={onBackToLogin}
          className="absolute top-2 right-2 z-10 p-1.5 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      )}
      
      <div className="mb-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="mx-auto"
        >
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
            <Key className="text-blue-400 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </motion.div>
        <h2 className="mt-2 text-lg sm:text-xl font-bold text-white">
          Change Password
        </h2>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-2 sm:p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-xs sm:text-sm text-red-400"
        >
          {error}
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4 space-y-1">
          <label
            htmlFor="oldPassword"
            className="block text-xs sm:text-sm font-medium text-gray-300"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="mb-4 space-y-1">
          <label
            htmlFor="newPassword"
            className="block text-xs sm:text-sm font-medium text-gray-300"
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
              placeholder="Create new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <div className="mb-4 space-y-1">
          <label
            htmlFor="confirmPassword"
            className="block text-xs sm:text-sm font-medium text-gray-300"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700/50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 text-sm ${
                confirmPassword && newPassword !== confirmPassword
                  ? "border-red-500"
                  : confirmPassword && newPassword === confirmPassword
                  ? "border-green-500"
                  : "border-gray-600"
              }`}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-400 mt-1">
              Passwords don't match
            </p>
          )}
          
          {confirmPassword && newPassword === confirmPassword  && (
            <p className="text-xs text-green-400 mt-1 flex items-center">
              <CheckCircle size={12} className="mr-1" />
              Passwords match
            </p>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-2 sm:py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 text-sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Updating...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} />
              <span>Set New Password</span>
            </div>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default PasswordChange;