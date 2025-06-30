import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import {
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

const StudentList = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const studentsPerPage = 10;
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  const [batchInfo, setBatchInfo] = useState(null);

  const fetchStudents = async (
    page,
    search = "",
    sort = "username",
    order = "asc"
  ) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/admin/batch/batches/${batchId}/students?page=${page}&limit=${studentsPerPage}&search=${search}&sortBy=${sort}&sortOrder=${order}`
      );
      if (response.data.success) {
        setStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStudents(response.data.totalStudents);

        // If we don't have batch info yet, try to get it from the first student
        if (!batchInfo && response.data.students.length > 0) {
          const firstStudent = response.data.students[0];
          setBatchInfo({
            name: firstStudent.batch || "Unknown Batch",
            semester: firstStudent.semester || "Unknown Semester",
          });
        }
      } else {
        setError(response.data.message || "Failed to fetch students.");
      }
    } catch (err) {
      setError("An error occurred while fetching students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(currentPage, searchTerm, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [batchId, currentPage, searchTerm, sortBy, sortOrder]);

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

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section - Same as AdminRegister */}
      <div className="py-6 mb-4 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUsers className="h-8 w-8 mr-3 text-blue-300" />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight truncate">
                  Batch Students
                </h1>
              </div>
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
              Back to Batches
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Matching AdminRegister */}
      <main className="px-4 py-8">
        <div className="w-full">
          {/* Search and Stats Section - Like AdminRegister */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search students by name, ID, or batch..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                View all students registered in this batch
              </p>
            </div>
            <div className="flex items-center bg-gray-800 py-3 px-6 rounded-xl shadow font-semibold text-lg">
              <span>Total Students:</span>
              <span className="ml-3 text-2xl font-extrabold text-blue-400">
                {totalStudents}
              </span>
            </div>
          </div>

          {/* Table Section - Like AdminRegister */}
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
            ) : students.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? (
                      <>
                        No results for "
                        <span
                          className="max-w-[200px] inline-block truncate align-bottom"
                          title={searchTerm}
                        >
                          {searchTerm}
                        </span>
                        "
                      </>
                    ) : (
                      "No students registered in this batch yet"
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200 text-sm uppercase">
                      <th className="py-4 px-6 text-left w-[5%]">
                        <span className="font-semibold">#</span>
                      </th>
                      <th className="py-4 px-6 text-left w-[15%]">
                        <button
                          onClick={() => handleSort("id")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          ID {getSortIcon("id")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left w-[40%]">
                        <button
                          onClick={() => handleSort("username")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Username {getSortIcon("username")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-center w-[20%]">
                        <button
                          onClick={() => handleSort("semester")}
                          className="flex items-center justify-center mx-auto font-semibold hover:text-blue-300 transition-colors"
                        >
                          Semester {getSortIcon("semester")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-center w-[20%]">
                        <button
                          onClick={() => handleSort("batch")}
                          className="flex items-center justify-center mx-auto font-semibold hover:text-blue-300 transition-colors"
                        >
                          Batch {getSortIcon("batch")}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr
                        key={student._id}
                        className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Index */}
                        <td className="py-4 px-6 text-gray-300 font-medium">
                          {(currentPage - 1) * studentsPerPage + index + 1}
                        </td>

                        {/* Student ID - Like AdminRegister */}
                        <td className="py-4 px-6">
                          <div className="min-w-0">
                            <div
                              className="text-gray-300 truncate"
                              title={student?.id?.toUpperCase() || "N/A"}
                            >
                              {student?.id?.toUpperCase() || "N/A"}
                            </div>
                          </div>
                        </td>

                        {/* Username Cell - ULTRA COMPACT */}
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3">
                              <span className="text-white text-xs sm:text-sm font-medium">
                                {student.username?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </span>
                            </div>
                            <div className="w-0 flex-1 max-w-[80px] sm:max-w-[120px]">
                              {" "}
                              {/* More compact width */}
                              <span
                                className="font-semibold text-white truncate block"
                                title={student.username || ""}
                              >
                                {student.username || ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Semester - Badge styling like AdminRegister */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-400 border border-purple-500/30 max-w-full truncate"
                            title={student?.semester || "N/A"}
                          >
                            {student?.semester || "N/A"}
                          </span>
                        </td>

                        {/* Batch - Badge styling like AdminRegister */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30 max-w-full truncate"
                            title={student?.batch?.toUpperCase() || "N/A"}
                          >
                            {student?.batch?.toUpperCase() || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls - Same as AdminRegister */}
          <div className="flex justify-center items-center mt-8 gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {totalPages <= 1 ? (
                <span className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
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
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === totalPages || totalPages <= 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Next
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination Info - Same as AdminRegister */}
          {totalStudents > 0 && (
            <div className="text-center mt-4 text-gray-400 text-sm">
              Showing {(currentPage - 1) * studentsPerPage + 1} to{" "}
              {Math.min(currentPage * studentsPerPage, totalStudents)} of{" "}
              {totalStudents} students
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

export default StudentList;
