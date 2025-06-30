import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchHistory, setCurrentPage } from "../redux/slices/historySlice";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, loading, error, currentPage, totalPages } = useSelector(
    (state) => state.history
  );
  const user = useSelector((state) => state.app.user);

  useEffect(() => {
    if (history.length === 0) {
      dispatch(fetchHistory({ page: currentPage, limit: 9 }));
    }
  }, [dispatch, currentPage, history.length]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      dispatch(setCurrentPage(newPage));
      dispatch(fetchHistory({ page: newPage, limit: 9 }));
    }
  };

  // Utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getStatusInfo = (status) => {
    if (!status) return { icon: AlertCircle, color: "gray" };
    switch (status.toLowerCase()) {
      case "completed":
      case "accepted":
        return { icon: CheckCircle, color: "green" };
      case "rejected":
        return { icon: XCircle, color: "red" };
      case "time limit exceeded":
        return { icon: Clock, color: "yellow" };
      case "runtime error":
      case "compilation error":
        return { icon: AlertCircle, color: "orange" };
      default:
        return { icon: AlertCircle, color: "gray" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex w-full">
      {/* Main Content */}
      <div className="flex-1 bg-gray-900 mt-8 w-full">
        {/* Header Section */}
        <div className="from-gray-900 mb-4 md:mb-8 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mt-8 md:mt-16"></div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-blue-400">
                  Submission History
                </h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1 md:mt-2">
                  Complete record of your code submissions
                </p>
              </div>
              <div className="p-3 md:p-4 bg-blue-500/10 rounded-full">
                <Code size={24} className="text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin h-12 w-12 md:h-16 md:w-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-blue-400 text-lg md:text-xl font-medium">
                Loading history...
              </p>
            </div>
          ) : error ? (
            <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 md:p-6">
              <div className="flex items-center">
                <AlertCircle size={24} className="text-red-500 mr-3 md:mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-red-500 font-semibold text-lg">
                    Error Loading History
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base">{error}</p>
                </div>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 md:p-8 text-center">
              <FileText size={36} className="mx-auto text-blue-400 mb-3 md:mb-4 md:text-5xl" />
              <p className="text-lg md:text-xl font-medium text-gray-200 mb-2">
                No history found
              </p>
              <p className="text-gray-400 mb-4 md:mb-6 text-sm md:text-base">
                You haven't submitted any solutions yet.
              </p>
              <button
                onClick={() => navigate("/problems")}
                className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg text-sm md:text-base"
              >
                Browse Problems
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              {/* Table with horizontal scroll for small screens */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/80 border-b border-gray-700">
                    <tr>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        #
                      </th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[150px]">
                        Problem
                      </th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Language
                      </th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Test Cases
                      </th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {history.map((submission, index) => {
                      const { icon: StatusIcon, color } = getStatusInfo(
                        submission.status
                      );
                      return (
                        <tr
                          key={submission._id}
                          onClick={() =>
                            navigate(`/submissions/${submission._id}`)
                          }
                          className="hover:bg-blue-500/5 cursor-pointer transition-colors duration-200"
                        >
                          <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-medium text-gray-300">
                            {index + 1 + (currentPage - 1) * 9}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                <Code size={16} className="text-blue-400" />
                              </div>
                              <div className="ml-3 md:ml-4">
                                <div className="text-xs md:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
                                  {submission.problem_id?.title || "Untitled"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-center">
                            <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-gray-700 text-gray-300 capitalize">
                              {submission.language || "Unknown"}
                            </span>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-center">
                            {submission.numberOfTestCase != null &&
                            submission.numberOfTestCasePass != null ? (
                              <div className="flex items-center justify-center">
                                <div className="relative w-full max-w-[60px] md:max-w-[100px] h-1.5 md:h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${
                                        (submission.numberOfTestCasePass /
                                          submission.numberOfTestCase) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="ml-1.5 md:ml-2 text-xs font-medium">
                                  {submission.numberOfTestCasePass}/
                                  {submission.numberOfTestCase}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-center">
                            <div className="flex items-center justify-center">
                              <StatusIcon
                                size={14}
                                className={`text-${color}-500 mr-1 md:mr-1.5 flex-shrink-0`}
                              />
                              <span className={`text-${color}-500 capitalize truncate max-w-[60px] sm:max-w-full`}>
                                {submission.status || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-center text-gray-400 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <Clock size={12} className="mr-1 md:mr-1.5 flex-shrink-0" />
                              <span>{formatDate(submission.createdAt)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="bg-gray-800/50 px-4 sm:px-6 py-3 md:py-4 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <span className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
                  Showing page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    <ChevronLeft size={14} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      currentPage === totalPages
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-500"
                    }`}
                  >
                    Next
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
