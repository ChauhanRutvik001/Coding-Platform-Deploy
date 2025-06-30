import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  School,
  Book,
  Clock,
  Info,
  ChevronRight,
  AlertCircle,
  Award,
  Search,
  ChevronLeft,
  ChevronUp,
  Filter,
} from "lucide-react";

const ProblemDetails = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchPage, setBatchPage] = useState(1);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [totalBatchPages, setTotalBatchPages] = useState(1);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalBatches, setTotalBatches] = useState(0);
  const BATCHES_PER_PAGE = 3;
  const [facultyBatchIds, setFacultyBatchIds] = useState([]); // Store faculty's batch IDs

  // Fetch initial problem details and faculty batches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to fetch faculty batches first
        try {
          const facultyResponse = await axiosInstance.get(
            "/faculty/my-batches"
          );
          if (facultyResponse.data.success) {
            // If this succeeds, the user is a faculty member
            const batchIds =
              facultyResponse.data.batches?.map((b) => b._id) || [];
            setFacultyBatchIds(batchIds);
          }
        } catch (err) {
          // Not a faculty or other error - just continue without faculty filtering
          console.log("Not fetching as faculty or error:", err);
        }

        // Fetch problem details
        const response = await axiosInstance.get(
          `/problems/${problemId}/details`
        );
        setProblem(response.data.problem);
        console.log("Problem details:", response.data.problem);
        // If we have faculty batch IDs, filter the problem's batches
        if (
          facultyBatchIds.length > 0 &&
          response.data.problem?.batchDueDates
        ) {
          const facultyBatches = response.data.problem.batchDueDates.filter(
            (bd) => facultyBatchIds.includes(bd.batch?._id || bd.batch)
          );
          setTotalBatches(facultyBatches.length);
        } else {
          // Otherwise, show all batches
          if (response.data.problem?.batchDueDates) {
            setTotalBatches(response.data.problem.batchDueDates.length);
          } else {
            setTotalBatches(0);
          }
        }

        // Fetch the first page of batches
        fetchBatches(1, "");
      } catch (err) {
        console.error("Error fetching problem details:", err);
        setError("Failed to load problem details. Please try again.");
        toast.error("Error loading problem details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [problemId]);

  // Fetch batches with pagination and search
  const fetchBatches = async (page, searchTerm) => {
    setIsSearching(true);
    try {
      const response = await axiosInstance.get(
        `/problems/${problemId}/details`,
        {
          params: {
            page: page,
            limit: BATCHES_PER_PAGE,
            query: searchTerm,
            facultyOnly: "true",
          },
        }
      );

      // If we get paginated response
      if (response.data.batches) {
        let batchesToShow = response.data.batches;

        // If we have faculty batch IDs, filter the results
        if (facultyBatchIds.length > 0) {
          batchesToShow = batchesToShow.filter((bd) =>
            facultyBatchIds.includes(bd.batch?._id || bd.batch)
          );
          setTotalBatchPages(
            Math.ceil(batchesToShow.length / BATCHES_PER_PAGE)
          );
        } else {
          setTotalBatchPages(response.data.pagination.totalPages);
        }

        setFilteredBatches(batchesToShow);
        setTotalBatches(
          facultyBatchIds.length > 0
            ? batchesToShow.length
            : response.data.pagination.totalBatches
        );
      }
      // If we get full problem response (backward compatibility)
      else if (response.data.problem?.batchDueDates) {
        let allBatches = response.data.problem.batchDueDates;

        // If we have faculty batch IDs, filter the results
        if (facultyBatchIds.length > 0) {
          allBatches = allBatches.filter((bd) =>
            facultyBatchIds.includes(bd.batch?._id || bd.batch)
          );
        }

        // Filter by search term if provided
        const filtered = searchTerm
          ? allBatches.filter(
              (b) =>
                (b.batch?.name &&
                  b.batch.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())) ||
                (b.batch?.subject &&
                  b.batch.subject
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()))
            )
          : allBatches;

        // Apply client-side pagination
        const startIndex = (page - 1) * BATCHES_PER_PAGE;
        const endIndex = startIndex + BATCHES_PER_PAGE;

        setFilteredBatches(filtered.slice(startIndex, endIndex));
        setTotalBatchPages(Math.ceil(filtered.length / BATCHES_PER_PAGE));
        setTotalBatches(filtered.length);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      toast.error("Error loading batches");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setBatchPage(1); // Reset to first page on search
      fetchBatches(1, batchSearchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [batchSearchTerm, problemId]);

  // Handle pagination
  useEffect(() => {
    // Don't refetch on initial load (it's handled by the first useEffect)
    if (loading && batchPage === 1) return;

    fetchBatches(batchPage, batchSearchTerm);
  }, [batchPage]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;

    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;

    // If already past due
    if (diff < 0) return "Past due";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ${hours} hr${
        hours !== 1 ? "s" : ""
      }`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hr${hours !== 1 ? "s" : ""} ${minutes} min${
        minutes !== 1 ? "s" : ""
      }`;
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (batchPage < totalBatchPages) {
      setBatchPage(batchPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (batchPage > 1) {
      setBatchPage(batchPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white flex items-center justify-center">
        <div className="text-red-400 text-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-28 pd-20">
        {/* Back to Problem Button */}
        <button
          onClick={() => navigate(-1)}
          className="py-2.5 px-6 mb-8 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
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
          Back to Problems
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: Problem details */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden mb-8 border border-gray-700">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 h-2 w-full" />
              <div className="p-6 border-b border-gray-700">
                {/* Problem Title Section - PROPERLY FIXED */}
                <div className="flex items-start">
                  {/* Left Column - Now properly truncates */}
                  <div className="w-0 flex-1 min-w-0 overflow-hidden">
                    {" "}
                    {/* w-0 + flex-1 is the key */}
                    <h1
                      className="text-2xl font-bold text-white truncate"
                      title={problem.title}
                    >
                      {problem.title}
                    </h1>
                  </div>

                  {/* Right Column */}
                  <div className="flex-shrink-0 ml-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        problem.difficulty === "easy"
                          ? "bg-green-900/40 text-green-400 border border-green-500/30"
                          : problem.difficulty === "medium"
                          ? "bg-yellow-900/40 text-yellow-400 border border-yellow-500/30"
                          : "bg-red-900/40 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() +
                        problem.difficulty.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Problem metadata section - Fixed for long creator names */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="truncate">
                      Created: {formatDate(problem.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span
                      className="truncate max-w-[200px]"
                      title={`Created by: ${
                        problem.createdBy?.name ||
                        problem.createdBy?.username ||
                        "Unknown"
                      }`}
                    >
                      Created by:{" "}
                      {problem.createdBy?.name ||
                        problem.createdBy?.username ||
                        "Unknown"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Total marks: {problem.totalMarks || 0}</span>
                  </span>
                </div>

                {/* Tags section - Fixed for long tags */}
                {problem.tags && problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {problem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs font-medium truncate max-w-[150px]"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Problem description section */}
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Problem Description
                </h2>
                <div className="prose prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                  />
                </div>
              </div>

              {/* Other problem sections */}
              {problem.inputFormat && (
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">Input Format</h2>
                  <div className="prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{ __html: problem.inputFormat }}
                    />
                  </div>
                </div>
              )}

              {problem.outputFormat && (
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">Output Format</h2>
                  <div className="prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{ __html: problem.outputFormat }}
                    />
                  </div>
                </div>
              )}

              {problem.constraints && (
                <div className="p-6 border-b border-gray-700">
                  <h2 className="text-xl font-semibold mb-4">Constraints</h2>
                  <div className="prose prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{ __html: problem.constraints }}
                    />
                  </div>
                </div>
              )}

              {/* Sample Input/Output section */}
              {problem.sampleIO && problem.sampleIO.length > 0 && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Sample Input/Output
                  </h2>
                  <div className="space-y-4">
                    {problem.sampleIO.map((sample, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Sample Input {index + 1}
                          </h3>
                          <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm bg-gray-950 p-3 rounded border border-gray-800">
                            {sample.input}
                          </pre>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-400 mb-2">
                            Sample Output {index + 1}
                          </h3>
                          <pre className="text-gray-200 whitespace-pre-wrap font-mono text-sm bg-gray-950 p-3 rounded border border-gray-800">
                            {sample.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Assigned batches with search and pagination */}
          <div className="lg:w-2/5">
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 sticky top-24">
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 h-2 w-full" />
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <School className="text-purple-400" size={22} />
                  <span>Assigned Batches</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  This problem has been assigned to {totalBatches} batch(es)
                </p>

                {/* Search input for batches */}
                <div className="mt-4 relative">
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={batchSearchTerm}
                    onChange={(e) => setBatchSearchTerm(e.target.value)}
                    className="w-full py-2 px-4 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto">
                {filteredBatches.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {/* Batch Card - Fixed for long batch names and subjects */}
                      {filteredBatches.map((batchDue) => {
                        const timeRemaining = batchDue.dueDate
                          ? getTimeRemaining(batchDue.dueDate)
                          : null;
                        const isPastDue = timeRemaining === "Past due";

                        return (
                          <div
                            key={batchDue.batch?._id || batchDue.batch}
                            className="bg-gray-750 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/problems/${problemId}/${
                                  batchDue.batch?._id || batchDue.batch
                                }`
                              )
                            }
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="font-medium text-lg text-white truncate"
                                  title={
                                    batchDue.batch?.name || "Unknown Batch"
                                  }
                                >
                                  {batchDue.batch?.name || "Unknown Batch"}
                                </h3>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 text-sm text-gray-300">
                              {batchDue.batch?.subject && (
                                <div className="flex items-center gap-1">
                                  <Book
                                    size={14}
                                    className="text-blue-400 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className="truncate block"
                                      title={batchDue.batch.subject}
                                    >
                                      {batchDue.batch.subject}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {batchDue.batch?.students && (
                                <div className="flex items-center gap-1">
                                  <Users
                                    size={14}
                                    className="text-blue-400 flex-shrink-0"
                                  />
                                  <span>
                                    {batchDue.batch.students.length} students
                                  </span>
                                </div>
                              )}

                              {batchDue.dueDate && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Calendar
                                      size={14}
                                      className="text-blue-400 flex-shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className="truncate block"
                                        title={`Due: ${formatDate(
                                          batchDue.dueDate
                                        )}`}
                                      >
                                        Due: {formatDate(batchDue.dueDate)}
                                      </span>
                                    </div>
                                  </div>

                                  {timeRemaining && (
                                    <div className="flex items-center gap-1">
                                      <Clock
                                        size={14}
                                        className={`${
                                          isPastDue
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                        } flex-shrink-0`}
                                      />
                                      <span
                                        className={
                                          isPastDue
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                        }
                                      >
                                        {timeRemaining}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex justify-end mt-3">
                              <button
                                className="flex items-center gap-1 text-blue-400 hover:text-blue-200 transition font-semibold border border-blue-700 px-3 py-1 rounded-lg bg-blue-900/30 shadow-sm text-xs"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the parent div's onClick
                                  navigate(
                                    `/problems/${problemId}/${
                                      batchDue.batch?._id || batchDue.batch
                                    }`
                                  );
                                }}
                              >
                                <span>Solve Problem</span>
                                <ChevronRight
                                  size={15}
                                  className="flex-shrink-0"
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination controls */}
                    {totalBatchPages > 1 && (
                      <div className="flex justify-between items-center mt-6 border-t border-gray-700 pt-4">
                        <button
                          onClick={handlePrevPage}
                          disabled={batchPage === 1}
                          className={`flex items-center gap-1 px-3 py-1 rounded ${
                            batchPage === 1
                              ? "text-gray-500 cursor-not-allowed"
                              : "text-blue-400 hover:text-blue-300"
                          }`}
                        >
                          <ChevronLeft size={16} />
                          <span>Previous</span>
                        </button>

                        <span className="text-gray-400 text-sm">
                          Page {batchPage} of {totalBatchPages}
                        </span>

                        <button
                          onClick={handleNextPage}
                          disabled={batchPage === totalBatchPages}
                          className={`flex items-center gap-1 px-3 py-1 rounded ${
                            batchPage === totalBatchPages
                              ? "text-gray-500 cursor-not-allowed"
                              : "text-blue-400 hover:text-blue-300"
                          }`}
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-750 rounded-lg p-6 text-center border border-gray-700">
                    <School size={32} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      {batchSearchTerm
                        ? "No batches match your search."
                        : "This problem is not assigned to any of your  batches yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetails;
