import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, Calendar, School, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Student = () => {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [recentProblems, setRecentProblems] = useState([]);
  const [problemStatuses, setProblemStatuses] = useState({});
  const navigate = useNavigate();
  const user = useSelector((state) => state.app.user);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // Fetch batches student is part of
        const batchesResponse = await axiosInstance.get('/user/my-batches');
        setBatches(batchesResponse.data.batches || []);
        
        // Fetch all assigned problems with due dates
        const problemsResponse = await axiosInstance.get('/problems/recent-due-problems', {
          params: {
            limit: 100,
            sort: 'recent'
          }
        });
        let allProblems = problemsResponse.data.problems || [];

        // Filter to only problems with a dueDate and sort by dueDate ascending
        const now = new Date();
        const recentDueProblems = allProblems
          .filter(p => p.dueDate && new Date(p.dueDate) >= now)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);

        setRecentProblems(recentDueProblems);

        // Fetch completion status for recent due problems from all batches
        const statusPromises = (batchesResponse.data.batches || []).map(async (batch) => {
          try {
            const progressResponse = await axiosInstance.get(`/user/batches/${batch._id}/progress`);
            if (progressResponse.data.success && user && user._id) {
              const userProgress = progressResponse.data.progressStats?.studentStats?.[user._id];
              return {
                batchId: batch._id,
                problemDetails: userProgress?.problemDetails || {}
              };
            }
            return { batchId: batch._id, problemDetails: {} };
          } catch (error) {
            console.error(`Error fetching progress for batch ${batch._id}:`, error);
            return { batchId: batch._id, problemDetails: {} };
          }
        });

        const statusResults = await Promise.all(statusPromises);
        const combinedStatuses = {};
        statusResults.forEach(result => {
          Object.assign(combinedStatuses, result.problemDetails);
        });
        setProblemStatuses(combinedStatuses);

      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get completion status icon and color
  const getCompletionIcon = (problemId) => {
    const status = problemStatuses[problemId];
    if (!status) {
      return {
        icon: <AlertCircle size={24} className="text-gray-400" />,
        text: 'Not Started',
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/30'
      };
    }

    switch (status.status) {
      case 'completed':
        return {
          icon: <CheckCircle size={24} className="text-green-400" />,
          text: 'Completed',
          color: 'text-green-400',
          bgColor: 'bg-green-900/30'
        };
      case 'attempted':
        return {
          icon: <AlertCircle size={24} className="text-yellow-400" />,
          text: 'In Progress',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30'
        };
      default:
        return {
          icon: <AlertCircle size={24} className="text-gray-400" />,
          text: 'Not Started ',
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/30'
        };
    }
  };

  // Helper to get days left
  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Due Passed";
    if (diff === 0) return "Due Today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  };

  // Get 3 most recently assigned problems (by createdAt)
  const recentlyAssignedProblems = recentProblems
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  // Get top 3 upcoming due problems
  const topDueProblems = recentProblems.slice(0, 3);

  // Get 5 most recent batches (by createdAt or updatedAt)
  const recentBatches = batches
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    .slice(0, 5);

  return (    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-blue-400 mt-12 sm:mt-16 break-words">Student Dashboard</h1>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-xl p-4 sm:p-6 shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome to your Classroom</h2>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-blue-700/50 rounded w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                  </div>
                  <div className="h-4 bg-blue-700/50 rounded w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-100 text-sm sm:text-base">
                  You're enrolled in {batches.length} {batches.length === 1 ? 'batch' : 'batches'}.
                  {recentProblems.length > 0 ? ` You have ${recentProblems.length} recent problems to solve.` : ''}
                </p>
              )}
            </div>
              {/* Recent Due Problems */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-blue-400 flex-shrink-0" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold">Recent Due Problems</h2>
              </div>
              {loading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-750 rounded-lg border border-gray-700">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg relative overflow-hidden flex-shrink-0 self-start sm:self-auto">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 sm:h-5 bg-gray-700 rounded w-3/4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <div className="h-3 sm:h-4 bg-gray-700 rounded w-28 sm:w-32 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                          <div className="h-3 sm:h-4 bg-gray-700 rounded w-20 sm:w-24 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="h-3 sm:h-4 bg-gray-700 rounded w-16 sm:w-20 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="w-12 h-5 sm:w-16 sm:h-6 bg-gray-700 rounded-full relative overflow-hidden flex-shrink-0 self-start sm:self-auto">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-4">
                    <button 
                      className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                      onClick={() => navigate('/student/batches')}
                    >
                      View All Problems
                    </button>
                  </div>
                </div>
              ) : topDueProblems.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm sm:text-base">No problems assigned yet.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {topDueProblems.map(problem => {
                    const completionStatus = getCompletionIcon(problem._id);
                    const daysLeft = getDaysLeft(problem.dueDate);
                    return (
                      <div 
                        key={problem._id} 
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition group"
                        onClick={() => navigate(`/problems/${problem._id}/${problem.batchId}`)}
                      >
                        <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${completionStatus.bgColor} border-2 border-current ${completionStatus.color} flex-shrink-0 self-start sm:self-auto`}>
                          {completionStatus.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base sm:text-lg group-hover:text-blue-400 transition-colors truncate" title={problem.title}>
                            {problem.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="flex-shrink-0" />
                              <span className="truncate">Assigned: {formatDate(problem.createdAt)}</span>
                            </div>
                            {problem.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className={`truncate ${daysLeft === "Due Passed" ? "text-red-400" : "text-blue-300"}`}>
                                  {daysLeft}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className={`text-xs sm:text-sm mt-1 font-medium ${completionStatus.color} truncate`}>
                            {completionStatus.text}
                            {problemStatuses[problem._id]?.score && 
                              ` - ${problemStatuses[problem._id].score}% score`
                            }
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 self-start sm:self-auto">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0
                            ${problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : 
                              problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-red-900/30 text-red-400'}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && (
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => navigate('/student/batches')}
                  >
                    View All Problems
                  </button>
                </div>
              )}
            </div>            {/* Recently Assigned Problems */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mt-4 sm:mt-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-blue-400 flex-shrink-0" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold">Recently Assigned Problems</h2>
              </div>
              {loading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-750 rounded-lg border border-gray-700">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-lg relative overflow-hidden flex-shrink-0 self-start sm:self-auto">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 sm:h-5 bg-gray-700 rounded w-3/4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <div className="h-3 sm:h-4 bg-gray-700 rounded w-28 sm:w-32 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                          <div className="h-3 sm:h-4 bg-gray-700 rounded w-20 sm:w-24 relative overflow-hidden">
                            <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="h-3 sm:h-4 bg-gray-700 rounded w-16 sm:w-20 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="w-12 h-5 sm:w-16 sm:h-6 bg-gray-700 rounded-full relative overflow-hidden flex-shrink-0 self-start sm:self-auto">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-4">
                    <button 
                      className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                      onClick={() => navigate('/student/batches')}
                    >
                      View All Problems
                    </button>
                  </div>
                </div>
              ) : recentlyAssignedProblems.length === 0 ? (
                <p className="text-gray-400 text-center py-6 text-sm sm:text-base">No problems assigned yet.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentlyAssignedProblems.map(problem => {
                    const completionStatus = getCompletionIcon(problem._id);
                    return (
                      <div 
                        key={problem._id} 
                        className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition group"
                        onClick={() => navigate(`/problems/${problem._id}/${problem.batchId}`)}
                      >
                        <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${completionStatus.bgColor} border-2 border-current ${completionStatus.color} flex-shrink-0 self-start sm:self-auto`}>
                          {completionStatus.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base sm:text-lg group-hover:text-blue-400 transition-colors truncate" title={problem.title}>
                            {problem.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-400 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="flex-shrink-0" />
                              <span className="truncate">Assigned: {formatDate(problem.createdAt)}</span>
                            </div>
                            {problem.dueDate && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="flex-shrink-0" />
                                <span className="truncate">{formatDate(problem.dueDate)}</span>
                              </div>
                            )}
                          </div>
                          <div className={`text-xs sm:text-sm mt-1 font-medium ${completionStatus.color} truncate`}>
                            {completionStatus.text}
                            {problemStatuses[problem._id]?.score &&
                              ` - ${problemStatuses[problem._id].score}% score`
                            }
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 self-start sm:self-auto">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0
                            ${problem.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : 
                              problem.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 
                              'bg-red-900/30 text-red-400'}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loading && (
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => navigate('/student/batches')}
                  >
                    View All Problems
                  </button>
                </div>
              )}
            </div>
          </div>
            {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">            {/* My Batches */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-blue-400 flex-shrink-0" size={20} />
                <h2 className="text-lg sm:text-xl font-semibold">My Batches</h2>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(index => (
                    <div key={index} className="p-3 bg-gray-750 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 bg-gray-700 rounded relative overflow-hidden flex-shrink-0">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                        <div className="h-4 bg-gray-700 rounded w-20 sm:w-24 relative overflow-hidden">
                          <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-700 rounded w-24 sm:w-32 relative overflow-hidden">
                        <div className="absolute inset-0 bg-shimmer-gradient bg-shimmer animate-shimmer"></div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-4">
                    <button 
                      className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                      onClick={() => navigate('/student/batches')}
                    >
                      View All Batches
                    </button>
                  </div>
                </div>
              ) : recentBatches.length === 0 ? (
                <p className="text-gray-400 text-center py-4 text-sm sm:text-base">You're not enrolled in any batches.</p>
              ) : (
                <div className="space-y-3">
                  {recentBatches.map(batch => (
                    <div 
                      key={batch._id} 
                      className="p-3 bg-gray-750 rounded-lg border border-gray-700 hover:border-blue-700 cursor-pointer transition"
                      onClick={() => navigate(`/student/batch/${batch._id}`)}
                    >
                      <h3 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                        <School size={16} className="text-blue-400 flex-shrink-0" />
                        <span className="truncate" title={batch.name}>{batch.name}</span>
                      </h3>
                      {batch.subject && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 truncate" title={batch.subject}>
                          {batch.subject}
                        </p>
                      )}
                    </div>
                  ))}
                  {batches.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">
                        Showing {recentBatches.length} of {batches.length} batches
                      </p>
                    </div>
                  )}
                </div>
              )}
              {!loading && (
                <div className="text-center mt-4">
                  <button 
                    className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition"
                    onClick={() => navigate('/student/batches')}
                  >
                    View All Batches
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Student;