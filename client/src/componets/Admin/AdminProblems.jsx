import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { 
  FaFileCode,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye
} from "react-icons/fa";

const AdminProblems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const itemsPerPage = 20;
  const navigate = useNavigate();  
  
  const fetchProblems = async (page, search = "", sort = "createdAt", order = "desc") => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/problems`, {
        params: {
          page,
          limit: itemsPerPage,
          search: search.trim(),
          sortBy: sort,
          sortOrder: order,
        }
      });
      
      if (response.data.success) {
        setProblems(response.data.problems);
        setTotalPages(response.data.totalPages);
        setTotalProblems(response.data.total);
      } else {
        setError(response.data.message || "Failed to fetch problems.");
      }
    } catch (err) {
      setError("Error fetching problems.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems(currentPage, searchTerm, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [currentPage, searchTerm, sortBy, sortOrder]);

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-900/40 text-green-400 border border-green-500/30";
      case "medium":
        return "bg-yellow-900/40 text-yellow-400 border border-yellow-500/30";
      case "hard":
        return "bg-red-900/40 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-900/40 text-gray-400 border border-gray-500/30";
    }
  };

  const viewProblem = (id) => {
    navigate(`/admin/problems/${id}`);
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaFileCode className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Problems Dashboard
              </h1>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate(-1)}
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

      {/* Main Content - Full Screen */}
      <main className="px-4 py-8">
        <div className="w-full">
          {/* Search and Stats Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search problems by title, difficulty, or creator..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Search and manage all problems in the system
              </p>
            </div>
            <div className="flex items-center bg-gray-800 py-3 px-6 rounded-xl shadow font-semibold text-lg">
              <span>Total Problems:</span>
              <span className="ml-3 text-2xl font-extrabold text-blue-400">{totalProblems}</span>
            </div>
          </div>

          {/* Table Section - Full Width */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                  <p className="mt-4 text-blue-400 text-lg font-semibold">
                    Loading, please wait...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-red-400 text-lg">
                {error}
              </div>
            ) : problems.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-lg font-medium">No problems found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? (
                      <>
                        No results for "<span className="max-w-[200px] inline-block truncate align-bottom" title={searchTerm}>{searchTerm}</span>"
                      </>
                    ) : "No problems available yet"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                 <table className="w-full table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200 text-xs sm:text-sm uppercase">
                      <th className="py-3 sm:py-4 px-2 sm:px-6 text-left w-[5%]">
                        <span className="font-semibold">#</span>
                      </th>
                      <th className="py-3 sm:py-4 px-2 sm:px-6 text-left w-[25%]">
                        <button
                          onClick={() => handleSort("title")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Title {getSortIcon("title")}
                        </button>
                      </th>
                      <th className="py-3 sm:py-4 px-2 sm:px-6 text-center w-[10%]">
                        <button
                          onClick={() => handleSort("difficulty")}
                          className="flex items-center justify-center mx-auto font-semibold hover:text-blue-300 transition-colors"
                        >
                          Difficulty {getSortIcon("difficulty")}
                        </button>
                      </th>
                      <th className="py-3 sm:py-4 px-2 sm:px-6 text-left w-[20%]">
                        <button
                          onClick={() => handleSort("createdBy")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Created By {getSortIcon("createdBy")}
                        </button>
                      </th>
                      <th className="hidden md:table-cell py-3 sm:py-4 px-2 sm:px-6 text-left w-[15%]">
                        <span className="font-semibold">Assigned</span>
                      </th>
                      <th className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center w-[8%]">
                        <button
                          onClick={() => handleSort("totalMarks")}
                          className="flex items-center justify-center mx-auto font-semibold hover:text-blue-300 transition-colors"
                        >
                          Marks {getSortIcon("totalMarks")}
                        </button>
                      </th>
                      <th className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center w-[8%]">
                        <span className="font-semibold">Submits</span>
                      </th>
                      <th className="hidden lg:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center w-[12%]">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center justify-center mx-auto font-semibold hover:text-blue-300 transition-colors"
                        >
                          Created {getSortIcon("createdAt")}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 sm:py-16 text-center text-gray-400 text-sm sm:text-lg">
                          <div className="flex flex-col items-center justify-center">
                            <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                            <p className="text-lg font-medium">No problems found</p>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? (
                                <>
                                  No results for "<span className="max-w-[200px] inline-block truncate align-bottom" title={searchTerm}>{searchTerm}</span>"
                                </>
                              ) : "No problems available yet"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      problems.map((problem, idx) => (
                        <tr
                          key={problem._id}
                          onClick={() => viewProblem(problem._id)}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 sm:py-4 px-2 sm:px-6 text-gray-300 font-medium">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-6 min-w-0">
                            <div 
                              className="text-white font-medium truncate"
                              title={problem.title}
                            >
                              {problem.title}
                            </div>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-6 text-center">
                            <span 
                              className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(problem.difficulty)}`}
                              title={problem.difficulty || 'N/A'}
                            >
                              {problem.difficulty || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 sm:py-4 px-2 sm:px-6 min-w-0">
                            <div className="min-w-0">
                              <div 
                                className="text-white truncate"
                                title={problem.createdBy?.username || 'Unknown'}
                              >
                                {problem.createdBy?.username || 'Unknown'}
                              </div>
                              {problem.createdBy?.email && (
                                <div 
                                  className="text-gray-400 text-xs truncate"
                                  title={problem.createdBy.email}
                                >
                                  {problem.createdBy.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="hidden md:table-cell py-3 sm:py-4 px-2 sm:px-6">
                            {problem.assignedBatches && problem.assignedBatches.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {problem.assignedBatches.slice(0, 2).map((batch, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-900/40 text-blue-300 border border-blue-500/30 truncate max-w-[100px]"
                                    title={batch.name}
                                  >
                                    {batch.name}
                                  </span>
                                ))}
                                {problem.assignedBatches.length > 2 && (
                                  <span 
                                    className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-700 text-gray-300"
                                    title={problem.assignedBatches.slice(2).map(b => b.name).join(", ")}
                                  >
                                    +{problem.assignedBatches.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Not assigned</span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-900/40 text-green-300 border border-green-500/30">
                              {problem.totalMarks}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center">
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-500/30">
                              {problem.count ?? 0}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell py-3 sm:py-4 px-2 sm:px-6 text-center text-gray-300 text-xs">
                            {formatDate(problem.createdAt)}
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
          {totalProblems > 0 && (
            <div className="text-center mt-4 text-gray-400 text-xs sm:text-sm">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalProblems)} of {totalProblems} problems
              {totalPages > 1 && (
                <span className="ml-4">
                  Page {currentPage} of {totalPages}
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminProblems;