import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfilePicThunk, setLoading, setUser } from "../redux/userSlice";
import axiosInstance from "../utils/axiosInstance";
import PasswordChange from "./PassWordChange";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Terminal } from "lucide-react";

const Login = ({ isModal = false, onLoginSuccess }) => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.app.user);
  const authStatus = useSelector((store) => store.app.authStatus);
  const [idOrEmail, setIdOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [popUp, setPopUp] = useState("");
  const dispatch = useDispatch();
  const isLoading = useSelector((store) => store.app.isLoading);
  
  const validateLogin = () => {
    if (!idOrEmail || !password) {
      toast.error("ID/Email and password are required for login.");
      return false;
    }
    return true;
  };  // Function to redirect based on user role
  const redirectBasedOnRole = (role) => {
    if (!role) return;
    
    const roleInLowerCase = role.toLowerCase();
    
    switch (roleInLowerCase) {
      case "admin":
        navigate("/pending-requests", { replace: true });
        break;
      case "student":
        navigate("/student", { replace: true });
        break;
      case "faculty":
        navigate("/profile", { replace: true });
        break;
      default:
        navigate("/", { replace: true });
        break;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    // Dismiss ALL existing toasts to avoid multiple messages
    toast.dismiss();
    
    dispatch(setLoading(true));
    setAssignLoading(true);
    
    try {
      const user = {
        [idOrEmail.includes("@") ? "email" : "id"]: idOrEmail.toLowerCase(),
        password,
      };

      const url = `auth/login`;
      const res = await axiosInstance.post(url, user);
      
      // Check for successful login first
      if (!res.data.success) {
        toast.error(res.data.message || "Login failed!");
        return; // Stop execution here if login failed
      }

      // Handle successful login flow
      const { firstTimeLogin, message, user: loggedInUser } = res.data;
      
      if (firstTimeLogin) {
        setIsFirstTime(true);
        toast.success("Welcome to your first login!");
        return;
      }

      // Set user in Redux store
      dispatch(setUser(loggedInUser));
      
      // Fetch profile pic after successful login
      try {
        await dispatch(fetchProfilePicThunk());
      } catch (profileError) {
        // console.log("Profile pic fetch error:", profileError);
        // Don't show error to user for profile pic issues
      }
      
      // Only show success message after everything else succeeds
      toast.success(message || "Login successful!");
      
      // Handle navigation based on whether it's a modal or not
      if (isModal && onLoginSuccess) {
        onLoginSuccess(); // Close the modal
        
        // Small delay before redirect to ensure modal closes smoothly
        setTimeout(() => {
          redirectBasedOnRole(loggedInUser?.role);
        }, 300);
      } else {
        // Direct navigation based on role
        redirectBasedOnRole(loggedInUser?.role);
      }
      
    } catch (error) {
      console.error("Login error:", error);
      
      // Clear any pending toasts to avoid conflicting messages
      toast.dismiss();
      
      // Show the error message from the server if available
      const errorMessage =
        error?.response?.data?.message || "An error occurred during login.";
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
      setAssignLoading(false);

      if (!isFirstTime) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setIdOrEmail("");
    setPassword("");
  };  return (
    <div className={`flex ${isModal ? 'min-h-[80vh] rounded-xl' : 'min-h-screen'} bg-gray-900 overflow-hidden`}>
      {/* Left Section with code background for large screens */}
      {!isFirstTime && (
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8"
        >
          <div className="absolute inset-0 overflow-hidden opacity-20">
            {/* Animated background elements */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-40 h-40 bg-blue-500/10 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.1, 0.3, 0.1],
                  x: [0, Math.random() * 50, 0],
                  y: [0, Math.random() * 50, 0],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10 text-center max-w-md">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6"
            >
              <Terminal className="text-blue-400 w-8 h-8" />
            </motion.div>
              <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold mb-4 text-blue-600"
            >
              Welcome to Codify
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 mb-8"
            >
              Your gateway to programming excellence. Challenge yourself, compete with peers, and elevate your coding skills.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-4 text-left"
            >
              {[
                { text: "500+ Active Students", delay: 0.7 },
                { text: "100+ Programming Problems", delay: 0.8 },
                { text: "Real-time Rankings", delay: 0.9 },
                { text: "Multi-language Support", delay: 1.0 },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: item.delay }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-400">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Right Section - Login or Password Change Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-full ${!isFirstTime ? 'lg:w-1/2' : ''} flex items-center justify-center p-4 sm:p-8`}
      >
        <div className="w-full max-w-md">
          {isFirstTime ? (
            <PasswordChange 
              id={idOrEmail} 
              isModal={isModal} 
              onBackToLogin={() => {
                setIsFirstTime(false);
                setIdOrEmail("");
                setPassword("");
                
                // If we're in modal mode and need to close
                if (isModal && onLoginSuccess) {
                  onLoginSuccess();
                }
              }} 
            />
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/70 backdrop-blur-sm border border-gray-700 rounded-xl p-6 sm:p-8 shadow-xl"
            >
              <div className="mb-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="mx-auto"
                >
                  <img
                    src="/logo2.jpg"
                    alt="CHARUSAT"
                    className="mx-auto h-16 rounded-md"
                  />
                </motion.div>
                <h2 className="mt-4 text-xl font-bold text-white">
                  Sign in to Codify
                </h2>
                <p className="mt-1 text-gray-400 text-sm">
                  Online Programming Submission & Evaluation
                </p>
              </div>
              
              <form onSubmit={handleLogin}>
                <div className="mb-5 space-y-1.5">
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Username or Email
                  </label>
                  <input
                    type="text"
                    id="id"
                    value={idOrEmail}
                    onChange={(e) => setIdOrEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Enter your username or email"
                    required
                  />
                </div>
                
                <div className="mb-6 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={() => setPopUp("Password reset is not available at the moment.")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                  <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg flex items-center justify-center transition-all duration-300"
                  disabled={assignLoading}
                >
                  {assignLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </div>
                  )}
                </motion.button>

                {popUp && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-4 text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800/30"
                  >
                    {popUp}
                  </motion.p>
                )}
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-center text-sm text-gray-500"
                >
                  <span>Don't have an account? Contact </span>
                  <a href="mailto:support@codify.edu" className="text-blue-400 hover:text-blue-300 transition-colors">admin@codify.edu</a>
                </motion.div>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;