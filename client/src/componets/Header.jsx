import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { logout, setUser } from "../redux/userSlice";
import axiosInstance from "../utils/axiosInstance";
import { persistor } from "../redux/store";
import { logoutHistory } from "../redux/slices/historySlice";
import { logoutSubmissions } from "../redux/slices/submissionSlice";
import { useNotification } from "../contexts/NotificationContext";
import NotificationList from './Notification/NotificationList';
import NotificationCenter from './Notification/NotificationCenter';
import NotificationIcon from './Notification/NotificationIcon';
import { LogIn } from "lucide-react";
import {
  Menu,
  X,
  Home,
  User,
  Users,
  History,
  HelpCircle,
  Code2,
  ClipboardList,
  LogOut,
  ChevronDown,
  Plus,
  Terminal,
  Bell,
} from "lucide-react";
import { navigateWithTransition } from '../utils/transitionManager.jsx';
import ConfirmationModal from "./ConfirmationModal.jsx";

const Header = ({ onLoginClick }) => {
  const user = useSelector((store) => store.app.user);
  const authStatus = useSelector((store) => store.app.authStatus);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScreenSmall, setIsScreenSmall] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [isOnMakeContest, setIsOnMakeContest] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const userMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const headerRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Use the notification context
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    clearNotification,
    formatTimeAgo
  } = useNotification();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 20;
      
      // Use requestAnimationFrame for smoother animation
      requestAnimationFrame(() => {
        if (scrollPosition > scrollThreshold) {
          if (!scrolled) setScrolled(true);
        } else {
          if (scrolled) setScrolled(false);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isUserMenuOpen || isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, isNotificationOpen]);

  // useEffect(() => {
  //   if (authStatus === false) {
  //     navigate("/");
  //   }
  // }, [authStatus, navigate]);

  useEffect(() => {
    setIsAdmin(user?.role);
  }, [user?.role]);  
  
  useEffect(() => {
    const handleResize = () => {
      // Better responsive breakpoints - mobile menu for screens below 768px
      const width = window.innerWidth;
      setIsScreenSmall(width <= 768);
      setIsMediumScreen(width > 610 && width <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setIsOnMakeContest(location.pathname === "/make-contest");
  }, [location]);
  
  // Notifications are now managed by the NotificationContext

  const logoutHandler = async () => {
    try {
      await axiosInstance.get("auth/logout");
      localStorage.removeItem("UserToken");
      
      // Dispatch actions in the correct order
      dispatch(logoutSubmissions());
      dispatch(logoutHistory());
      dispatch(logout());
      
      await persistor.purge();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const toggleMakeContest = () => {
    if (isOnMakeContest) {
      navigate("/browse");
    } else {
      navigate("/make-contest");
    }
  };
  
  // Notification handlers are now provided by the NotificationContext

  const handleNavigate = (path) => {
    // Smooth navigation with transition
    dispatch(navigateWithTransition(navigate, path));
  };

  const isActive = (path) => location.pathname === path;
  const makeContestButtonText =
    user?.role === "student" ? "Contest" : "Make Contest";  
    
  // Define base nav links that apply to all users
  const navLinks = [,
    { path: "/profile", label: "Profile", icon: <User size={18} /> },
    { path: "/history", label: "History", icon: <History size={18} /> },
    { path: "/support", label: "Support", icon: <HelpCircle size={18} /> },
  ];
  
  // Add Problem item only for admin and faculty
  if (user?.role === "admin" || user?.role === "faculty") {
    navLinks.splice(3, 0, { path: "/make-problem", label: "Problem", icon: <Code2 size={18} /> });
  }

  if (user?.role === "admin") {
    navLinks.push({
      path: "/pending-requests",
      label: "Requests",
      icon: <ClipboardList size={18} />,
    });
  }
  if (user?.role === "faculty") {
    // navLinks.push({
    //   path: "/faculty-section",
    //   label: "Requests",
    //   icon: <ClipboardList size={18} />,
    // });
    navLinks.push({
      path: "/faculty/batches",
      label: "Batches",
      icon: <Users size={18} />,
    });
  }
  if (user?.role === "student") {
    navLinks.push({
      path: "/student",
      label: "Student Dashboard",
      icon: <Users size={18} />,
    });
  }
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      ref={headerRef}      
      className={`z-50 w-full fixed transition-all duration-300 ${
        scrolled 
          ? "top-0 bg-black/95 backdrop-blur-md shadow-lg border-b border-gray-800" 
          : "top-1 sm:top-2 md:top-2 lg:top-3 mx-auto max-w-[98%] sm:max-w-[97%] md:max-w-[96%] lg:max-w-[95%] left-0 right-0 bg-black/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-xl lg:rounded-full px-1 sm:px-1.5 md:px-2 shadow-xl"
      }`}
    >
      <div className={`mx-auto transition-all duration-300 ${
        scrolled 
          ? "max-w-7xl px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8" 
          : "max-w-7xl px-1.5 sm:px-2 md:px-3 lg:px-4"
      }`}>
        <div className={`flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-10 sm:h-11 md:h-12 lg:h-14" : "h-10 sm:h-11 md:h-12 lg:h-14"
        }`}>          <motion.div 
            whileHover={{ scale: 1.03 }} 
            className="flex items-center space-x-1 sm:space-x-2"
            onClick={() => navigate(authStatus ? '/browse' : '/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="relative flex items-center">
              <Terminal 
                size={16} 
                className={`sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 lg:w-6 lg:h-6 ${
                  scrolled 
                    ? "text-blue-500" 
                    : "text-blue-400"
                } transition-colors duration-300`}
              />
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full"></span>
            </div>
            <h1 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold transition-all duration-300 ${
              scrolled ? "translate-y-0" : "translate-y-0.5"
            }`}>
              <span className="font-medium italic text-white" style={{ fontFamily: "'Pacifico', cursive, system-ui" }}>
                Codify
              </span>
              <span className="text-blue-500 text-sm sm:text-base md:text-lg lg:text-xl font-normal">.</span>
            </h1>
          </motion.div>
          
          {/* REPLACE THIS PART WITH CONDITIONAL RENDERING */}
          {authStatus ? (
            // For authenticated users - keep your existing code
            isScreenSmall && user ? (
              <div className="flex items-center space-x-2">
                {/* Notification Icon for Mobile/Tablet View */}
                <div className="relative" ref={notificationMenuRef}>
                  <NotificationIcon 
                    unreadCount={unreadCount} 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className={`text-white ${
                      scrolled ? "hover:bg-blue-500/20" : "hover:bg-white/10"
                    }`}
                  />

                  {/* Desktop-style Notification Dropdown for Tablet View */}
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 z-50">
                        <NotificationList 
                          onClose={() => setIsNotificationOpen(false)}
                          onViewAll={() => {
                            setIsNotificationOpen(false);
                            setShowNotificationCenter(true);
                          }} 
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`text-white p-1.5 sm:p-2 rounded-md transition-all duration-300 ${
                    scrolled ? "hover:bg-blue-500/20" : "hover:bg-white/10"
                  }`}
                >
                  {isMenuOpen ? <X size={18} className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Menu size={18} className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                </button>
              </div>
            ) : (
              user && (
                <div className="hidden sm:flex items-center space-x-0.5 sm:space-x-1 md:space-x-1 lg:space-x-2 xl:space-x-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(link.path);
                      }}
                      to={link.path}
                      className={`flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-1.5 md:px-2 lg:px-2 xl:px-3 py-1.5 xl:py-2 rounded-md text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm font-medium transition-all duration-200 ${
                        isActive(link.path)
                          ? `bg-blue-500/20 text-blue-400 ${scrolled ? 'shadow-inner' : ''}`
                          : `text-gray-300 hover:bg-blue-500/10 hover:text-blue-300 ${
                              scrolled ? 'hover:shadow-sm' : ''
                            }`
                      }`}
                      title={link.label}
                    >
                      <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-[18px] xl:h-[18px]">{link.icon}</span>
                      <span className="hidden xl:inline">{link.label}</span>
                    </Link>
                  ))}

                  {/* Notification Icon */}
                  <div className="relative" ref={notificationMenuRef}>
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className={`flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-1.5 md:px-2 lg:px-2 xl:px-3 py-1.5 xl:py-2 rounded-md text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm font-medium transition-all duration-200 relative ${
                        isNotificationOpen
                          ? "bg-blue-500/20 text-blue-400"
                          : `text-gray-300 hover:bg-blue-500/10 hover:text-blue-300 ${
                              scrolled ? 'hover:shadow-sm' : ''
                            }`
                      }`}
                      title="Notifications"
                    >
                      <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-[18px] xl:h-[18px]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {isNotificationOpen && (
                        <div className="absolute right-0 mt-2">
                          <NotificationList 
                            onClose={() => setIsNotificationOpen(false)}
                            onViewAll={() => {
                              setIsNotificationOpen(false);
                              setShowNotificationCenter(true);
                            }}
                          />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* User Dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-1.5 md:px-2 lg:px-2 xl:px-3 py-1.5 xl:py-2 rounded-md text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm font-medium transition-all duration-200 ${
                        isUserMenuOpen
                          ? "bg-blue-500/20 text-blue-400"
                          : `text-gray-300 hover:bg-blue-500/10 hover:text-blue-300 ${
                              scrolled ? 'hover:shadow-sm' : ''
                            }`
                      }`}
                    >
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-200 text-xs mr-0.5 sm:mr-1">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium hidden xl:inline">{user?.username?.split(' ')[0]}</span>
                      <ChevronDown 
                        size={10} 
                        className={`sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-48 sm:w-56 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl py-1 overflow-hidden"
                        >
                          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-700">
                            <p className="text-xs sm:text-sm text-gray-400">Logged in as</p>
                            <p className="text-xs sm:text-sm font-medium text-white truncate">{user?.email}</p>
                          </div>
                          <button
                            onClick={logoutHandler}
                            className="flex items-center space-x-2 w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          >
                            <LogOut size={14} className="sm:w-4 sm:h-4" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                    {/* Make Contest Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMakeContest}
                    className={`flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-1.5 md:px-2 lg:px-3 xl:px-4 py-1.5 xl:py-2 text-white rounded-md font-medium shadow-lg transition-all duration-300 text-xs sm:text-xs md:text-xs lg:text-sm xl:text-sm ${
                      scrolled 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isOnMakeContest ? <Home size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[16px] lg:h-[16px] xl:w-[18px] xl:h-[18px]" /> : <Plus size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[16px] lg:h-[16px] xl:w-[18px] xl:h-[18px]" />}
                    <span className="hidden xl:inline">{isOnMakeContest ? "Home" : makeContestButtonText}</span>
                  </motion.button>
                </div>
              )
            )
          ) : (            // For non-authenticated users - ADD THIS LOGIN BUTTON
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLoginClick} // Change this to use the passed prop
              className={`flex items-center space-x-1 px-3 sm:px-4 py-1.5 text-white rounded-md font-medium shadow-lg transition-all duration-300 text-xs sm:text-sm ${
                scrolled 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </motion.button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isScreenSmall && isMenuOpen && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-blue-500/20 bg-black/95 backdrop-blur-md"
          >
            <div className="px-3 sm:px-4 pt-2 pb-3 space-y-1 max-h-screen overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-300 hover:bg-blue-500/10 hover:text-blue-300"
                  }`}
                >
                  <span className="w-4 h-4 sm:w-[18px] sm:h-[18px]">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}

              {/* Notifications in Mobile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all duration-200 relative ${
                    isNotificationOpen
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-300 hover:bg-blue-500/10 hover:text-blue-300"
                  }`}
                >
                  <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] ml-auto">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notification Dropdown */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2"
                    >
                      <NotificationList 
                        onClose={() => setIsNotificationOpen(false)} 
                        isCompact={true}
                        onViewAll={() => {
                          setIsNotificationOpen(false);
                          setIsMenuOpen(false);
                          setShowNotificationCenter(true);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Info in Mobile Menu */}
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="px-3 py-2 text-xs text-gray-400">
                  Logged in as
                </div>
                <div className="px-3 py-1 text-sm font-medium text-white truncate">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={logoutHandler}
                className="flex items-center space-x-2 w-full px-3 py-2.5 rounded-md text-sm sm:text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Logout</span>
              </button>              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  toggleMakeContest();
                }}
                className="flex items-center space-x-2 w-full px-3 py-2.5 rounded-md text-sm sm:text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                {isOnMakeContest ? <Home size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />}
                <span>{isOnMakeContest ? "Home" : makeContestButtonText}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Center Modal */}
      <AnimatePresence>
        {showNotificationCenter && (
          <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
        )}
      </AnimatePresence>

      {/* Add the confirmation modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logoutHandler}
        type="logout"
      />
    </motion.nav>
  );
};

export default Header;