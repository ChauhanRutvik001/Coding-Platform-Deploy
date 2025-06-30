import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import {
  Users,
  Book,
  Calendar,
  ChevronLeft,
  Clock,
  Code,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { debounce } from "lodash";

const StudentBatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.app.user); // Get current user from Redux
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClassmates, setShowClassmates] = useState(false);
  const [showProblems, setShowProblems] = useState(true);  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Show 10 problems per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [problems, setProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);
  const [problemStatuses, setProblemStatuses] = useState({});

  // Helper to get due date for this batch from batchDueDates
  const getDueDateForBatch = (problem) => {
    if (!problem.batchDueDates) return null;
    const entry = problem.batchDueDates.find(
      (b) => b.batch === batchId || b.batchId === batchId
    );
    return entry ? entry.dueDate : null;
  };
  const fetchProblems = useCallback(
    async (searchQuery = "", pageNum = 1) => {
      setProblemsLoading(true);
      try {
        const response = await axiosInstance.get(
          `/user/batches/${batchId}/problems`,
          {
            params: {
              search: searchQuery,
              page: pageNum,
              limit,
              sortBy: "createdAt",
              sortOrder: "desc",
            },
          }
        );
        if (response.data.success) {
          // Map each problem to include dueDate for this batch
          const mappedProblems = (response.data.problems || []).map(
            (problem) => ({
              ...problem,
              dueDate: problem.dueDate || getDueDateForBatch(problem),
            })
          );
          setProblems(mappedProblems);
          setTotalPages(Math.ceil((response.data.totalProblems || 0) / limit));
          setTotalProblems(response.data.totalProblems || 0);
        }
        // Fetch completion status for problems
        try {
          const progressResponse = await axiosInstance.get(
            `/user/batches/${batchId}/progress`
          );
          if (progressResponse.data.success && user && user._id) {
            const userProgress =
              progressResponse.data.progressStats?.studentStats?.[user._id];
            setProblemStatuses(userProgress?.problemDetails || {});
          }
        } catch (progressError) {
          console.error("Error fetching problem progress:", progressError);
          setProblemStatuses({});
        }
      } catch (error) {
        console.error("Error fetching problems:", error);
        toast.error("Failed to load problems");
        setProblems([]);
        setTotalPages(1);
        setTotalProblems(0);
      } finally {
        setProblemsLoading(false);
      }
    },
    [batchId, limit, user]
  );

  // Handle search input changes with debounce
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1); // Reset to first page on new search
      fetchProblems(value, 1);
    }, 300),
    [fetchProblems]
  );

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProblems(searchTerm, newPage);
  };

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/user/batches/${batchId}`);
        if (response.data.success) {
          setBatch(response.data.batch);
          fetchProblems("", 1); // Initial problems load
        }
      } catch (error) {
        console.error("Error fetching batch details:", error);
        toast.error("Failed to load batch details");
        navigate("/student");
      } finally {
        setLoading(false);
      }
    };

    fetchBatchDetails();
    // eslint-disable-next-line
  }, [batchId, navigate, fetchProblems]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get completion status icon and color
  const getCompletionIcon = (problemId) => {
    const status = problemStatuses[problemId];
    if (!status) {
      return {
        icon: <AlertCircle size={20} className="text-gray-400" />,
        text: "Not Started",
        color: "text-gray-400",
        bgColor: "bg-gray-900/30",
      };
    }

    switch (status.status) {
      case "completed":
        return {
          icon: <CheckCircle size={20} className="text-green-400" />,
          text: "Completed",
          color: "text-green-400",
          bgColor: "bg-green-900/30",
        };
      case "attempted":
        return {
          icon: <AlertCircle size={20} className="text-yellow-400" />,
          text: "In Progress",
          color: "text-yellow-400",
          bgColor: "bg-yellow-900/30",
        };
      default:
        return {
          icon: <AlertCircle size={20} className="text-gray-400" />,
          text: "Not Started",
          color: "text-gray-400",
          bgColor: "bg-gray-900/30",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64 mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-xl font-medium text-red-400 mb-2">
              Batch Not Found
            </h2>
            <p className="text-gray-400 mb-4">
              The batch you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Link
              to="/student"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back button */}
        <div className="mb-4 sm:mb-6 mt-12 sm:mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-400 hover:text-blue-300 transition text-sm sm:text-base"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <Link
            to={`/student/batch/${batchId}/progress`}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-sm sm:text-base"
          >
            <TrendingUp size={16} sm:size={18} />
            <span className="hidden sm:inline">View Progress Analytics</span>
            <span className="sm:hidden">Progress</span>
          </Link>
        </div>        {/* Batch Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6 overflow-hidden">
          <h1 
            className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words word-wrap hyphens-auto leading-tight"
            title={batch.name}
          >
            {batch.name}
          </h1>
          {batch.description && (
            <p 
              className="text-blue-100 mb-3 text-sm sm:text-base break-words word-wrap hyphens-auto leading-relaxed"
              title={batch.description}
            >
              {batch.description}
            </p>
          )}          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">            {batch.subject && (
              <div className="flex items-start gap-1 min-w-0 w-full sm:w-auto">
                <Book size={14} sm:size={16} className="text-blue-300 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-blue-300 block">Subject:</span>
                  <span 
                    className="break-words word-wrap hyphens-auto leading-relaxed block"
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {batch.subject}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
              <Calendar size={14} sm:size={16} className="text-blue-300 flex-shrink-0" />
              <span 
                className="truncate max-w-full"
                title={`Created: ${formatDate(batch.createdAt)}`}
              >
                Created: {formatDate(batch.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Users size={14} sm:size={16} className="text-blue-300 flex-shrink-0" />
              <span>{batch.students?.length || 0} Students</span>
            </div>
            {batch.faculty && (
              <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
                <Users size={14} sm:size={16} className="text-blue-300 flex-shrink-0" />
                <span 
                  className="truncate max-w-full"
                  title={`Faculty: ${batch.faculty.username}`}
                >
                  Faculty: {batch.faculty.username}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Code size={14} sm:size={16} className="text-blue-300 flex-shrink-0" />
              <span>Total Problems: {totalProblems}</span>
            </div>
          </div>
        </div><div className="gap-4 sm:gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Content Area (Problems or Students) */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  {showProblems ? (
                    <>
                      <Code className="text-blue-400 flex-shrink-0" size={20} />
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Assigned Problems
                      </h2>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                        {totalProblems}
                      </span>
                    </>
                  ) : (
                    <>
                      <Users className="text-blue-400 flex-shrink-0" size={20} />
                      <h2 className="text-lg sm:text-xl font-semibold">Classmates</h2>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs sm:text-sm">
                        {batch.students?.length || 0}
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowProblems(!showProblems);
                    setShowClassmates(!showClassmates);
                  }}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm sm:text-base w-full sm:w-auto"
                >
                  {showProblems ? "Show Classmates" : "Show Problems"}
                </button>
              </div>

              {showProblems ? (
                <>                  {/* Search input */}
                  <div className="mb-4 sm:mb-6 relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search problems by title or difficulty..."
                      className="w-full p-3 sm:p-4 pr-12 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    {problemsLoading && (
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>                  {/* Problems List */}
                  {problemsLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : problems.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        {problems.map((problem) => {
                          const completionStatus = getCompletionIcon(
                            problem._id
                          );
                          return (                            <div
                              key={problem._id}
                              onClick={() =>
                                navigate(`/problems/${problem._id}/${batchId}`)
                              }
                              className="p-3 sm:p-4 bg-gray-750 rounded-lg border border-gray-700 hover:bg-gray-700 cursor-pointer transition-all relative group overflow-hidden"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                                {/* Status Icon */}
                                <div
                                  className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${completionStatus.bgColor} border-2 border-current ${completionStatus.color} flex-shrink-0 self-start sm:self-auto`}
                                >
                                  {completionStatus.icon}
                                </div>

                                {/* Problem Details */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2 min-w-0">
                                    <h3 
                                      className="font-medium text-white group-hover:text-blue-400 transition-colors text-sm sm:text-base break-words word-wrap hyphens-auto leading-tight min-w-0 flex-1" 
                                      title={problem.title}
                                      style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word'
                                      }}
                                    >
                                      {problem.title}
                                    </h3>
                                    <ArrowUpRight
                                      size={14}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block flex-shrink-0"
                                    />
                                  </div>
                                  <div
                                    className={`text-xs sm:text-sm mb-2 font-medium ${completionStatus.color} break-words`}
                                  >
                                    {completionStatus.text}
                                    {problemStatuses[problem._id]?.score !==
                                      undefined &&
                                      ` - ${
                                        problemStatuses[problem._id].score
                                      }% score`}
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                                          problem.difficulty === "Easy"
                                            ? "bg-green-900/30 text-green-400"
                                            : problem.difficulty === "Medium"
                                            ? "bg-yellow-900/30 text-yellow-400"
                                            : "bg-red-900/30 text-red-400"
                                        }`}
                                      >
                                        {problem.difficulty}
                                      </span>
                                      {(() => {
                                        const due =
                                          problem.dueDate ||
                                          getDueDateForBatch(problem);
                                        if (!due) return null;
                                        const isPast =
                                          new Date(due) < new Date();
                                        return (
                                          <span
                                            className={`text-xs flex items-center gap-1 flex-shrink-0 min-w-0 ${
                                              isPast
                                                ? "text-red-400"
                                                : "text-gray-400"
                                            }`}
                                            title={
                                              isPast
                                                ? `Due Passed: ${formatDate(
                                                    due
                                                  )}`
                                                : `Due: ${formatDate(due)}`
                                            }
                                          >
                                            <Clock size={12} className="flex-shrink-0" />
                                            <span className="truncate min-w-0">
                                              {isPast
                                                ? "Due Passed"
                                                : `Due: ${formatDate(due)}`}
                                            </span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    {problem.createdBy && (
                                      <span 
                                        className="text-xs text-gray-400 truncate min-w-0 flex-shrink-0 sm:flex-shrink" 
                                        title={`By: ${problem.createdBy.username}`}
                                      >
                                        By: {problem.createdBy.username}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>                      {/* Results count and pagination info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 text-xs sm:text-sm text-gray-400 min-w-0">
                        <div className="break-words min-w-0 flex-1">
                          Showing {problems.length} of {totalProblems} {searchTerm ? "matching" : ""}{" "}
                          problems {searchTerm ? (
                            <span className="break-all" title={`Search term: ${searchTerm}`}>
                              for "{searchTerm}"
                            </span>
                          ) : ""}
                        </div>
                        {totalPages > 1 && (
                          <div className="text-xs flex-shrink-0">
                            Page {page} of {totalPages}
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={page === 1}
                            className="px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                            title="First page"
                          >
                            «
                          </button>
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                            title="Previous page"
                          >
                            ‹
                          </button>

                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => {
                              // Show first page, last page, current page, and pages around current
                              if (
                                i === 0 || // First page
                                i === totalPages - 1 || // Last page
                                (i >= page - 2 && i <= page) || // 2 pages before current
                                (i >= page && i <= page + 1) // 1 page after current
                              ) {
                                return (
                                  <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-2 py-1 sm:px-3 sm:py-2 rounded min-w-[2rem] sm:min-w-[2.5rem] text-xs sm:text-sm ${
                                      page === i + 1
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-white hover:bg-gray-600"
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                );
                              } else if (
                                (i === 1 && page > 3) || // Show ellipsis after first page
                                (i === totalPages - 2 && page < totalPages - 3) // Show ellipsis before last page
                              ) {
                                return (
                                  <span
                                    key={i}
                                    className="px-1 sm:px-2 py-1 text-gray-500 text-xs sm:text-sm"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                            title="Next page"
                          >
                            ›
                          </button>
                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={page === totalPages}
                            className="px-2 py-1 sm:px-3 sm:py-2 rounded bg-gray-700 text-white disabled:opacity-50 text-xs sm:text-sm"
                            title="Last page"
                          >
                            »
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-750 rounded-lg">
                      <AlertCircle size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-400 text-sm sm:text-base text-center">
                        {searchTerm 
                          ? `No problems found matching "${searchTerm}"`
                          : "No problems have been assigned to this batch yet."
                        }
                      </p>
                    </div>
                  )}
                </>              ) : (
                <div className="mt-4 overflow-x-auto">
                  <div className="min-w-full">
                    <table className="w-full text-left text-xs sm:text-sm text-gray-400 table-fixed">
                      <thead className="bg-gray-700 text-gray-300">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 w-1/6 sm:w-1/5">Student ID</th>
                          <th className="px-2 sm:px-4 py-2 w-1/3 sm:w-1/4">Name</th>
                          <th className="px-2 sm:px-4 py-2 hidden sm:table-cell w-1/4">Branch</th>
                          <th className="px-2 sm:px-4 py-2 hidden sm:table-cell w-1/6">Semester</th>
                          <th className="px-2 sm:px-4 py-2 hidden md:table-cell w-1/4">Batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.students.map((student) => (
                          <tr
                            key={student._id}
                            className="border-t border-gray-700 hover:bg-gray-750"
                          >
                            <td className="px-2 sm:px-4 py-2 truncate overflow-hidden" title={student.id}>
                              {student.id}
                            </td>
                            <td className="px-2 sm:px-4 py-2 truncate overflow-hidden" title={student.username}>
                              {student.username}
                            </td>
                            <td className="px-2 sm:px-4 py-2 hidden sm:table-cell truncate overflow-hidden" title={student.branch || "Not specified"}>
                              {student.branch || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 hidden sm:table-cell truncate overflow-hidden">
                              {student.semester || "-"}
                            </td>
                            <td className="px-2 sm:px-4 py-2 hidden md:table-cell truncate overflow-hidden" title={student.batch || "Not specified"}>
                              {student.batch || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile view for hidden columns */}
                  <div className="sm:hidden mt-4 space-y-2">
                    {batch.students.map((student) => (
                      <div key={`mobile-${student._id}`} className="bg-gray-750 p-3 rounded-lg overflow-hidden">
                        <div className="text-sm text-gray-300 mb-1 break-words">
                          <span className="font-medium truncate" title={student.username}>
                            {student.username}
                          </span> 
                          <span className="text-gray-400 ml-1 truncate" title={student.id}>
                            ({student.id})
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                          {student.branch && (
                            <span className="truncate" title={`Branch: ${student.branch}`}>
                              Branch: {student.branch}
                            </span>
                          )}
                          {student.semester && (
                            <span className="flex-shrink-0">
                              Sem: {student.semester}
                            </span>
                          )}
                          {student.batch && (
                            <span className="truncate" title={`Batch: ${student.batch}`}>
                              Batch: {student.batch}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentBatchDetails;
