import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  AlertCircle,
  Award,
  Calendar,
  Code,
  Activity
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const { problemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();  const [submissions, setSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]); // For analytics - all submissions
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [TotalSubmission, setTotalSubmission] = useState(0);
  const [totalAllSubmissions, setTotalAllSubmissions] = useState(0); // Count of all submissions for analytics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Extract batch context from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const batchId = searchParams.get('batchId');
  const [batchInfo, setBatchInfo] = useState(null);
  const [progressStats, setProgressStats] = useState({
    totalStudents: 0,
    studentsSubmitted: 0,
    completionRate: 0,
    averageScore: 0,
    passRate: 0
  });
  // Batch selection states
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
  const [batchLoadingState, setBatchLoadingState] = useState(false);

  // Enhanced analytics states
  const [analyticsData, setAnalyticsData] = useState({
    testCaseAnalysis: [],
    submissionTrends: [],
    performanceMetrics: {},
    languageDistribution: {},
    timeDistribution: []
  });  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' or 'classmates'

  const [filters, setFilters] = useState({
    branch: "ALL",
    semester: "ALL",
    language: "ALL",
    status: "ALL",
    batch: batchId ? "ALL" : "ALL", // Will be set to specific batch if coming from batch context
  });
  const { problemTitle, difficulty, createdAt } = location.state || {};

  // Fetch available batches for batch selection dropdown
  const fetchAvailableBatches = async () => {
    try {
      setBatchLoadingState(true);
      const response = await axiosInstance.get('/faculty/batches', {
        params: { limit: 100 } // Get all batches
      });
      if (response.data.success) {
        setAvailableBatches(response.data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching available batches:', error);
      // Try alternate endpoint for admin users
      try {
        const adminResponse = await axiosInstance.get('/admin/batch/batches', {
          params: { limit: 100 }
        });
        if (adminResponse.data.success) {
          setAvailableBatches(adminResponse.data.batches || []);
        }
      } catch (adminError) {
        console.error('Error fetching batches from admin endpoint:', adminError);
      }
    } finally {
      setBatchLoadingState(false);
    }
  };

  // Fetch batch information if batchId is provided
  const fetchBatchInfo = async (targetBatchId = batchId) => {
    if (!targetBatchId) return;
    
    try {
      let response;
      try {
        response = await axiosInstance.get(`/faculty/batches/${targetBatchId}`);
      } catch (error) {
        // Try admin endpoint if faculty endpoint fails
        response = await axiosInstance.get(`/admin/batch/batches/${targetBatchId}`);
      }
      
      if (response.data.success) {
        setBatchInfo(response.data.batch);
        return response.data.batch;
      }
    } catch (error) {
      console.error('Error fetching batch info:', error);
    }
    return null;
  };

  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    if (!allSubmissions.length) return;

    // Test Case Analysis
    const testCaseStats = {};
    allSubmissions.forEach(sub => {
      if (sub.numberOfTestCase && sub.numberOfTestCasePass !== null) {
        const totalTests = sub.numberOfTestCase;
        const passedTests = sub.numberOfTestCasePass;
        
        for (let i = 1; i <= totalTests; i++) {
          if (!testCaseStats[i]) {
            testCaseStats[i] = { passed: 0, total: 0 };
          }
          testCaseStats[i].total++;
          if (i <= passedTests) {
            testCaseStats[i].passed++;
          }
        }
      }
    });

    const testCaseAnalysis = Object.entries(testCaseStats).map(([testCase, stats]) => ({
      testCase: `Test ${testCase}`,
      passRate: ((stats.passed / stats.total) * 100).toFixed(1),
      passed: stats.passed,
      total: stats.total,
      difficulty: stats.passed / stats.total >= 0.8 ? 'Easy' : 
                  stats.passed / stats.total >= 0.5 ? 'Medium' : 'Hard'
    }));

    // Submission Trends (by hour)
    const hourlySubmissions = {};
    allSubmissions.forEach(sub => {
      const hour = new Date(sub.createdAt).getHours();
      hourlySubmissions[hour] = (hourlySubmissions[hour] || 0) + 1;
    });

    const submissionTrends = Array.from({length: 24}, (_, i) => ({
      hour: `${i}:00`,
      submissions: hourlySubmissions[i] || 0
    }));

    // Language Distribution
    const languageDistribution = {};
    allSubmissions.forEach(sub => {
      const lang = sub.language || 'Unknown';
      languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    });    // Performance Metrics with detailed scoring breakdown
    const fullScoreSubmissions = allSubmissions.filter(s => s.numberOfTestCasePass === s.numberOfTestCase && s.numberOfTestCase > 0);
    const partialScoreSubmissions = allSubmissions.filter(s => s.numberOfTestCasePass > 0 && s.numberOfTestCasePass < s.numberOfTestCase);
    const zeroScoreSubmissions = allSubmissions.filter(s => s.numberOfTestCasePass === 0);
    
    // Get unique students and their best performance
    const uniqueStudents = [...new Set(allSubmissions.map(s => s.user_id._id))];
    
    // Calculate best performance per student (using highest marks submissions - like the table data)
    const bestPerformancePerStudent = {};
    submissions.forEach(sub => { // Use submissions (highest marks) for student classification
      const studentId = sub.user_id._id;
      const scorePercentage = sub.numberOfTestCase > 0 ? 
        (sub.numberOfTestCasePass / sub.numberOfTestCase) * 100 : 0;
      
      bestPerformancePerStudent[studentId] = {
        scorePercentage,
        isFullScore: scorePercentage === 100,
        isPartialScore: scorePercentage > 0 && scorePercentage < 100,
        isZeroScore: scorePercentage === 0
      };
    });
    
    // Count students by their BEST performance (final highest marks)
    const studentsWithBestFullScore = Object.values(bestPerformancePerStudent).filter(p => p.isFullScore).length;
    const studentsWithBestPartialScore = Object.values(bestPerformancePerStudent).filter(p => p.isPartialScore).length;
    const studentsWithBestZeroScore = Object.values(bestPerformancePerStudent).filter(p => p.isZeroScore).length;
      const performanceMetrics = {
      // Overall metrics
      averageAttempts: allSubmissions.length / Math.max(uniqueStudents.length, 1),
      totalUniqueStudents: uniqueStudents.length,
      
      // ALL SUBMISSIONS metrics (for analytics - considers all attempts)
      allSubmissionsSuccessRate: (fullScoreSubmissions.length / allSubmissions.length * 100).toFixed(1),
      allSubmissionsPartialRate: (partialScoreSubmissions.length / allSubmissions.length * 100).toFixed(1),
      allSubmissionsFailureRate: (zeroScoreSubmissions.length / allSubmissions.length * 100).toFixed(1),
      
      // BEST PERFORMANCE per student metrics (final scores - highest marks only)
      studentsWithFullScore: studentsWithBestFullScore,
      studentsWithPartialScore: studentsWithBestPartialScore,
      studentsWithZeroScore: studentsWithBestZeroScore,
      
      // Percentage of students by their BEST performance
      studentFullScoreRate: (studentsWithBestFullScore / Math.max(uniqueStudents.length, 1) * 100).toFixed(1),
      studentPartialScoreRate: (studentsWithBestPartialScore / Math.max(uniqueStudents.length, 1) * 100).toFixed(1),
      studentZeroScoreRate: (studentsWithBestZeroScore / Math.max(uniqueStudents.length, 1) * 100).toFixed(1),
      
      // Detailed submission counts (all submissions)
      totalSubmissions: allSubmissions.length,
      fullScoreSubmissions: fullScoreSubmissions.length,
      partialScoreSubmissions: partialScoreSubmissions.length,
      zeroScoreSubmissions: zeroScoreSubmissions.length,
      
      // Average scores
      averageTestCasePassRate: allSubmissions.length > 0 ? 
        (allSubmissions.reduce((sum, s) => sum + (s.numberOfTestCasePass / Math.max(s.numberOfTestCase, 1) * 100), 0) / allSubmissions.length).toFixed(1) : 0
    };

    setAnalyticsData({
      testCaseAnalysis: testCaseAnalysis.sort((a, b) => parseInt(a.testCase.split(' ')[1]) - parseInt(b.testCase.split(' ')[1])),
      submissionTrends,
      performanceMetrics,
      languageDistribution,
      timeDistribution: submissionTrends
    });
  };

  // Calculate progress statistics for batch-specific view
  const calculateProgressStats = () => {
    if (!batchInfo || !submissions.length) return;

    const batchStudents = batchInfo.students || [];
    const totalStudents = batchStudents.length;
    
    // Get unique students who submitted for this problem
    const studentsSubmitted = [...new Set(submissions.map(sub => sub.user_id._id))].length;
    
    // Calculate completion rate
    const completionRate = totalStudents > 0 ? (studentsSubmitted / totalStudents) * 100 : 0;
    
    // Calculate average score (based on test cases passed)
    const submissionsWithScores = submissions.filter(sub => 
      sub.numberOfTestCase && sub.numberOfTestCasePass !== null
    );
    
    let averageScore = 0;
    if (submissionsWithScores.length > 0) {
      const totalScore = submissionsWithScores.reduce((sum, sub) => 
        sum + (sub.numberOfTestCasePass / sub.numberOfTestCase) * 100, 0
      );
      averageScore = totalScore / submissionsWithScores.length;
    }
    
    // Calculate pass rate (students with > 50% test cases passed)
    const passingSubmissions = submissionsWithScores.filter(sub => 
      (sub.numberOfTestCasePass / sub.numberOfTestCase) >= 0.5
    );
    const passRate = submissionsWithScores.length > 0 ? 
      (passingSubmissions.length / submissionsWithScores.length) * 100 : 0;

    setProgressStats({
      totalStudents,
      studentsSubmitted,
      completionRate: Math.round(completionRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100
    });
  };
  useEffect(() => {
    // Fetch available batches when component mounts (only if not coming from batch context)
    if (!batchId) {
      fetchAvailableBatches();
    }
    
    if (batchId) {
      fetchBatchInfo();
    }
  }, [batchId]);
  useEffect(() => {
    calculateProgressStats();
    calculateAnalytics();
  }, [batchInfo, submissions]);

  // Handle manual batch selection
  const handleBatchSelection = async (newBatchId) => {
    if (newBatchId === selectedBatchId) return; // No change
    
    setSelectedBatchId(newBatchId);
    
    if (newBatchId && newBatchId !== '') {
      // Fetch batch info for the selected batch
      const batchData = await fetchBatchInfo(newBatchId);
      if (batchData) {
        setBatchInfo(batchData);
        // Update URL to reflect batch selection (optional, for bookmarking)
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('batchId', newBatchId);
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      // Clear batch selection
      setBatchInfo(null);
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('batchId');
      window.history.replaceState({}, '', newUrl);
    }
  };  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        // Fetch highest marks submissions for table display
        const submissionsResponse = await axiosInstance.get("/submissions/problem", {
          params: { problem_id: problemId },
        });
        
        // Fetch ALL submissions for analytics
        const allSubmissionsResponse = await axiosInstance.get("/submissions/problem/analytics", {
          params: { problem_id: problemId },
        });
        
        let submissionsData = submissionsResponse.data.submissions;
        let allSubmissionsData = allSubmissionsResponse.data.submissions;
        
        // If coming from batch context or manual batch selection, filter submissions by batch students
        const activeBatchId = batchId || selectedBatchId;
        if (activeBatchId && batchInfo) {
          const batchStudentIds = batchInfo.students.map(student => student._id);
          submissionsData = submissionsData.filter(sub => 
            batchStudentIds.includes(sub.user_id._id)
          );
          allSubmissionsData = allSubmissionsData.filter(sub => 
            batchStudentIds.includes(sub.user_id._id)
          );
        }
          setSubmissions(submissionsData);
        setAllSubmissions(allSubmissionsData);
        setTotalSubmission(submissionsData.length);
        setTotalAllSubmissions(allSubmissionsData.length);
        setFilteredSubmissions(submissionsData);
        // console.log('Highest marks submissions:', submissionsData);
        // console.log('All submissions for analytics:', allSubmissionsData);
      } catch (err) {
        setError(
          err.response ? err.response.data.message : "Error fetching data"
        );
      } finally {
        setLoading(false);
      }
    };

    // Only fetch submissions after batch info is loaded (if needed)
    const activeBatchId = batchId || selectedBatchId;
    if (!activeBatchId || batchInfo) {
      fetchSubmissions();
    }
  }, [problemId, batchId, selectedBatchId, batchInfo]);
  useEffect(() => {
    applyFilters();
  }, [filters]);

  // Recalculate analytics when allSubmissions data changes
  useEffect(() => {
    if (allSubmissions.length > 0) {
      calculateAnalytics();
    }
  }, [allSubmissions]);

  const handleSort = (field) => {
    const order = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);

    const sortedData = [...filteredSubmissions].sort((a, b) => {
      const valA =
        field === "branch" || field === "batch"
          ? a.user_id[field]?.toUpperCase()
          : a.user_id[field];
      const valB =
        field === "branch" || field === "batch"
          ? b.user_id[field]?.toUpperCase()
          : b.user_id[field];

      if (order === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    setFilteredSubmissions(sortedData);
  };

  const applyFilters = () => {
    let filtered = submissions;

    if (filters.branch !== "ALL") {
      filtered = filtered.filter(
        (submission) =>
          submission.user_id.branch?.toUpperCase() === filters.branch
      );
    }

    if (filters.semester !== "ALL") {
      filtered = filtered.filter((submission) => {
        const semester = submission.user_id.semester; // Extract semester
        return semester && String(semester) === String(filters.semester);
      });
    }

    if (filters.language !== "ALL") {
      filtered = filtered.filter(
        (submission) => submission.language?.toUpperCase() === filters.language
      );
    }

    if (filters.status !== "ALL") {
      filtered = filtered.filter(
        (submission) => submission.status?.toUpperCase() === filters.status
      );
    }
    if (filters.batch !== "ALL") {
      // console.log(filters.batch);
      filtered = filtered.filter((submission) => {
        return submission.user_id.batch?.toUpperCase() === filters.batch;
      });
    }

    setFilteredSubmissions(filtered);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };  const downloadExcel = () => {
    const totalSubmissions = filteredSubmissions.length;
    const activeBatchId = batchId || selectedBatchId;

    // Create title with batch context
    const title = activeBatchId && batchInfo 
      ? `Batch ${batchInfo.name} - Total Submissions: ${totalSubmissions}`
      : `Total Submissions: ${totalSubmissions}`;

    // Add progress stats for batch context
    const headerRows = [
      { ID: title },
    ];

    if (activeBatchId && batchInfo) {
      headerRows.push(
        { ID: `Completion Rate: ${progressStats.completionRate}%` },
        { ID: `Average Score: ${progressStats.averageScore}%` },
        { ID: `Pass Rate: ${progressStats.passRate}%` },
        { ID: `Students Submitted: ${progressStats.studentsSubmitted}/${progressStats.totalStudents}` }
      );
    }

    const dataToExport = filteredSubmissions.map((submission) => ({
      ID: submission.user_id.id,
      Username: submission.user_id.username,
      Branch: submission.user_id.branch?.toUpperCase() || "N/A",
      Batch: submission.user_id.batch?.toUpperCase() || "N/A",
      Semester: submission.user_id.semester || "N/A",
      "Test Cases Passed": `${submission.numberOfTestCasePass || 0}/${
        submission.numberOfTestCase || 0
      }`,
      "Submission Date": formatDate(submission.createdAt),
      Marks: submission.totalMarks ?? "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);    XLSX.utils.sheet_add_aoa(worksheet, [
      [title],
      ...(activeBatchId && batchInfo ? [
        [`Completion Rate: ${progressStats.completionRate}%`],
        [`Average Score: ${progressStats.averageScore}%`],
        [`Pass Rate: ${progressStats.passRate}%`],
        [`Students Submitted: ${progressStats.studentsSubmitted}/${progressStats.totalStudents}`]
      ] : [])
    ]);
    XLSX.utils.sheet_add_json(worksheet, dataToExport, { 
      origin: activeBatchId && batchInfo ? "A7" : "A3" 
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    const filename = activeBatchId && batchInfo 
      ? `Batch_${batchInfo.name}_Submissions.xlsx`
      : "Submissions.xlsx";
    XLSX.writeFile(workbook, filename);
  };
  const downloadPDF = () => {
    const totalSubmissions = filteredSubmissions.length;
    const activeBatchId = batchId || selectedBatchId;

    const doc = new jsPDF();
    const tableColumnHeaders = [
      "ID",
      "Username",
      "Branch",
      "Batch",
      "Semester",
      "Test Cases Passed",
      "Submission Date",
      "Marks",
    ];
    const tableRows = filteredSubmissions.map((submission) => [
      submission.user_id.id,
      submission.user_id.username,
      submission.user_id.branch?.toUpperCase() || "N/A",
      submission.user_id.batch?.toUpperCase() || "N/A",
      submission.user_id.semester || "N/A",
      `${submission.numberOfTestCasePass || 0}/${
        submission.numberOfTestCase || 0
      }`,
      formatDate(submission.createdAt),
      submission.totalMarks ?? "N/A",
    ]);

    // Add title and progress information
    const title = activeBatchId && batchInfo 
      ? `Batch ${batchInfo.name} - Submissions Report`      : "Submissions Report";
      
    let yPosition = 15;
    doc.text(title, 14, yPosition);
    yPosition += 10;

    if (activeBatchId && batchInfo) {
      doc.text(`Batch: ${batchInfo.name} | Branch: ${batchInfo.branch} | Semester: ${batchInfo.semester}`, 14, yPosition);
      yPosition += 10;
      doc.text(`Completion Rate: ${progressStats.completionRate}% | Average Score: ${progressStats.averageScore}%`, 14, yPosition);
      yPosition += 10;
      doc.text(`Students Submitted: ${progressStats.studentsSubmitted}/${progressStats.totalStudents} | Pass Rate: ${progressStats.passRate}%`, 14, yPosition);
      yPosition += 10;
    }

    doc.text(`Total Submissions: ${totalSubmissions}`, 14, yPosition);
    yPosition += 10;

    // Generate the table
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: yPosition,
    });

    const filename = activeBatchId && batchInfo 
      ? `Batch_${batchInfo.name}_Submissions.pdf`
      : "Submissions.pdf";
    doc.save(filename);
  };

  return (
    <>
      <div className="relative min-h-screen bg-gray-900 text-white">
        <div className="mx-auto px-5 pt-20 pb-5">          {problemTitle && (
            <div className="mb-6 bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-4">
                {problemTitle}
                {batchInfo && (
                  <span className="ml-4 text-lg text-gray-300">
                    - Batch: {batchInfo.name}
                  </span>
                )}
              </h3>
              <div className="flex flex-col sm:flex-row sm:justify-between text-base sm:text-lg">
                <p className="font-semibold text-gray-300 mb-2 sm:mb-0">
                  Difficulty:{" "}
                  <span className="text-blue-300">{difficulty}</span>
                </p>
                <p className="font-semibold text-gray-300">
                  Created on:{" "}
                  <span className="text-gray-400">{formatDate(createdAt)}</span>
                </p>
              </div>
            </div>
          )}          {/* Batch Progress Dashboard */}
          {((batchId && batchInfo) || (selectedBatchId && batchInfo)) && (
            <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg shadow-lg border border-gray-600">
              <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                📊 Batch Progress Report - {batchInfo.name}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {progressStats.studentsSubmitted}/{progressStats.totalStudents}
                    </div>
                    <div className="text-sm text-gray-300">Students Submitted</div>
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {progressStats.completionRate}%
                    </div>
                    <div className="text-sm text-gray-300">Completion Rate</div>
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {progressStats.averageScore}%
                    </div>
                    <div className="text-sm text-gray-300">Average Score</div>
                  </div>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {progressStats.passRate}%
                    </div>
                    <div className="text-sm text-gray-300">Pass Rate (≥50%)</div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Overall Progress</span>
                  <span>{progressStats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.completionRate}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-900 rounded">
                  <div className="text-gray-300">Branch: <span className="text-blue-300">{batchInfo.branch}</span></div>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded">
                  <div className="text-gray-300">Semester: <span className="text-blue-300">{batchInfo.semester}</span></div>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded">
                  <div className="text-gray-300">Total Students: <span className="text-blue-300">{progressStats.totalStudents}</span></div>
                </div>
              </div>
            </div>          )}          {/* Batch Selection Section - Only show when not coming from batch context */}
          {!batchId && (
            <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-lg shadow-lg border border-gray-600">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                <Users className="mr-2" size={20} />
                Batch Selection
              </h4>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => handleBatchSelection(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                    disabled={batchLoadingState}
                  >
                    <option value="">🔍 Select a Batch to View Specific Progress</option>
                    <option value="">📊 View All Submissions (No Batch Filter)</option>
                    {availableBatches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        📚 {batch.name} - {batch.subject || 'No Subject'} ({batch.students?.length || 0} students)
                      </option>
                    ))}
                  </select>
                  {batchLoadingState && (
                    <div className="text-sm text-blue-300 mt-2">Loading available batches...</div>
                  )}
                </div>
                {selectedBatchId && batchInfo && (
                  <div className="text-sm text-blue-200 bg-gray-900 px-3 py-2 rounded">
                    📋 Selected: {batchInfo.name} ({batchInfo.students?.length || 0} students)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Toggle */}
          <div className="mb-6 flex justify-between items-center">            <div className="font-medium text-xl text-gray-300">
              {(batchId && batchInfo) || (selectedBatchId && batchInfo) ? (
                <>
                  📊 Batch {batchInfo.name} - Unique Submissions: {TotalSubmission ? TotalSubmission : "0"}
                  <span className="text-sm text-gray-400 ml-2">
                    ({progressStats.studentsSubmitted} of {progressStats.totalStudents} students submitted)
                  </span>
                  <div className="text-sm text-blue-300 mt-1">
                    📈 Total Attempts for Analytics: {totalAllSubmissions ? totalAllSubmissions : "0"}
                  </div>
                </>
              ) : (
                <>
                  📈 Unique Student Submissions: {TotalSubmission ? TotalSubmission : "0"}
                  <div className="text-sm text-blue-300 mt-1">
                    📊 Total Attempts for Analytics: {totalAllSubmissions ? totalAllSubmissions : "0"}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
            >
              <Activity className="mr-2" size={16} />
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
          </div>          {/* Enhanced Analytics Section */}
          {showAnalytics && (
            <div className="mb-8 space-y-6">
              {/* Analytics Explanation */}
              <div className="bg-gradient-to-r from-blue-800 to-purple-800 p-4 rounded-lg shadow-lg border border-blue-600">
                <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                  <Activity className="mr-2" size={18} />
                  Analytics Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <h6 className="text-blue-300 font-semibold mb-2">📊 All Submissions Analysis</h6>
                    <p className="text-gray-300">Analyzes ALL {totalAllSubmissions || 0} submission attempts from all students. Shows overall submission patterns, test case analysis, and attempt distributions.</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded border border-gray-600">
                    <h6 className="text-green-300 font-semibold mb-2">🏆 Final Student Performance</h6>
                    <p className="text-gray-300">Shows each student's BEST score only (highest marks). From {analyticsData.performanceMetrics.totalUniqueStudents || 0} students: categorizes by their final achievement level.</p>
                  </div>
                </div>
              </div>

              {/* Performance Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="bg-gradient-to-br from-green-700 to-green-800 p-4 rounded-lg shadow-lg border border-green-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">All Submissions Success Rate</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.allSubmissionsSuccessRate || 0}%</p>
                    </div>
                    <CheckCircle className="text-green-300" size={24} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-4 rounded-lg shadow-lg border border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">All Submissions Partial Rate</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.allSubmissionsPartialRate || 0}%</p>
                    </div>
                    <AlertCircle className="text-yellow-300" size={24} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-lg shadow-lg border border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">All Submissions Failure Rate</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.allSubmissionsFailureRate || 0}%</p>
                    </div>
                    <XCircle className="text-red-300" size={24} />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-lg shadow-lg border border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Avg Attempts</p>
                      <p className="text-2xl font-bold text-white">{analyticsData.performanceMetrics.averageAttempts?.toFixed(1) || 0}</p>
                    </div>
                    <Target className="text-blue-300" size={24} />
                  </div>
                </div>              </div>              {/* Student Performance Breakdown */}
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600 mb-6">
                <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                  <Users className="mr-2" size={18} />
                  Final Student Performance (Best Score per Student - Total: {analyticsData.performanceMetrics.totalUniqueStudents || 0} Students)
                </h5>
                <div className="mb-3 text-sm text-gray-300">
                  📊 Based on highest marks achieved by each student (shows only best attempt per student)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Full Score Students */}
                  <div className="bg-gradient-to-br from-green-700 to-green-800 p-4 rounded-lg border border-green-600">
                    <div className="text-center">
                      <CheckCircle className="mx-auto text-green-300 mb-2" size={32} />
                      <p className="text-green-100 text-sm">Students with 100% Score</p>
                      <p className="text-3xl font-bold text-white">{analyticsData.performanceMetrics.studentsWithFullScore || 0}</p>
                      <p className="text-green-200 text-xs">({analyticsData.performanceMetrics.studentFullScoreRate || 0}% of students)</p>
                      <p className="text-green-300 text-xs mt-1">{analyticsData.performanceMetrics.fullScoreSubmissions || 0} submissions</p>
                    </div>
                  </div>
                  
                  {/* Partial Score Students */}
                  <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-4 rounded-lg border border-yellow-500">
                    <div className="text-center">
                      <AlertCircle className="mx-auto text-yellow-300 mb-2" size={32} />
                      <p className="text-yellow-100 text-sm">Students with Partial Score</p>
                      <p className="text-3xl font-bold text-white">{analyticsData.performanceMetrics.studentsWithPartialScore || 0}</p>
                      <p className="text-yellow-200 text-xs">({analyticsData.performanceMetrics.studentPartialScoreRate || 0}% of students)</p>
                      <p className="text-yellow-300 text-xs mt-1">{analyticsData.performanceMetrics.partialScoreSubmissions || 0} submissions</p>
                    </div>
                  </div>
                  
                  {/* Zero Score Students */}
                  <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-lg border border-red-500">
                    <div className="text-center">
                      <XCircle className="mx-auto text-red-300 mb-2" size={32} />
                      <p className="text-red-100 text-sm">Students with 0% Score</p>
                      <p className="text-3xl font-bold text-white">{analyticsData.performanceMetrics.studentsWithZeroScore || 0}</p>
                      <p className="text-red-200 text-xs">({analyticsData.performanceMetrics.studentZeroScoreRate || 0}% of students)</p>
                      <p className="text-red-300 text-xs mt-1">{analyticsData.performanceMetrics.zeroScoreSubmissions || 0} submissions</p>
                    </div>
                  </div>
                </div>
                
                {/* Overall Statistics */}
                <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h6 className="text-blue-300 font-semibold mb-2">Overall Statistics</h6>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-300">Total Submissions</p>
                      <p className="text-xl font-bold text-white">{analyticsData.performanceMetrics.totalSubmissions || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300">Unique Students</p>
                      <p className="text-xl font-bold text-white">{analyticsData.performanceMetrics.totalUniqueStudents || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300">Avg Test Case Pass Rate</p>
                      <p className="text-xl font-bold text-white">{analyticsData.performanceMetrics.averageTestCasePassRate || 0}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-300">Avg Attempts per Student</p>
                      <p className="text-xl font-bold text-white">{analyticsData.performanceMetrics.averageAttempts?.toFixed(1) || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Case Analysis Chart */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                  <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                    <Target className="mr-2" size={18} />
                    Test Case Success Analysis
                  </h5>
                  {analyticsData.testCaseAnalysis.length > 0 ? (
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: analyticsData.testCaseAnalysis.map(tc => tc.testCase),
                          datasets: [
                            {
                              label: 'Pass Rate (%)',
                              data: analyticsData.testCaseAnalysis.map(tc => parseFloat(tc.passRate)),
                              backgroundColor: analyticsData.testCaseAnalysis.map(tc => 
                                tc.difficulty === 'Easy' ? 'rgba(34, 197, 94, 0.7)' :
                                tc.difficulty === 'Medium' ? 'rgba(251, 191, 36, 0.7)' :
                                'rgba(239, 68, 68, 0.7)'
                              ),
                              borderColor: analyticsData.testCaseAnalysis.map(tc => 
                                tc.difficulty === 'Easy' ? 'rgba(34, 197, 94, 1)' :
                                tc.difficulty === 'Medium' ? 'rgba(251, 191, 36, 1)' :
                                'rgba(239, 68, 68, 1)'
                              ),
                              borderWidth: 2
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: { beginAtZero: true, max: 100 },
                            x: { ticks: { color: '#9CA3AF' } }
                          },
                          plugins: {
                            legend: { labels: { color: '#9CA3AF' } },
                            tooltip: {
                              callbacks: {
                                afterLabel: (context) => {
                                  const dataIndex = context.dataIndex;
                                  const tc = analyticsData.testCaseAnalysis[dataIndex];
                                  return `${tc.passed}/${tc.total} passed - ${tc.difficulty}`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      No test case data available
                    </div>
                  )}
                </div>

                {/* Language Distribution */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                  <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                    <Code className="mr-2" size={18} />
                    Programming Language Distribution
                  </h5>
                  {Object.keys(analyticsData.languageDistribution).length > 0 ? (
                    <div className="h-64">
                      <Doughnut
                        data={{
                          labels: Object.keys(analyticsData.languageDistribution),
                          datasets: [
                            {
                              data: Object.values(analyticsData.languageDistribution),
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.7)',
                                'rgba(34, 197, 94, 0.7)',
                                'rgba(251, 191, 36, 0.7)',
                                'rgba(239, 68, 68, 0.7)',
                                'rgba(168, 85, 247, 0.7)',
                                'rgba(236, 72, 153, 0.7)'
                              ],
                              borderColor: [
                                'rgba(59, 130, 246, 1)',
                                'rgba(34, 197, 94, 1)',
                                'rgba(251, 191, 36, 1)',
                                'rgba(239, 68, 68, 1)',
                                'rgba(168, 85, 247, 1)',
                                'rgba(236, 72, 153, 1)'
                              ],
                              borderWidth: 2
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'bottom',
                              labels: { color: '#9CA3AF' }
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      No language data available
                    </div>
                  )}                </div>

                {/* Performance Score Distribution */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                  <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                    <Award className="mr-2" size={18} />
                    Score Distribution (Submissions)
                  </h5>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: ['100% Score', 'Partial Score', '0% Score'],
                        datasets: [
                          {
                            data: [
                              analyticsData.performanceMetrics.fullScoreSubmissions || 0,
                              analyticsData.performanceMetrics.partialScoreSubmissions || 0,
                              analyticsData.performanceMetrics.zeroScoreSubmissions || 0
                            ],
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.8)',   // Green for full score
                              'rgba(251, 191, 36, 0.8)',  // Yellow for partial score
                              'rgba(239, 68, 68, 0.8)'    // Red for zero score
                            ],
                            borderColor: [
                              'rgba(34, 197, 94, 1)',
                              'rgba(251, 191, 36, 1)',
                              'rgba(239, 68, 68, 1)'
                            ],
                            borderWidth: 2
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: 'bottom',
                            labels: { color: '#9CA3AF' }
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label;
                                const value = context.parsed;
                                const total = analyticsData.performanceMetrics.totalSubmissions || 1;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} submissions (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Student Performance Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                  <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                    <Users className="mr-2" size={18} />
                    Student Performance Distribution
                  </h5>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: ['100% Score', 'Partial Score', '0% Score'],
                        datasets: [
                          {
                            label: 'Number of Students',
                            data: [
                              analyticsData.performanceMetrics.studentsWithFullScore || 0,
                              analyticsData.performanceMetrics.studentsWithPartialScore || 0,
                              analyticsData.performanceMetrics.studentsWithZeroScore || 0
                            ],
                            backgroundColor: [
                              'rgba(34, 197, 94, 0.7)',   // Green for full score
                              'rgba(251, 191, 36, 0.7)',  // Yellow for partial score
                              'rgba(239, 68, 68, 0.7)'    // Red for zero score
                            ],
                            borderColor: [
                              'rgba(34, 197, 94, 1)',
                              'rgba(251, 191, 36, 1)',
                              'rgba(239, 68, 68, 1)'
                            ],
                            borderWidth: 2
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: { 
                            beginAtZero: true,
                            ticks: { 
                              color: '#9CA3AF',
                              stepSize: 1
                            }
                          },
                          x: { ticks: { color: '#9CA3AF' } }
                        },
                        plugins: {
                          legend: { labels: { color: '#9CA3AF' } },
                          tooltip: {
                            callbacks: {
                              afterLabel: (context) => {
                                const total = analyticsData.performanceMetrics.totalUniqueStudents || 1;
                                const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                                return `${percentage}% of total students`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submission Timeline */}
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                  <Clock className="mr-2" size={18} />
                  Submission Activity Timeline (24-Hour)
                </h5>
                {analyticsData.submissionTrends.length > 0 ? (
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analyticsData.submissionTrends.map(t => t.hour),
                        datasets: [
                          {
                            label: 'Submissions',
                            data: analyticsData.submissionTrends.map(t => t.submissions),
                            borderColor: 'rgba(59, 130, 246, 1)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: { beginAtZero: true },
                          x: { ticks: { color: '#9CA3AF' } }
                        },
                        plugins: {
                          legend: { labels: { color: '#9CA3AF' } }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    No timeline data available
                  </div>
                )}
              </div>

              {/* Test Case Difficulty Analysis Table */}
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-600">
                <h5 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                  <Award className="mr-2" size={18} />
                  Detailed Test Case Analysis
                </h5>
                {analyticsData.testCaseAnalysis.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 px-4 text-gray-300">Test Case</th>
                          <th className="text-left py-3 px-4 text-gray-300">Pass Rate</th>
                          <th className="text-left py-3 px-4 text-gray-300">Passed/Total</th>
                          <th className="text-left py-3 px-4 text-gray-300">Difficulty</th>
                          <th className="text-left py-3 px-4 text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.testCaseAnalysis.map((tc, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="py-3 px-4 font-medium text-blue-300">{tc.testCase}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-600 rounded-full h-2 mr-3">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      parseFloat(tc.passRate) >= 80 ? 'bg-green-500' :
                                      parseFloat(tc.passRate) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${tc.passRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-white font-medium">{tc.passRate}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{tc.passed}/{tc.total}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tc.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                tc.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {tc.difficulty}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {parseFloat(tc.passRate) >= 80 ? (
                                <div className="flex items-center text-green-400">
                                  <TrendingUp size={16} className="mr-1" />
                                  High Success
                                </div>
                              ) : parseFloat(tc.passRate) >= 50 ? (
                                <div className="flex items-center text-yellow-400">
                                  <Target size={16} className="mr-1" />
                                  Moderate
                                </div>
                              ) : (
                                <div className="flex items-center text-red-400">
                                  <TrendingDown size={16} className="mr-1" />
                                  Needs Focus
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No detailed test case analysis available
                  </div>
                )}
              </div>
            </div>
          )}          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between items-center">
            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              <select
                value={filters.branch}
                onChange={(e) => updateFilter("branch", e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                <option value="ALL">All Branches</option>
                <option value="CSPIT-IT">CSPIT-IT</option>
                <option value="CSPIT-CSE">CSPIT-CSE</option>
                <option value="CSPIT-CE">CSPIT-CE</option>
              </select>
              <select
                value={filters.semester}
                onChange={(e) => updateFilter("semester", e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                <option value="ALL">All Semesters</option>
                {[...Array(8)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
              <select
                value={filters.language}
                onChange={(e) => updateFilter("language", e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                <option value="ALL">All Languages</option>
                <option value="CPP">C++</option>
                <option value="PYTHON">Python</option>
                <option value="JAVA">Java</option>
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="C">C</option>
              </select>
              <select
                value={filters.batch}
                onChange={(e) => updateFilter("batch", e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                <option value="ALL">All Batches</option>
                {["A", "B", "C", "D"].map((letter) =>
                  [1, 2].map((num) => (
                    <option key={`${letter}${num}`} value={`${letter}${num}`}>
                      {`${letter}${num}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Back Button Section */}
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  focusable="false"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="white"
                >
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                </svg>
                Back
              </button>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={downloadExcel}
              className="flex items-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg shadow transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Excel
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>          </div>

          {/* Tab Navigation - Only show when in batch context */}
          {((batchId && batchInfo) || (selectedBatchId && batchInfo)) && (
            <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                  activeTab === 'submissions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Submissions</span>
              </button>
              <button
                onClick={() => setActiveTab('classmates')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                  activeTab === 'classmates'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Students Progress</span>
              </button>
            </div>
          )}

          {/* Submissions Table - Show when activeTab is 'submissions' */}
          {activeTab === 'submissions' && (
            <div className="overflow-x-auto">
              <div className="mb-4 font-medium text-xl text-gray-300">
                {(batchId && batchInfo) || (selectedBatchId && batchInfo) ? (
                  <>
                    Filtered Batch Submissions: {filteredSubmissions.length > 0 ? filteredSubmissions.length : "0"}
                  </>
                ) : (
                  <>
                    Total After Filter of Submissions: {filteredSubmissions.length > 0 ? filteredSubmissions.length : "0"}
                  </>
                )}
              </div>

            <table className="w-full min-w-max text-sm text-left text-gray-400 border-collapse border border-gray-600">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th
                    className="py-3 px-6 border border-gray-600 text-sm md:text-base cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      ID
                      {sortField === "id" && (
                        <span className="ml-2">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-6 border border-gray-600 text-sm md:text-base cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("username")}
                  >
                    <div className="flex items-center">
                      User Name
                      {sortField === "username" && (
                        <span className="ml-2">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Branch
                  </th>
                  <th
                    className="py-3 px-6 border border-gray-600 text-sm md:text-base cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("batch")}
                  >
                    <div className="flex items-center">
                      Batch
                      {sortField === "batch" && (
                        <span className="ml-2">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-6 border border-gray-600 text-sm md:text-base cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort("semester")}
                  >
                    <div className="flex items-center">
                      Semester
                      {sortField === "semester" && (
                        <span className="ml-2">{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Language
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    TestCase Progress
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Performance
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Submission Date
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Marks
                  </th>
                  <th className="py-3 px-6 border border-gray-600 text-sm md:text-base">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="11" className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
                        <p className="mt-4 text-blue-500 text-lg font-medium">
                          Loading, please wait...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((submission, index) => {
                    const passPercentage = submission.numberOfTestCase && submission.numberOfTestCasePass !== null 
                      ? (submission.numberOfTestCasePass / submission.numberOfTestCase) * 100 
                      : 0;
                    
                    const getPerformanceColor = (percentage) => {
                      if (percentage >= 80) return "text-green-400";
                      if (percentage >= 50) return "text-yellow-400";
                      return "text-red-400";
                    };

                    const getPerformanceIcon = (percentage) => {
                      if (percentage >= 80) return "🟢";
                      if (percentage >= 50) return "🟡";
                      return "🔴";
                    };

                    return (
                      <tr
                        key={submission._id}
                        className={`${
                          index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                        } hover:bg-gray-700 text-gray-300 transition-all duration-200`}
                      >
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base font-medium">
                          {submission.user_id.id}
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                              {submission.user_id.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{submission.user_id.username}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <span className="px-2 py-1 bg-gray-700 text-blue-300 rounded-full text-xs font-medium">
                            {submission.user_id.branch?.toUpperCase() || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <span className="px-2 py-1 bg-gray-700 text-purple-300 rounded-full text-xs font-medium">
                            {submission.user_id.batch?.toUpperCase() || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <span className="px-2 py-1 bg-gray-700 text-green-300 rounded-full text-xs font-medium">
                            Sem {submission.user_id.semester || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission.language === 'python' ? 'bg-yellow-900 text-yellow-300' :
                            submission.language === 'java' ? 'bg-orange-900 text-orange-300' :
                            submission.language === 'cpp' || submission.language === 'c++' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {submission.language?.toUpperCase() || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center">
                              <span className="text-xs mr-2">
                                {submission.numberOfTestCasePass != null && submission.numberOfTestCase != null
                                  ? `${submission.numberOfTestCasePass}/${submission.numberOfTestCase}`
                                  : "N/A"}
                              </span>
                              {submission.numberOfTestCase && submission.numberOfTestCasePass !== null && (
                                <span className="text-xs text-gray-400">
                                  ({passPercentage.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                            {submission.numberOfTestCase && submission.numberOfTestCasePass !== null && (
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    passPercentage >= 80 ? 'bg-green-500' :
                                    passPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${passPercentage}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <div className="flex items-center">
                            <span className="mr-2">{getPerformanceIcon(passPercentage)}</span>
                            <span className={`font-medium ${getPerformanceColor(passPercentage)}`}>
                              {passPercentage >= 80 ? 'Excellent' :
                               passPercentage >= 50 ? 'Good' :
                               passPercentage > 0 ? 'Needs Work' : 'Failed'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <div className="flex flex-col">
                            <span className="text-gray-300">{formatDate(submission?.createdAt).split(' ')[0]}</span>
                            <span className="text-xs text-gray-500">{formatDate(submission?.createdAt).split(' ')[1]}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            submission?.totalMarks ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {submission?.totalMarks ?? "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-6 border border-gray-600 text-sm md:text-base">
                          <button
                            onClick={() => navigate("/submissions/" + submission._id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="py-8 text-center text-gray-400 border border-gray-600"
                    >
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg">No submissions found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or check back later</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>            </table>
          </div>
          )}

          {/* Classmate Progress Tab - Show when activeTab is 'classmates' */}
          {activeTab === 'classmates' && ((batchId && batchInfo) || (selectedBatchId && batchInfo)) && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                  <Users className="mr-2" size={20} />
                  Classmate Progress for This Problem
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">Rank</th>
                        <th className="text-left py-3 px-4 text-gray-300">Student</th>
                        <th className="text-left py-3 px-4 text-gray-300">Student ID</th>
                        <th className="text-left py-3 px-4 text-gray-300">Branch</th>
                        <th className="text-left py-3 px-4 text-gray-300">Semester</th>
                        <th className="text-left py-3 px-4 text-gray-300">Test Cases</th>
                        <th className="text-left py-3 px-4 text-gray-300">Score</th>
                        <th className="text-left py-3 px-4 text-gray-300">Performance</th>
                        <th className="text-left py-3 px-4 text-gray-300">Attempts</th>
                        <th className="text-left py-3 px-4 text-gray-300">Last Submission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get all students from the batch
                        const batchStudents = batchInfo.students || [];
                        
                        // Create a map of student progress based on submissions
                        const studentProgress = {};
                        
                        // Initialize all batch students
                        batchStudents.forEach(student => {
                          studentProgress[student._id] = {
                            student: student,
                            attempts: 0,
                            bestScore: 0,
                            testCasesPassed: 0,
                            totalTestCases: 0,
                            lastSubmission: null,
                            hasSubmitted: false
                          };
                        });
                        
                        // Count all submissions (not just best ones) for attempts
                        allSubmissions.forEach(submission => {
                          const studentId = submission.user_id._id;
                          if (studentProgress[studentId]) {
                            studentProgress[studentId].attempts++;
                            if (!studentProgress[studentId].lastSubmission || 
                                new Date(submission.createdAt) > new Date(studentProgress[studentId].lastSubmission)) {
                              studentProgress[studentId].lastSubmission = submission.createdAt;
                            }
                          }
                        });
                        
                        // Update with best submission data
                        filteredSubmissions.forEach(submission => {
                          const studentId = submission.user_id._id;
                          if (studentProgress[studentId]) {
                            const score = submission.numberOfTestCase > 0 ? 
                              (submission.numberOfTestCasePass / submission.numberOfTestCase) * 100 : 0;
                            
                            if (score > studentProgress[studentId].bestScore) {
                              studentProgress[studentId].bestScore = score;
                              studentProgress[studentId].testCasesPassed = submission.numberOfTestCasePass || 0;
                              studentProgress[studentId].totalTestCases = submission.numberOfTestCase || 0;
                              studentProgress[studentId].hasSubmitted = true;
                            }
                          }
                        });
                        
                        // Convert to array and sort by score (descending)
                        const sortedStudents = Object.values(studentProgress)
                          .sort((a, b) => {
                            if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
                            if (b.hasSubmitted !== a.hasSubmitted) return b.hasSubmitted - a.hasSubmitted;
                            return a.student.username.localeCompare(b.student.username);
                          });
                        
                        const getPerformanceColor = (score) => {
                          if (score >= 80) return "text-green-400";
                          if (score >= 50) return "text-yellow-400";
                          return "text-red-400";
                        };
                        
                        const getPerformanceIcon = (score) => {
                          if (score >= 80) return "🟢";
                          if (score >= 50) return "🟡";
                          return "🔴";
                        };
                        
                        const formatDate = (dateString) => {
                          if (!dateString) return '-';
                          const date = new Date(dateString);
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        };
                        
                        return sortedStudents.map((progress, index) => (
                          <tr key={progress.student._id} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {index < 3 && progress.hasSubmitted && (
                                  <span className={`mr-2 ${
                                    index === 0 ? 'text-yellow-400' : 
                                    index === 1 ? 'text-gray-300' : 'text-orange-400'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                )}
                                <span className="font-medium">{index + 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                                  {progress.student.username.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{progress.student.username}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-blue-400 font-mono">{progress.student.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-gray-700 text-blue-300 rounded-full text-xs font-medium">
                                {progress.student.branch?.toUpperCase() || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-gray-700 text-green-300 rounded-full text-xs font-medium">
                                Sem {progress.student.semester || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {progress.hasSubmitted ? (
                                <div className="flex flex-col space-y-1">
                                  <div className="flex items-center">
                                    <span className="text-xs mr-2">
                                      {progress.testCasesPassed}/{progress.totalTestCases}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ({progress.bestScore.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="w-20 bg-gray-600 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        progress.bestScore >= 80 ? 'bg-green-500' :
                                        progress.bestScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${progress.bestScore}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">Not Attempted</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {progress.hasSubmitted ? (
                                <span className={`font-medium ${getPerformanceColor(progress.bestScore)}`}>
                                  {progress.bestScore.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {progress.hasSubmitted ? (
                                <div className="flex items-center">
                                  <span className="mr-2">{getPerformanceIcon(progress.bestScore)}</span>
                                  <span className={`font-medium text-xs ${getPerformanceColor(progress.bestScore)}`}>
                                    {progress.bestScore >= 80 ? 'Excellent' :
                                     progress.bestScore >= 50 ? 'Good' :
                                     progress.bestScore > 0 ? 'Needs Work' : 'Failed'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                progress.attempts > 0 ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
                              }`}>
                                {progress.attempts}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-gray-400">
                                {formatDate(progress.lastSubmission)}
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {batchInfo.students?.length || 0}
                    </div>
                    <div className="text-sm text-gray-300">Total Students</div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {filteredSubmissions.length > 0 ? [...new Set(filteredSubmissions.map(s => s.user_id._id))].length : 0}
                    </div>
                    <div className="text-sm text-gray-300">Students Submitted</div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {filteredSubmissions.length > 0 ? 
                        Math.round(filteredSubmissions.reduce((sum, s) => 
                          sum + (s.numberOfTestCase > 0 ? (s.numberOfTestCasePass / s.numberOfTestCase) * 100 : 0), 0
                        ) / filteredSubmissions.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-300">Average Score</div>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {filteredSubmissions.length > 0 ? 
                        Math.round((filteredSubmissions.filter(s => 
                          s.numberOfTestCase > 0 && (s.numberOfTestCasePass / s.numberOfTestCase) >= 0.5
                        ).length / filteredSubmissions.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-300">Pass Rate (≥50%)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
