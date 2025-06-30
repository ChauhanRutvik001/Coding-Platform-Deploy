import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import { 
  FaUserTie, 
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";

const AdminRegister = () => {
  const user = useSelector((store) => store.app.user);
  const [facultys, setFacultys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [facultyPage, setFacultyPage] = useState(1);
  const [totalFacultyPages, setTotalFacultyPages] = useState(0);
  const [totalFaculty, setTotalFaculty] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const itemsPerPage = 10;
  const navigate = useNavigate();

  const fetchFacultys = async (page, search = "", sort = "createdAt", order = "desc") => {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/admin/faculty/get-faculty-by-admin", {
        page,
        limit: itemsPerPage,
        search: search.trim(),
        sortBy: sort,
        sortOrder: order,
      });
      if (response.data.success) {
        setFacultys(response.data.facultys);
        setTotalFacultyPages(response.data.totalPages);
        setTotalFaculty(response.data.totalStudents);
      } else {
        setError(response.data.message || "Failed to fetch faculty.");
      }
    } catch (err) {
      setError("An error occurred while fetching faculty.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultys(facultyPage, searchTerm, sortBy, sortOrder);
    // eslint-disable-next-line
  }, [facultyPage, searchTerm, sortBy, sortOrder]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFacultyPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSort = (column) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(column);
    setSortOrder(newOrder);
    setFacultyPage(1); // Reset to first page when sorting
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFacultyClick = (facultyId) => {
    navigate(`/faculty/${facultyId}/batches`);
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
  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUserTie className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Faculty Management
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
          {/* Search and Stats Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search faculty by name, email, or branch..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Search and manage all registered faculty members
              </p>
            </div>
            <div className="flex items-center bg-gray-800 py-3 px-6 rounded-xl shadow font-semibold text-lg">
              <span>Total Faculty:</span>
              <span className="ml-3 text-2xl font-extrabold text-blue-400">{totalFaculty}</span>
            </div>
          </div>

          {/* Table Section with Long Name Handling */}
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-700 text-gray-200 text-sm uppercase">
                      <th className="py-4 px-6 text-left w-[5%]">
                        <span className="font-semibold">#</span>
                      </th>
                      <th className="py-4 px-6 text-left w-[18%]">
                        <button
                          onClick={() => handleSort("username")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Username {getSortIcon("username")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left w-[22%]">
                        <button
                          onClick={() => handleSort("email")}
                          className="flex items-center font-semibold hover:text-blue-300 transition-colors"
                        >
                          Email {getSortIcon("email")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-center w-[10%]">
                        <button
                          onClick={() => handleSort("branch")}
                          className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                        >
                          Branch {getSortIcon("branch")}
                        </button>
                      </th>
                      <th className="py-4 px-6 text-left w-[30%]">
                        <span className="font-semibold">Assigned Batches</span>
                      </th>
                      <th className="py-4 px-6 text-center w-[15%]">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center justify-center font-semibold mx-auto hover:text-blue-300 transition-colors"
                        >
                          Created Date {getSortIcon("createdAt")}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultys.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 px-6 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                            <p className="text-lg font-medium">No faculty found</p>
                            <p className="text-sm text-gray-500">
                              {searchTerm ? (
                                <>
                                  No results for "<span className="max-w-[200px] inline-block truncate align-bottom" title={searchTerm}>{searchTerm}</span>"
                                </>
                              ) : "No faculty members registered yet"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      facultys.map((faculty, index) => (
                        <tr
                          key={faculty._id}
                          onClick={() => handleFacultyClick(faculty._id)}
                          className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 text-gray-300 font-medium">
                            {(facultyPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span className="text-white text-sm font-medium">
                                  {faculty.username?.charAt(0)?.toUpperCase()}
                                </span>
                              </div>
                              <div 
                                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors truncate"
                                title={faculty.username}
                              >
                                {faculty.username}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div 
                              className="text-gray-300 truncate" 
                              title={faculty.email}
                            >
                              {faculty.email}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span 
                              className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30 max-w-full truncate"
                              title={faculty?.branch?.toUpperCase() || "N/A"}
                            >
                              {faculty?.branch?.toUpperCase() || "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {faculty.batches && faculty.batches.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {faculty.batches.slice(0, 3).map((batch, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-900/40 text-green-400 border border-green-500/30 max-w-[120px] truncate"
                                    title={typeof batch === "string" ? batch : batch.name}
                                  >
                                    {typeof batch === "string" ? batch : batch.name}
                                  </span>
                                ))}
                                {faculty.batches.length > 3 && (
                                  <span
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300 cursor-help"
                                    title={faculty.batches.map(b => typeof b === "string" ? b : b.name).join(", ")}
                                  >
                                    +{faculty.batches.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm italic">No batches assigned</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-400 text-sm">
                            {formatDate(faculty.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination controls - no changes needed */}
          <div className="flex justify-center items-center mt-8 gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setFacultyPage(Math.max(1, facultyPage - 1))}
              disabled={facultyPage === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                facultyPage === 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers - Always show current page info */}
            <div className="flex gap-1">
              {totalFacultyPages <= 1 ? (
                <span className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white">
                  1
                </span>
              ) : (
                [...Array(Math.min(5, totalFacultyPages))].map((_, idx) => {
                  let pageNum;
                  if (totalFacultyPages <= 5) {
                    pageNum = idx + 1;
                  } else if (facultyPage <= 3) {
                    pageNum = idx + 1;
                  } else if (facultyPage >= totalFacultyPages - 2) {
                    pageNum = totalFacultyPages - 4 + idx;
                  } else {
                    pageNum = facultyPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFacultyPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        facultyPage === pageNum
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
              onClick={() => setFacultyPage(Math.min(totalFacultyPages, facultyPage + 1))}
              disabled={facultyPage === totalFacultyPages || totalFacultyPages <= 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                facultyPage === totalFacultyPages || totalFacultyPages <= 1
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Next
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination Info */}
          {totalFaculty > 0 && (
            <div className="text-center mt-4 text-gray-400 text-sm">
              Showing {(facultyPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(facultyPage * itemsPerPage, totalFaculty)} of {totalFaculty} faculty members
              {totalFacultyPages > 1 && (
                <span className="ml-4">Page {facultyPage} of {totalFacultyPages}</span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminRegister;
