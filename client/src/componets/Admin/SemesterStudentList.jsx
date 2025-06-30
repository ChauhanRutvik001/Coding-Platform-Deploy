import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { 
  FaUserGraduate, 
  FaSort,
  FaSortUp,
  FaSortDown,
  FaLayerGroup,
  FaChevronLeft,
  FaChevronRight,
  FaUserTie
} from "react-icons/fa";

const STUDENTS_PER_PAGE = 5;

const SemesterStudentList = () => {
  const { semesterId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [batchPages, setBatchPages] = useState({});
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/problems/getStudents");
        const semesterStudents = res.data.students.filter(
          (s) => String(s.semester) === String(semesterId)
        );
        setStudents(semesterStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch students data");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [semesterId]);

  // Group students by batch
  const batchGroups = {};
  students.forEach((student) => {
    const batchName = student.batch || "Unassigned";
    if (!batchGroups[batchName]) {
      batchGroups[batchName] = [];
    }
    batchGroups[batchName].push(student);
  });

  // Ensure batchPages state is initialized for all batches
  useEffect(() => {
    const newBatchPages = { ...batchPages };
    Object.keys(batchGroups).forEach((batch) => {
      if (newBatchPages[batch] === undefined) {
        newBatchPages[batch] = 1;
      }
    });
    setBatchPages(newBatchPages);
  }, [students.length]);

  // Handle page change for a batch
  const handlePageChange = (batch, newPage) => {
    setBatchPages((prev) => ({
      ...prev,
      [batch]: newPage,
    }));
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Get sort icon
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

  // Get total student count
  const totalStudents = Object.values(batchGroups).reduce(
    (total, students) => total + students.length, 
    0
  );

  // Get total batch count
  const totalBatches = Object.keys(batchGroups).length;

  // Arrange batches in pairs for grid display
  const batchPairs = [];
  const batchNames = Object.keys(batchGroups);
  for (let i = 0; i < batchNames.length; i += 2) {
    batchPairs.push([
      batchNames[i],
      i + 1 < batchNames.length ? batchNames[i + 1] : null
    ]);
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-2 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUserTie className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Semester {semesterId} Students
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
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Stats Section */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-gray-800 py-3 px-6 rounded-lg flex items-center shadow-md">
            <span className="text-gray-400">Total Students:</span>
            <span className="ml-2 text-xl font-bold text-blue-400">{totalStudents}</span>
          </div>
          <div className="bg-gray-800 py-3 px-6 rounded-lg flex items-center shadow-md">
            <span className="text-gray-400">Total Batches:</span>
            <span className="ml-2 text-xl font-bold text-blue-400">{totalBatches}</span>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-blue-400">Loading students...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : totalStudents === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <FaUserGraduate className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Students Found</h3>
            <p className="text-gray-500">
              No students registered for this semester yet
            </p>
          </div>
        ) : (
          /* Batch Tables in 2-column Grid */
          <div>
            {batchPairs.map((pair, pairIndex) => (
              <div key={pairIndex} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {pair.map((batchName, index) => 
                  batchName ? (
                    <BatchTable 
                      key={batchName}
                      batchName={batchName}
                      students={batchGroups[batchName]}
                      currentPage={batchPages[batchName] || 1}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      handleSort={handleSort}
                      getSortIcon={getSortIcon}
                      handlePageChange={handlePageChange}
                    />
                  ) : (
                    <div key={`empty-${index}`}></div> // Empty div for grid alignment
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate BatchTable component with name truncation
const BatchTable = ({ 
  batchName, 
  students, 
  currentPage, 
  sortBy, 
  sortOrder,
  handleSort,
  getSortIcon,
  handlePageChange
}) => {
  // Sort students in the batch
  const sortedStudents = [...students].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const paginatedStudents = sortedStudents.slice(
    startIndex,
    startIndex + STUDENTS_PER_PAGE
  );

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Batch Header with Truncation */}
      <div className="flex items-center px-4 py-3 bg-gray-700 border-b border-gray-600">
        <FaLayerGroup className="text-blue-400 mr-2 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-white flex items-baseline">
            <span className="mr-1">Batch:</span>
            <span 
              className="text-blue-400 truncate max-w-[120px] inline-block"
              title={batchName}
            >
              {batchName}
            </span>
            <span className="ml-1.5 text-sm font-normal text-gray-400 flex-shrink-0">
              ({sortedStudents.length})
            </span>
          </h2>
        </div>
      </div>

      {/* Batch Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-700 bg-gray-800">
              <th className="px-3 py-3 w-[8%]">#</th>
              <th className="px-3 py-3 w-[42%]">
                <button 
                  onClick={() => handleSort("username")}
                  className="flex items-center hover:text-blue-400 transition-colors"
                >
                  Name {getSortIcon("username")}
                </button>
              </th>
              <th className="px-3 py-3 w-[25%]">
                <button 
                  onClick={() => handleSort("id")}
                  className="flex items-center hover:text-blue-400 transition-colors"
                >
                  ID {getSortIcon("id")}
                </button>
              </th>
              <th className="px-3 py-3 w-[25%] text-center">
                <button 
                  onClick={() => handleSort("branch")}
                  className="flex items-center justify-center mx-auto hover:text-blue-400 transition-colors"
                >
                  Branch {getSortIcon("branch")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student, index) => (
              <tr 
                key={student._id || index}
                className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-3 py-3 text-gray-400">
                  {startIndex + index + 1}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center min-w-0">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-white font-medium text-xs">
                        {student.username?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <span 
                      className="font-medium text-gray-200 truncate"
                      title={student.username}
                    >
                      {student.username}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div 
                    className="text-gray-300 truncate"
                    title={student.id?.toUpperCase() || "N/A"}
                  >
                    {student.id?.toUpperCase() || "N/A"}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800/30 inline-block max-w-full truncate"
                    title={student.branch?.toUpperCase() || "N/A"}
                  >
                    {student.branch?.toUpperCase() || "N/A"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
          <button
            onClick={() => handlePageChange(batchName, Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`flex items-center text-xs px-2 py-1 rounded ${
              currentPage === 1
                ? "text-gray-500 cursor-not-allowed"
                : "text-blue-400 hover:bg-blue-900/20"
            }`}
          >
            <FaChevronLeft className="mr-1" /> Prev
          </button>
          <div className="text-gray-400 text-xs">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(batchName, Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center text-xs px-2 py-1 rounded ${
              currentPage === totalPages
                ? "text-gray-500 cursor-not-allowed"
                : "text-blue-400 hover:bg-blue-900/20"
            }`}
          >
            Next <FaChevronRight className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SemesterStudentList; 