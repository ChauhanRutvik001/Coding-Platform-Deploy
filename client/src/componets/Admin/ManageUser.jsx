import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { 
  FaUser,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaTrash
} from "react-icons/fa";
import ConfirmationModal from "../ConfirmationModal";
import { toast } from "react-hot-toast";
// import { toast } from "react-hot-toast";

const ManageUser = () => {
  // States remain the same
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [userType, setUserType] = useState(() => localStorage.getItem("userType") || "student");
  const [editUser, setEditUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false); 
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [showExpireSessionModal, setShowExpireSessionModal] = useState(false);
  const [userToExpireSession, setUserToExpireSession] = useState(null);

  const itemsPerPage = 10;
  const navigate = useNavigate();

  // All functions remain the same
  const fetchUsers = async (page, search = "", sort = "createdAt", order = "desc") => {
    try {
      setLoading(true);
      const endpoint = userType === "teacher" ? "/admin/getFaculty" : "/admin/getStudents";
      
      // Map sortBy to backend format
      let backendSort = "newest";
      if (sort === "createdAt") {
        backendSort = order === "asc" ? "oldest" : "newest";
      }
      
      const response = await axiosInstance.post(endpoint, {
        page,
        limit: itemsPerPage,
        search: search.trim(),
        sort: backendSort,
      });
      
      if (response.data.success) {
        const userData = userType === "teacher" ? response.data.facultys : response.data.students;
        const totalCount = userType === "teacher" ? response.data.totalFaculty : response.data.totalStudents;
        
        setUsers(userData);
        setTotalPages(response.data.totalPages);
        setTotalUsers(totalCount);
        setError("");
      } else {
        setError(response.data.message || "Failed to fetch users.");
      }
    } catch (err) {
      setError("An error occurred while fetching users.");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [currentPage, searchTerm, sortBy, sortOrder, userType]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUserTypeChange = (e) => {
    setUserType(e.target.value);
    localStorage.setItem("userType", e.target.value);
    setCurrentPage(1);
    setSearchTerm("");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <FaSort className="w-3 h-3 ml-1" />;
    }
    return sortOrder === "asc" ? (
      <FaSortUp className="w-3 h-3 ml-1" />
    ) : (
      <FaSortDown className="w-3 h-3 ml-1" />
    );
  };
  // Delete handlers
  const handleDeleteUser = (id) => {
    setUserToDelete({ id, type: userType });
    setShowDeleteModal(true);
  };

  // Confirm delete logic
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (userToDelete.type === "teacher") {
        await axiosInstance.post("/admin/deleteFaculty", { facultyId: userToDelete.id });
        toast.success("Teacher deleted successfully!");
      } else {
        await axiosInstance.post("/admin/removeStudent", { userId: userToDelete.id });
        toast.success("Student deleted successfully!");
      }
      // Refresh the list
      fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Edit handlers
  const handleEditUser = (user) => {
    setEditUser(user);
  };

  // Handle reset password functions
  const handleResetPassword = (user) => {
    setUserToResetPassword(user);
    setShowResetPasswordModal(true);
  };

  // Confirm reset password
  const confirmResetPassword = async () => {
    try {
      const response = await axiosInstance.post('/admin/resetUserPassword', {
        userId: userToResetPassword._id
      });
      if (response.data.success) {
        toast.success('Password reset successfully. New password is the user ID.');
        setShowResetPasswordModal(false);
        setUserToResetPassword(null);
      } else {
        toast.error(response.data.message || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('An error occurred while resetting the password.');
    }
  };

  // Handle expire session functions
  const handleExpireSession = (user) => {
    setUserToExpireSession(user);
    setShowExpireSessionModal(true);
  };

  // Confirm expire session
  const confirmExpireSession = async () => {
    try {
      const response = await axiosInstance.post('/admin/expireUserSession', {
        userId: userToExpireSession._id
      });
      if (response.data.success) {
        toast.success('User session expired successfully.');
        setShowExpireSessionModal(false);
        setUserToExpireSession(null);
      } else {
        toast.error(response.data.message || 'Failed to expire session.');
      }
    } catch (error) {
      console.error('Error expiring session:', error);
      toast.error('An error occurred while expiring the session.');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section - Optimized for all screen sizes */}
      <div className="py-4 sm:py-6 mb-4 sm:mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 sm:mt-14 gap-3">
            <div className="flex items-center mb-3 sm:mb-0">
              <FaUser className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 text-blue-300" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                User Management
              </h1>
            </div>
            <button
              className="w-full sm:w-auto py-2 sm:py-2.5 px-4 sm:px-6 flex items-center justify-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate(-1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Improved for all screen sizes */}
      <main className="px-3 sm:px-4 py-4 sm:py-8">
        <div className="w-full">
          {/* Search and Stats Section - More responsive layout */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
            <div className="flex-1">
              <div className="relative max-w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${userType}s by name, email, or ID...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Search and manage all registered {userType}s
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {/* User Type Filter */}
              <select
                value={userType}
                onChange={handleUserTypeChange}
                className="w-full sm:w-auto py-2.5 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
              </select>
              
              {/* Total Count */}
              <div className="flex items-center w-full sm:w-auto bg-gray-800 py-2.5 px-4 sm:px-6 rounded-lg shadow font-semibold text-base sm:text-lg">
                <span>Total:</span>
                <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-extrabold text-blue-400">{totalUsers}</span>
              </div>
            </div>
          </div>

          {/* Table Section - With proper scrolling and responsive design */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                  <p className="mt-4 text-blue-400 text-base sm:text-lg font-semibold">
                    Loading, please wait...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12 sm:py-16 text-red-400 text-base sm:text-lg">
                {error}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200 text-xs sm:text-sm uppercase">
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[5%]">
                        <span className="font-semibold">#</span>
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[20%]">
                        <button
                          onClick={() => handleSort("username")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Name {getSortIcon("username")}
                        </button>
                      </th>
                      {userType === "teacher" && (
                        <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[25%]">
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                          >
                            Email {getSortIcon("email")}
                          </button>
                        </th>
                      )}
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[15%]">
                        <button
                          onClick={() => handleSort("id")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          ID {getSortIcon("id")}
                        </button>
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[15%]">
                        <button
                          onClick={() => handleSort("batch")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          {userType === "teacher" ? "Branch" : "Batch"} {getSortIcon("batch")}
                        </button>
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-[15%]">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                        >
                          Created {getSortIcon("createdAt")}
                        </button>
                      </th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-[10%]">
                        <span className="font-semibold">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={userType === "teacher" ? "7" : "6"} className="py-8 px-6 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <FaSearch className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mb-3" />
                            <p className="text-base sm:text-lg font-medium">No {userType}s found</p>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? (
                                <>
                                  No results for "<span className="max-w-[200px] inline-block truncate align-bottom" title={searchTerm}>{searchTerm}</span>"
                                </>
                              ) : `No ${userType}s registered yet`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr
                          key={user._id}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          {/* Index Cell */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-300 font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          
                          {/* Username Cell - FIXED */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3">
                                <span className="text-white text-xs sm:text-sm font-medium">
                                  {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                              <div className="min-w-0 w-full max-w-[200px]">
                                <div 
                                  className="font-semibold text-blue-400 truncate"
                                  title={user.username}
                                >
                                  {user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Email Cell - FIXED */}
                          {userType === "teacher" && (
                            <td className="py-3 sm:py-4 px-3 sm:px-6">
                              <div className="max-w-[200px] min-w-0">
                                <div 
                                  className="text-gray-300 truncate"
                                  title={user.email}
                                >
                                  {user.email}
                                </div>
                              </div>
                            </td>
                          )}
                          
                          {/* ID Cell - FIXED */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="max-w-[120px] min-w-0">
                              <div 
                                className="text-gray-300 truncate" 
                                title={user.id}
                              >
                                {user.id}
                              </div>
                            </div>
                          </td>
                          
                          {/* Batch/Branch Cell - FIXED */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="min-w-0">
                              <span 
                                className="inline-block max-w-[120px] px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30 truncate"
                                title={userType === "teacher" ? (user.branch || "N/A") : (user.batch || "N/A")}
                              >
                                {userType === "teacher" ? (user.branch || "N/A") : (user.batch || "N/A")}
                              </span>
                            </div>
                          </td>
                          
                          {/* Date Cell */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-gray-400 text-xs sm:text-sm">
                            {formatDate(user.createdAt)}
                          </td>
                          
                          {/* Actions Cell */}
                          <td className="py-3 sm:py-4 px-3 sm:px-6">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button
                                className="p-1.5 sm:p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                                onClick={() => handleEditUser(user)}
                                title="Edit"
                              >
                                <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                className="p-1.5 sm:p-2 rounded-lg bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/40 transition-colors"
                                onClick={() => handleResetPassword(user)}
                                title="Reset Password"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                </svg>
                              </button>
                              <button
                                className="p-1.5 sm:p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 transition-colors"
                                onClick={() => handleExpireSession(user)}
                                title="Expire Session"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                                </svg>
                              </button>
                              <button
                                className="p-1.5 sm:p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                                onClick={() => handleDeleteUser(user._id)}
                                title="Delete"
                              >
                                <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Responsive Pagination Controls */}
          <div className="flex flex-wrap justify-center items-center mt-6 sm:mt-8 gap-1 sm:gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">              {totalPages <= 1 ? (
                <span className="px-3 sm:px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
                  1
                </span>
              ) : (
                [...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages || totalPages <= 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Pagination Info */}
          {totalUsers > 0 && (
            <div className="text-center mt-3 sm:mt-4 text-gray-400 text-xs sm:text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers} {userType}s
              {totalPages > 1 && (
                <span className="ml-4">Page {currentPage} of {totalPages}</span>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Edit Modal - Improved responsiveness */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">
              Edit {userType === "teacher" ? "Teacher" : "Student"}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (userType === "teacher") {
                    await axiosInstance.post(
                      `/admin/editFaculty/${editUser._id}`,
                      {
                        _id: editUser._id,
                        username: editUser.username,
                        email: editUser.email,
                        id: editUser.id,
                      }
                    );
                  } else {                    await axiosInstance.post(
                      `/admin/editStudent/${editUser._id}`,
                      {
                        _id: editUser._id,
                        username: editUser.username,
                        id: editUser.id,
                        batch: editUser.batch,
                        semester: editUser.semester,
                      }
                    );
                  }
                  toast.success(
                    `${userType === "teacher" ? "Teacher" : "Student"} updated successfully!`
                  );
                  setEditUser(null);
                  fetchUsers(currentPage, searchTerm, sortBy, sortOrder);
                } catch (err) {
                  toast.error("Failed to update user.");
                }
              }}
            >
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={editUser.username || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                  required
                />
              </div>
              
              {userType === "teacher" && (
                <div className="mb-3">
                  <label className="block text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                    value={editUser.email || ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">
                  {userType === "teacher" ? "Faculty ID" : "Student ID"}
                </label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={editUser.id || ""}
                  onChange={(e) =>
                    setEditUser({ ...editUser, id: e.target.value })
                  }
                  required
                />
              </div>
                <div className="mb-3">
                <label className="block text-gray-300 mb-1">
                  {userType === "teacher" ? "Branch" : "Batch"}
                </label>
                <input
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                  value={userType === "teacher" ? (editUser.branch || "") : (editUser.batch || "")}
                  onChange={(e) =>
                    setEditUser({ 
                      ...editUser, 
                      [userType === "teacher" ? "branch" : "batch"]: e.target.value 
                    })
                  }
                  required
                />
              </div>
              
              {userType === "student" && (
                <div className="mb-3">
                  <label className="block text-gray-300 mb-1">Semester</label>
                  <select
                    className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                    value={editUser.semester || "1"}
                    onChange={(e) =>
                      setEditUser({ ...editUser, semester: e.target.value })
                    }
                    required
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete - Keep as is */}
      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      )}

      {/* Confirmation Modal for Reset Password - New modal added */}
      {showResetPasswordModal && (
        <ConfirmationModal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setUserToResetPassword(null);
          }}
          onConfirm={confirmResetPassword}
          title="Reset Password"
          message="Are you sure you want to reset the password for this user? The new password will be the user ID."
          confirmButtonText="Reset Password"
          cancelButtonText="Cancel"
        />
      )}

      {/* Confirmation Modal for Expire Session - New modal added */}
      {showExpireSessionModal && (
        <ConfirmationModal
          isOpen={showExpireSessionModal}
          onClose={() => {
            setShowExpireSessionModal(false);
            setUserToExpireSession(null);
          }}
          onConfirm={confirmExpireSession}
          title="Expire Session"
          message="Are you sure you want to expire the current session for this user? They will need to log in again."
          confirmButtonText="Expire Session"
          cancelButtonText="Cancel"
        />
      )}
    </div>
  );
};

export default ManageUser;