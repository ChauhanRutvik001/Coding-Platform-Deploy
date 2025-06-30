import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Clock, Code, ChevronRight, AlertCircle, History, FileText } from 'lucide-react';
import { fetchSubmissions } from "../redux/slices/submissionSlice";
import { isPageCached } from "../utils/transitionManager";

const SubmissionPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { submissions, loading, error } = useSelector((state) => state.submissions);
  const user = useSelector((state) => state.app.user);
    const hasAttemptedFetch = useSelector((state) => state.submissions.hasAttemptedFetch);
  // Only fetch if we haven't attempted yet and don't already have submissions
  useEffect(() => {
    if (user?._id && !hasAttemptedFetch && !loading && submissions.length === 0 && !isPageCached("/profile")) {
      // console.log("SubmissionPage: Fetching submissions");
      dispatch(fetchSubmissions({ page: 1, limit: 7 }));
    }
  }, [dispatch, user?._id, hasAttemptedFetch, loading, submissions.length]);

  const handleViewMore = () => {
    navigate("/history");
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
  const truncateTitle = (title, maxLength) => {
    if (!title) return "Untitled";
    // Use responsive truncation based on screen size
    const isMobile = window.innerWidth < 640;
    const responsiveMaxLength = isMobile ? 20 : maxLength;
    return title.length > responsiveMaxLength ? `${title.slice(0, responsiveMaxLength)}...` : title;
  };

  const getStatusColor = (status) => {
    if (!status) return "gray";
    switch(status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'rejected':
        return 'red';
      case 'time limit exceeded':
        return 'yellow';
      case 'runtime error':
        return 'orange';
      case 'compilation error':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getRandomStatus = () => {
    const statuses = ['completed', 'rejected', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };
  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-blue-400">
              Submission History
            </h2>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Your recent code submissions</p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-500/10 rounded-full self-start sm:self-auto">
            <History size={20} className="text-blue-400 sm:w-6 sm:h-6" />
          </div>
        </div>        {loading && (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 sm:mt-6 text-blue-400 text-base sm:text-lg font-medium text-center">
                Loading submissions...
              </p>
            </div>
          </div>
        )}        {error && error !== "No submissions found" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 sm:w-6 sm:h-6 sm:mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="text-red-500 font-semibold text-base sm:text-lg mb-1">Error Loading Submissions</h3>
              <p className="text-gray-300 text-sm sm:text-base break-words">{error}</p>
            </div>
          </div>
        )}        {(!loading && submissions.length === 0) && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 sm:p-8 text-center">
            <FileText size={40} className="text-blue-400 mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <p className="text-lg sm:text-xl font-medium text-gray-200 mb-2">No submissions found</p>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">You haven't submitted any solutions yet.</p>
            <button 
              onClick={() => navigate('/problems')}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg text-sm sm:text-base"
            >
              Browse Problems
            </button>
          </div>
        )}        {!loading && !error && submissions.length > 0 && (
          <div>
            {/* Debug info - remove in production */}
            <div className="mb-4 p-2 bg-gray-700 rounded text-xs text-gray-300">
              Debug: Showing {submissions.length} submissions (expected: 7)
            </div>
            <ul className="space-y-2 sm:space-y-3">
              {submissions.slice(0, 7).map((submission, index) => {
                const status = submission.status || getRandomStatus();
                const statusColor = getStatusColor(status);
                return (
                  <li
                    key={submission._id}
                    onClick={() => navigate("/submissions/" + submission._id)}
                    className="bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 p-3 sm:p-4 rounded-lg flex items-center cursor-pointer transition-all duration-300 hover:bg-gray-700/50 group"
                  >
                    <div className="flex-shrink-0 mr-3 sm:mr-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <Code size={16} className="text-blue-400 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                        <h3 className="text-sm sm:text-lg font-medium text-white group-hover:text-blue-400 transition-colors truncate pr-2">
                          {truncateTitle(submission.problem_id?.title, 40)}
                        </h3>
                        <div className={`self-start sm:ml-4 px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-500/20 text-${statusColor}-400 border border-${statusColor}-500/30 whitespace-nowrap`}>
                          {status}
                        </div>
                      </div>
                      <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-400">
                        <Clock size={12} className="mr-1 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate">{formatDate(submission.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2 sm:ml-4">
                      <ChevronRight size={16} className="text-gray-500 group-hover:text-blue-400 transition-colors sm:w-5 sm:h-5" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}{!loading && submissions.length > 0 && (
          <div className="flex justify-center sm:justify-end mt-6 sm:mt-8">
            <button
              className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
              onClick={handleViewMore}
            >
              <span>View All Submissions</span>
              <ChevronRight size={16} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionPage;