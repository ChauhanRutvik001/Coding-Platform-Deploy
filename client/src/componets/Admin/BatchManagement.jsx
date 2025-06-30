import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import ConfirmationModal from "../ConfirmationModal";
import {
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBatches, setTotalBatches] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState("");
  const [facultyList, setFacultyList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const itemsPerPage = 20;

  const navigate = useNavigate();
  useEffect(() => {
    fetchFaculty();
    fetchBatches(currentPage);
    // eslint-disable-next-line
  }, [currentPage, facultyFilter, searchTerm, sortBy, sortOrder]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchFaculty = async () => {
    try {
      const response = await axiosInstance.post(
        "/admin/faculty/get-faculty-by-admin",
        {
          page: 1,
          limit: 100,
        }
      );
      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {
      toast.error("Failed to load faculty data");
    }
  };
  const fetchBatches = async (page) => {
    setLoading(true);
    try {
      const payload = {
        page,
        limit: itemsPerPage,
        search: searchTerm.trim(),
        sortBy,
        sortOrder,
      };
      if (facultyFilter) {
        payload.facultyId = facultyFilter;
      }
      const response = await axiosInstance.get("/admin/batch/batches", {
        params: payload,
      });
      if (response.data.success) {
        setBatches(response.data.batches);
        setTotalPages(response.data.totalPages);
        setTotalBatches(response.data.totalBatches || response.data.total || 0);
        setCurrentPage(Number(response.data.currentPage));
      }
    } catch (error) {
      toast.error("Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const handleDeleteConfirm = async () => {
    try {
      if (!batchToDelete) {
        toast.error("No batch selected for deletion");
        setShowDeleteModal(false);
        return;
      }
      const response = await axiosInstance.delete(
        `/admin/batch/batches/${batchToDelete}`
      );
      if (response.data.success) {
        toast.success("Batch deleted successfully");
        // If only one batch left on the page, go to previous page if possible
        if (batches.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchBatches(currentPage);
        }
      } else {
        toast.error(response.data.message || "Failed to delete batch");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete batch");
    } finally {
      setShowDeleteModal(false);
      setBatchToDelete(null);
    }
  };

  const openDeleteModal = (batchId) => {
    setBatchToDelete(batchId);
    setShowDeleteModal(true);
  };
  const handleFacultyFilterChange = (e) => {
    setFacultyFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14 gap-4">
            <div className="flex items-center mb-4 md:mb-0">
              <FaLayerGroup className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Batch Management
              </h1>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate("/pending-requests")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
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

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="w-full">
          {/* Search and Controls Section */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search batches by name, subject, or faculty..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Search and manage all registered batch members
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Faculty Filter */}
              <div className="w-full sm:w-64">
                <select
                  value={facultyFilter}
                  onChange={handleFacultyFilterChange}
                  className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Faculty</option>
                  {facultyList.map((faculty) => (
                    <option 
                      key={faculty._id} 
                      value={faculty._id}
                      title={`${faculty.username} (${faculty.email})`}
                    >
                      {faculty.username.length > 20 
                        ? faculty.username.substring(0, 18) + '...' 
                        : faculty.username} ({faculty.email.length > 20 
                          ? faculty.email.substring(0, 18) + '...' 
                          : faculty.email})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Total Count */}
              <div className="flex items-center bg-gray-800 py-3 px-6 rounded-xl shadow font-semibold text-lg">
                <span>Total:</span>
                <span className="ml-3 text-2xl font-extrabold text-blue-400">{totalBatches}</span>
              </div>
              
              {/* Create Batch Button */}
              <button
                className="flex items-center gap-2 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95 whitespace-nowrap"
                onClick={() => navigate("/admin/batch/batches/create")}
              >
                <FaPlus className="h-5 w-5" />
                <span className="hidden sm:inline">Create Batch</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
    
          {/* Table Section with Improved Responsiveness */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                  <p className="mt-4 text-blue-400 text-lg font-semibold">
                    Loading batches...
                  </p>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-lg font-medium text-gray-300">
                    No batches found
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {searchTerm ? (
                      <>
                        No results for "<span className="max-w-[200px] inline-block truncate align-bottom" title={searchTerm}>{searchTerm}</span>"
                      </>
                    ) : "No batches created yet"}
                  </p>
                  <button
                    onClick={() => navigate("/admin/batch/batches/create")}
                    className="flex items-center gap-2 py-2.5 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    <FaPlus className="h-5 w-5" />
                    Create your first batch
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card View (below sm breakpoint) */}
                <div className="sm:hidden">
                  {batches.map((batch, index) => (
                    <div 
                      key={batch._id}
                      className="border-t border-gray-700 p-4 hover:bg-gray-800/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-semibold text-blue-400 truncate text-lg"
                            title={batch.name}
                          >
                            {batch.name}
                          </div>
                          {batch.subject && (
                            <div 
                              className="text-sm text-gray-400 truncate"
                              title={batch.subject}
                            >
                              {batch.subject}
                            </div>
                          )}
                        </div>
                        <span 
                          className={`ml-2 flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                            batch.isActive
                              ? "bg-green-900/40 text-green-400 border border-green-500/30"
                              : "bg-red-900/40 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {batch.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Faculty</div>
                          <div 
                            className="text-sm text-gray-200 truncate"
                            title={batch.faculty ? batch.faculty.username : "Not assigned"}
                          >
                            {batch.faculty ? batch.faculty.username : "Not assigned"}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Students</div>
                          <div className="text-sm text-blue-400 font-medium">
                            {batch.students ? batch.students.length : 0} students
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Created</div>
                          <div className="text-sm text-gray-400">
                            {formatDate(batch.createdAt).split(' ')[0]}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-500">Index</div>
                          <div className="text-sm text-gray-400">
                            #{(currentPage - 1) * itemsPerPage + index + 1}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-2">
                        <Link
                          to={`/admin/batch/batches/${batch._id}`}
                          className="p-3 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(batch._id)}
                          className="p-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop/Tablet Table View (sm and above) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr className="bg-gray-700 text-gray-200 text-xs sm:text-sm uppercase">
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-left w-[5%]">
                          <span className="font-semibold">#</span>
                        </th>
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-left w-[25%] lg:w-[23%]">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                          >
                            Batch Name {getSortIcon("name")}
                          </button>
                        </th>
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-left w-[30%] lg:w-[27%]">
                          <button
                            onClick={() => handleSort("faculty")}
                            className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                          >
                            Faculty {getSortIcon("faculty")}
                          </button>
                        </th>
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-center w-[10%]">
                          <span className="font-semibold">Students</span>
                        </th>
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-center w-[10%]">
                          <button
                            onClick={() => handleSort("isActive")}
                            className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                          >
                            Status {getSortIcon("isActive")}
                          </button>
                        </th>
                        <th className="hidden md:table-cell py-3 sm:py-4 px-2 sm:px-4 text-center w-[15%]">
                          <button
                            onClick={() => handleSort("createdAt")}
                            className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                          >
                            Created {getSortIcon("createdAt")}
                          </button>
                        </th>
                        <th className="py-3 sm:py-4 px-2 sm:px-4 text-center w-[10%]">
                          <span className="font-semibold">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch, index) => (
                        <tr
                          key={batch._id}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-300 font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                            <div className="min-w-0">
                              <div 
                                className="font-semibold text-blue-400 truncate"
                                title={batch.name}
                              >
                                {batch.name}
                              </div>
                              {batch.subject && (
                                <div 
                                  className="text-xs text-gray-400 mt-1 truncate"
                                  title={batch.subject}
                                >
                                  {batch.subject}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 min-w-0">
                            <div className="min-w-0">
                              <div 
                                className="font-medium text-gray-200 truncate"
                                title={batch.faculty ? batch.faculty.username : "Not assigned"}
                              >
                                {batch.faculty
                                  ? batch.faculty.username
                                  : "Not assigned"}
                              </div>
                              {batch.faculty && (
                                <div 
                                  className="text-xs text-gray-400 mt-1 truncate"
                                  title={batch.faculty.email}
                                >
                                  {batch.faculty.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30">
                              {batch.students ? batch.students.length : 0}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium ${
                                batch.isActive
                                  ? "bg-green-900/40 text-green-400 border border-green-500/30"
                                  : "bg-red-900/40 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {batch.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="hidden md:table-cell py-3 sm:py-4 px-2 sm:px-4 text-center text-gray-400 text-xs">
                            {formatDate(batch.createdAt)}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/admin/batch/batches/${batch._id}`}
                                className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => openDeleteModal(batch._id)}
                                className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Responsive Pagination Controls */}
          <div className="flex flex-wrap justify-center items-center mt-8 gap-2">
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
            <div className="flex gap-1">
              {totalPages <= 1 ? (
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
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
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
          {totalBatches > 0 && (
            <div className="text-center mt-4 text-gray-400 text-xs sm:text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalBatches)} of{" "}
              {totalBatches} batches
              {totalPages > 1 && (
                <span className="ml-4">
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleDeleteConfirm}
              title="Delete Batch"
              message="Are you sure you want to delete this batch? This action cannot be undone."
              confirmButtonText="Delete"
              cancelButtonText="Cancel"
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BatchManagement;
