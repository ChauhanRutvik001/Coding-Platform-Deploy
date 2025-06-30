import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { 
  Users, 
  Book, 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3, 
  PieChart, 
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity
} from 'lucide-react';

const FacultyBatchProgress = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, problems, students
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // Utility functions for text truncation
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const truncateName = (name, maxLength = 15) => {
    if (!name) return '';
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  const truncateTitle = (title, maxLength = 30) => {
    if (!title) return '';
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  useEffect(() => {
    const fetchBatchProgress = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/faculty/batches/${batchId}/progress?page=${currentPage}&limit=10`);
        // console.log('Batch Progress Response:', response.data);
        if (response.data.success) {
          setBatch(response.data.batch);
          setProgressStats(response.data.progressStats);
          setProblems(response.data.problems);
          setPagination(response.data.progressStats.pagination);
        }
      } catch (error) {
        console.error('Error fetching batch progress:', error);
        toast.error('Failed to load batch progress');
        navigate('/faculty/batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchProgress();
  }, [batchId, navigate, currentPage]);

  // Function to fetch problems for a specific page
  const fetchProblemsPage = async (page) => {
    setProblemsLoading(true);
    try {
      const response = await axiosInstance.get(`/faculty/batches/${batchId}/progress?page=${page}&limit=10`);
      if (response.data.success) {
        setProblems(response.data.problems);
        setPagination(response.data.progressStats.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching problems page:', error);
      toast.error('Failed to load problems');
    } finally {
      setProblemsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-800 text-green-200 border-green-600';
      case 'medium':
        return 'bg-yellow-800 text-yellow-200 border-yellow-600';
      case 'hard':
        return 'bg-red-800 text-red-200 border-red-600';
      default:
        return 'bg-gray-800 text-gray-200 border-gray-600';
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 bg-gray-900">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!batch || !progressStats) {
    return (
      <div className="min-h-screen bg-gray-900 text-white w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 bg-gray-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400">Batch not found</h2>
            <p className="text-gray-400 mt-2">You don't have access to this batch or it doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white w-full overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-gray-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 mt-12 sm:mt-16 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            <button
              onClick={() => navigate(`/faculty/batches/${batchId}`)}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <span className="text-sm sm:text-base">Batch Details</span>
            </button>
          </div>
        </div>

        {/* Batch Info Header - Responsive */}
        <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-600">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">{batch.name}</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:space-x-6 gap-3 lg:gap-0 text-blue-200">
                <div className="flex items-center space-x-2">
                  <Book size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-sm sm:text-base truncate">{truncateText(batch.subject, 20)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-sm sm:text-base">{progressStats.totalStudents} Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-sm sm:text-base">{progressStats.totalProblems} Problems</span>
                </div>
              </div>
            </div>
            <div className="text-left lg:text-right border-t lg:border-t-0 pt-3 lg:pt-0">
              <div className="text-xs sm:text-sm text-blue-200">Branch: {batch.branch}</div>
              <div className="text-xs sm:text-sm text-blue-200">Semester: {batch.semester}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Responsive */}
        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'problems', label: 'Problems Progress', icon: Book },
            { id: 'students', label: 'Students Progress', icon: Users }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-colors flex-1 justify-center text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === 'overview' ? 'Overview' : tab.id === 'problems' ? 'Problems' : 'Students'}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Overall Progress Cards - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-4 sm:p-6 rounded-lg border border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-xs sm:text-sm">Active Students</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      {progressStats.overallProgress.studentsActive}/{progressStats.totalStudents}
                    </p>
                  </div>
                  <Activity className="text-blue-300" size={20} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-700 to-green-800 p-4 sm:p-6 rounded-lg border border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-xs sm:text-sm">Avg Completion Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{progressStats.overallProgress.averageCompletionRate}%</p>
                  </div>
                  <CheckCircle className="text-green-300" size={20} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-4 sm:p-6 rounded-lg border border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-200 text-xs sm:text-sm">Avg Score %</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{progressStats.overallProgress.averageScorePercentage}%</p>
                  </div>
                  <Award className="text-yellow-300" size={20} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 sm:p-6 rounded-lg border border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-xs sm:text-sm">Total Submissions</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{progressStats.overallProgress.totalSubmissions}</p>
                  </div>
                  <BarChart3 className="text-purple-300" size={20} />
                </div>
              </div>
            </div>

            {/* Quick Summary - Responsive */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-4">📊 Batch Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">{progressStats.overallProgress.studentsActive}</div>
                  <div className="text-gray-300 text-xs sm:text-sm">Students actively solving problems</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{progressStats.overallProgress.averageAttemptsPerStudent}</div>
                  <div className="text-gray-300 text-xs sm:text-sm">Average attempts per student</div>
                </div>
                <div className="text-center p-4 bg-gray-700 rounded sm:col-span-2 lg:col-span-1">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-400">{progressStats.totalProblems}</div>
                  <div className="text-gray-300 text-xs sm:text-sm">Total problems assigned</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Problems Progress Tab */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            {/* Problems Progress Overview - Responsive with Pagination */}
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-600">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-400 flex items-center">
                    <Book className="mr-2" size={18} />
                    Problems Progress Overview
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Detailed analysis of how students are performing on each problem
                  </p>
                </div>
                <div className="text-left lg:text-right text-xs sm:text-sm text-gray-400">
                  <div>{progressStats.totalProblems} Problems Total</div>
                  <div>{progressStats.totalStudents} Students Enrolled</div>
                  {pagination && (
                    <div className="text-blue-400 mt-1">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mobile Card View for Problems */}
              <div className="block lg:hidden space-y-4">
                {problemsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                  </div>
                ) : (
                  problems.map((problem, index) => {
                    const stats = progressStats.problemStats[problem._id];
                    const attemptRateNum = parseFloat(stats.attemptRate);
                    const completionRateNum = parseFloat(stats.completionRate);
                    const avgMarksNum = parseFloat(stats.averageMarksPercentage);
                    
                    return (
                      <div key={problem._id} className="bg-gray-750 border border-gray-600 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{problem.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty || 'Medium'}
                              </span>
                              <span className="text-gray-400 text-xs">Max: {problem.totalMarks} marks</span>
                            </div>
                            {problem.dueDate && (
                              <div className="text-gray-400 text-xs mt-1">Due: {formatDate(problem.dueDate)}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Attempt Rate</div>
                            <div className="text-blue-400 font-medium">{stats.attemptRate}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Success Rate</div>
                            <div className={`font-medium ${getPerformanceColor(completionRateNum)}`}>
                              {stats.completionRate}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Avg Performance</div>
                            <div className={`font-medium ${getPerformanceColor(avgMarksNum)}`}>
                              {stats.averageMarksPercentage}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Students</div>
                            <div className="text-white">
                              <span className="text-green-400">{stats.studentsCompleted}</span>/
                              <span className="text-blue-400">{stats.studentsAttempted}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                          <Link
                            to={`/faculty/problems/${problem._id}/submissions`}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          >
                            View Submissions →
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View for Problems */}
              <div className="hidden lg:block overflow-x-auto">
                {problemsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-600 bg-gray-750">
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Problem Details</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Max Marks</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Attempt Rate</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Success Rate</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Avg Performance</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Student Distribution</th>
                        <th className="text-left py-4 px-4 text-gray-200 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.map((problem, index) => {
                        const stats = progressStats.problemStats[problem._id];
                        const attemptRateNum = parseFloat(stats.attemptRate);
                        const completionRateNum = parseFloat(stats.completionRate);
                        const avgMarksNum = parseFloat(stats.averageMarksPercentage);
                        
                        return (
                          <tr key={problem._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-white mb-1" title={problem.title}>
                                  {truncateTitle(problem.title, 35)}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                                    {problem.difficulty || 'Medium'}
                                  </span>
                                  {problem.dueDate && (
                                    <span className="text-gray-400 text-xs">Due: {formatDate(problem.dueDate)}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-yellow-400 font-bold">{problem.totalMarks}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                  <div 
                                    className="h-2 bg-blue-500 rounded-full"
                                    style={{ width: `${Math.min(attemptRateNum, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-blue-400 font-medium min-w-[40px]">{stats.attemptRate}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      completionRateNum >= 80 ? 'bg-green-500' :
                                      completionRateNum >= 60 ? 'bg-yellow-500' :
                                      completionRateNum >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(completionRateNum, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`font-medium min-w-[40px] ${getPerformanceColor(completionRateNum)}`}>
                                  {stats.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      avgMarksNum >= 80 ? 'bg-green-500' :
                                      avgMarksNum >= 60 ? 'bg-yellow-500' :
                                      avgMarksNum >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(avgMarksNum, 100)}%` }}
                                  ></div>
                                </div>
                                <span className={`font-medium min-w-[40px] ${getPerformanceColor(avgMarksNum)}`}>
                                  {stats.averageMarksPercentage}%
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-center">
                                <div className="text-green-400 font-bold">{stats.studentsCompleted}</div>
                                <div className="text-xs text-gray-400">completed</div>
                                <div className="text-blue-400 font-medium">{stats.studentsAttempted}</div>
                                <div className="text-xs text-gray-400">attempted</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col space-y-2">
                                <Link
                                  to={`/faculty/problems/${problem._id}/submissions`}
                                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                >
                                  View Submissions
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-400">
                    Showing page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalProblems} total problems)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchProblemsPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage || problemsLoading}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          pagination.currentPage - 2 + i,
                          pagination.totalPages - 4 + i
                        ));
                        
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchProblemsPage(pageNum)}
                            disabled={problemsLoading}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm disabled:cursor-not-allowed ${
                              pageNum === pagination.currentPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => fetchProblemsPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || problemsLoading}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Progress Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg sm:text-xl font-semibold text-blue-400 mb-4 flex items-center">
                <Users className="mr-2" size={18} />
                Students Progress
              </h3>
              
              {/* Mobile Card View for Students */}
              <div className="block lg:hidden space-y-4">
                {Object.values(progressStats.studentStats)
                  .sort((a, b) => {
                    const scoreA = parseFloat(a.scorePercentage);
                    const scoreB = parseFloat(b.scorePercentage);
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    return a.submissionTimingSum - b.submissionTimingSum;
                  })
                  .map((student, index) => (
                    <div key={student._id} className="bg-gray-750 border border-gray-600 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {index < 3 && (
                            <span className={`mr-2 ${
                              index === 0 ? 'text-yellow-400' : 
                              index === 1 ? 'text-gray-300' : 'text-orange-400'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          )}
                          <div>
                            <span className="font-medium text-white">{truncateName(student.username)}</span>
                            <div className="text-xs text-gray-400">ID: {student.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${getPerformanceColor(parseFloat(student.scorePercentage))}`}>
                            {student.scorePercentage}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Problems Attempted</div>
                          <div className="text-blue-400">{student.problemsAttempted}/{progressStats.totalProblems}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Completed</div>
                          <div className="text-green-400">{student.problemsCompleted}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Total Marks</div>
                          <div className="text-yellow-400 font-bold">{student.totalMarksEarned}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Completion Rate</div>
                          <div className={getPerformanceColor(parseFloat(student.completionRate))}>{student.completionRate}%</div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-600">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Progress</span>
                          <span className={getPerformanceColor(parseFloat(student.progressPercentage))}>{student.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              parseFloat(student.progressPercentage) >= 80 ? 'bg-green-500' :
                              parseFloat(student.progressPercentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* Desktop Table View for Students */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Student</th>
                      <th className="text-left py-3 px-4 text-gray-300">Student ID</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Attempted</th>
                      <th className="text-left py-3 px-4 text-gray-300">Problems Completed</th>
                      <th className="text-left py-3 px-4 text-gray-300">Completion Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Total Marks</th>
                      <th className="text-left py-3 px-4 text-gray-300">Score %</th>
                      <th className="text-left py-3 px-4 text-gray-300">Overall Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(progressStats.studentStats)
                      .sort((a, b) => {
                        const scoreA = parseFloat(a.scorePercentage);
                        const scoreB = parseFloat(b.scorePercentage);
                        if (scoreB !== scoreA) return scoreB - scoreA;
                        return a.submissionTimingSum - b.submissionTimingSum;
                      })
                      .map((student, index) => (
                      <tr key={student._id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {index < 3 && (
                              <span className={`mr-2 ${
                                index === 0 ? 'text-yellow-400' : 
                                index === 1 ? 'text-gray-300' : 'text-orange-400'
                              }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                            <span className="font-medium">{student.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-300">{student.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-400">{student.problemsAttempted}/{progressStats.totalProblems}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-green-400">{student.problemsCompleted}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.completionRate))}>{student.completionRate}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-yellow-400 font-bold">{student.totalMarksEarned}</span>
                          <span className="text-gray-400 text-sm">/{student.totalPossibleMarks}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={getPerformanceColor(parseFloat(student.scorePercentage))}>{student.scorePercentage}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-600 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  parseFloat(student.progressPercentage) >= 80 ? 'bg-green-500' :
                                  parseFloat(student.progressPercentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${student.progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className={getPerformanceColor(parseFloat(student.progressPercentage))}>{student.progressPercentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyBatchProgress;
