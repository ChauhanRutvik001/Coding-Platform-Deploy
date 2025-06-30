import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Home,
  Key,
} from "lucide-react";

// Skeleton loader component for stats cards
const StatCardSkeleton = () => (
  <div className="animate-pulse bg-gray-800/80 rounded-xl p-5 flex flex-col">
    <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-12 bg-gray-700 rounded mb-3"></div>
    <div className="flex justify-between items-end">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

// Activity skeleton loader
const ActivitySkeleton = () => (
  <div className="animate-pulse bg-gray-800/80 rounded-xl p-5 flex flex-col">
    <div className="h-5 w-28 bg-gray-600 rounded mb-2 skeleton-shimmer"></div>
    <div className="h-10 w-20 bg-gray-600 rounded mt-2 skeleton-shimmer"></div>
  </div>
);

// Import CSS for grid background pattern and shimmer effect
const gridBgStyle = `
@keyframes gridBackgroundMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.bg-grid-white {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  animation: gridBackgroundMove 15s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #4b5563 25%, #6b7280 50%, #4b5563 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.7);
}
`;

const Admin = () => {
  const user = useSelector((store) => store?.app?.user);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    batches: 0,
    problems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  // Only admin allowed
  useEffect(() => {
    if (user?.role !== "admin") navigate("/");
  }, [user, navigate]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          "/admin/batch/dashboard-stats"
        );
        // console.log("Dashboard Stats Response:", response.data);
        if (response.data && response.data.success) {
          setStats({
            students: response.data.studentCount || 0,
            faculty: response.data.facultyCount || 0,
            batches: response.data.batchCount || 0,
            problems: response.data.problemCount || 0,
          });
          if (
            response.data.recentActivity &&
            Array.isArray(response.data.recentActivity)
          ) {
            const formattedActivity = response.data.recentActivity.map(
              (activity) => ({
                id: activity._id || activity.id,
                type: activity.userType || "student",
                name: activity.name || activity.userName || "User",
                action: activity.action || "action",
                timestamp: new Date(
                  activity.timestamp || activity.createdAt || Date.now()
                ),
              })
            );
            setRecentActivity(formattedActivity);
          }
        } else {
          setStats({
            students: 0,
            faculty: 0,
            batches: 0,
            problems: 0,
          });
          setRecentActivity([]);
          toast.error("Could not load dashboard data properly");
        }
      } catch (error) {
        toast.error("Failed to load dashboard data");
        setStats({
          students: 0,
          faculty: 0,
          batches: 0,
          problems: 0,
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format time as HH:MM:SS
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format date as Weekday, Month Day, Year
  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time relative to now (e.g., "2 hours ago")
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1)
      return `${interval} year${interval === 1 ? "" : "s"} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1)
      return `${interval} month${interval === 1 ? "" : "s"} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? "" : "s"} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1)
      return `${interval} hour${interval === 1 ? "" : "s"} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1)
      return `${interval} minute${interval === 1 ? "" : "s"} ago`;
    return `${Math.floor(seconds)} second${seconds === 1 ? "" : "s"} ago`;
  };

  // Get appropriate icon for activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case "student":
        return (
          <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
            <GraduationCap className="h-5 w-5" />
          </div>
        );
      case "faculty":
        return (
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
            <BookOpen className="h-5 w-5" />
          </div>
        );
      case "admin":
        return (
          <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-500/20 text-gray-400">
            <Users className="h-5 w-5" />
          </div>
        );
    }
  };

  // Quick action buttons data
  const quickActions = [
    {
      title: "Create Batch",
      description: "Create new batch for students",
      icon: Users,
      color: "from-blue-900/90 to-blue-800/80",
      hoverColor: "hover:shadow-blue-700/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/20",
      textColor: "text-blue-300",
      onClick: () => navigate("/admin/batch/create"),
    },
    {
      title: "Manage Users",
      description: "View and manage all users",
      icon: Users,
      color: "from-purple-900/90 to-purple-800/80",
      hoverColor: "hover:shadow-purple-700/20",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/20",
      textColor: "text-purple-300",
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Student Register",
      description: "Register new students",
      icon: GraduationCap,
      color: "from-emerald-900/90 to-emerald-800/80",
      hoverColor: "hover:shadow-emerald-700/20",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      textColor: "text-emerald-300",
      onClick: () => navigate("/register"),
    },
    {
      title: "Teacher Register",
      description: "Register new teachers",
      icon: BookOpen,
      color: "from-amber-900/90 to-amber-800/80",
      hoverColor: "hover:shadow-amber-700/20",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20",
      textColor: "text-amber-300",
      onClick: () => navigate("/create-faculty"),
    },
  ];

  return (
    <>
      <style>{gridBgStyle}</style>
      <div className="min-h-screen bg-gray-900 text-white flex">
        {/* Main Content */}
        <div className="flex-1 bg-gray-900 mt-8">
          {/* Header Section */}
          <div className="from-gray-900 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
            <div className="absolute inset-0"></div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="mt-16"></div>
              <div className="flex justify-between items-center">
                {" "}
                <h1 className="text-4xl font-bold tracking-tight text-blue-400">
                  Admin Dashboard
                </h1>
                <div className="hidden md:block">
                  <div className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs font-medium text-blue-200/80 text-right">
                    {formatDate(currentTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {loading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  {/* Students Card */}
                  <div className="group bg-gradient-to-br from-blue-900/90 to-blue-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-blue-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-blue-300 text-sm font-medium">
                            Total Students
                          </p>
                          <h3 className="mt-1 text-4xl font-bold text-white">
                            {stats.students}
                          </h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <GraduationCap className="h-7 w-7 text-blue-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => navigate("/studentinformation")}
                          className="text-blue-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <span className="text-blue-300/70 text-xs">
                          Last updated: Today
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Faculty Card */}
                  <div className="group bg-gradient-to-br from-purple-900/90 to-purple-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-purple-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-purple-300 text-sm font-medium">
                            Total Faculty
                          </p>
                          <h3 className="mt-1 text-4xl font-bold text-white">
                            {stats.faculty}
                          </h3>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <BookOpen className="h-7 w-7 text-purple-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => navigate("/registerFaculty")}
                          className="text-purple-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <span className="text-purple-300/70 text-xs">
                          Last updated: Today
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Batches Card */}
                  <div className="group bg-gradient-to-br from-emerald-900/90 to-emerald-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-emerald-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-emerald-300 text-sm font-medium">
                            Active Batches
                          </p>
                          <h3 className="mt-1 text-4xl font-bold text-white">
                            {stats.batches}
                          </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                          <Users className="h-7 w-7 text-emerald-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button
                          onClick={() => navigate("/admin/batch/batches")}
                          className="text-emerald-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <span className="text-emerald-300/70 text-xs">
                          Last updated: Today
                        </span>
                      </div>
                    </div>
                  </div>{" "}
                  {/* Problems Card */}
                  <div className="group bg-gradient-to-br from-amber-900/90 to-amber-800/80 rounded-xl shadow-lg overflow-hidden relative hover:shadow-amber-700/20 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <div className="px-6 py-5 relative z-10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-amber-300 text-sm font-medium">
                            Total Problems
                          </p>
                          <h3 className="mt-1 text-4xl font-bold text-white">
                            {stats.problems}
                          </h3>
                        </div>
                        <div className="p-3 bg-amber-500/20 rounded-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7 text-amber-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <button
                          className="text-amber-300 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
                          onClick={() => navigate("/admin/problems")}
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <span className="text-amber-300/70 text-xs">
                          Last updated: Today
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Main lower section: Quick Links left, Recent Activity right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Quick Links - visually distinct card, now on the left */}
              <div className="bg-gradient-to-br from-blue-900/90 to-blue-800/80 rounded-2xl shadow-2xl border border-blue-700/30 flex flex-col items-center justify-center p-8 hover:scale-[1.02] transition-transform duration-300">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Quick Links
                </h2>
                <div className="w-16 border-b-2 border-blue-400 mb-6"></div>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button
                    onClick={() => navigate("/registerStudents")}
                    className="flex items-center gap-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base w-full justify-center"
                  >
                    <GraduationCap className="h-5 w-5" /> Register Student
                  </button>
                  <button
                    onClick={() => navigate("/create-faculty")}
                    className="flex items-center gap-3 bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base w-full justify-center"
                  >
                    <BookOpen className="h-5 w-5" /> Register Teacher
                  </button>
                  <button
                    onClick={() => navigate("/admin/batch/batches/create")}
                    className="flex items-center gap-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base w-full justify-center"
                  >
                    <Users className="h-5 w-5" /> Create Batch
                  </button>{" "}
                  <button
                    onClick={() => navigate("/admin/users")}
                    className="flex items-center gap-3 bg-pink-700 hover:bg-pink-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base w-full justify-center"
                  >
                    <UserPlus className="h-5 w-5" /> All Users
                  </button>
                  <button
                    onClick={() => navigate("/admin/api-keys")}
                    className="flex items-center gap-3 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-200 text-base w-full justify-center"
                  >
                    <Key className="h-5 w-5" /> API Key Management
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-lg overflow-hidden border border-gray-700/50 backdrop-blur-sm transition-all duration-500 hover:shadow-indigo-900/20 hover:shadow-xl relative flex flex-col">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]"></div>
                <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 py-4 px-6 relative z-10">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-indigo-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                      Recent Activity
                    </span>
                  </h2>
                </div>
                <div className="p-6 relative z-10 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((index) => (
                        <ActivitySkeleton key={index} />
                      ))}
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">
                        No recent activity
                      </div>
                      <div className="text-gray-500 text-sm">
                        Activity will appear here when users interact with the
                        system
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors duration-200"
                        >
                          {getActivityIcon(activity.type)}
                          <div className="flex-1 min-w-0">
                            {" "}
                            {/* Added min-w-0 to enable truncation */}
                            <p className="text-sm text-gray-300 flex flex-wrap items-baseline">
                              <span
                                className="font-medium text-white truncate max-w-[150px] inline-block mr-1"
                                title={activity.name} // Show full name on hover
                              >
                                {activity.name}
                              </span>
                              <span className="text-gray-400">
                                {activity.action}
                              </span>
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;
