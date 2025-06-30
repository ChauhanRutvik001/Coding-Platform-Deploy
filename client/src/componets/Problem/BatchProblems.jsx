import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import { BookOpen, FileText, CalendarDays, Clock, User } from "lucide-react";

const BatchProblems = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [batch, setBatch] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBatchProblems = async () => {
      setLoading(true);
      try {
        // Get batch details
        const batchResponse = await axiosInstance.get(`/faculty/batches/${batchId}`);
        setBatch(batchResponse.data.batch);

        // Get problems assigned to this batch
        const problemsResponse = await axiosInstance.get(`/problems/batch/${batchId}`);
        setProblems(problemsResponse.data.problems);
        setError(null);
      } catch (err) {
        console.error("Error fetching batch problems:", err);
        setError("Failed to load problems for this batch. Please try again later.");
        toast.error("Failed to load problems for this batch");
      } finally {
        setLoading(false);
      }
    };

    fetchBatchProblems();
  }, [batchId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if a problem is past due date
  const isPastDue = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
  };

  // Get due date for this batch from batchDueDates array
  const getBatchDueDate = (problem, batchId) => {
    if (!problem.batchDueDates) return null;
    const entry = problem.batchDueDates.find(
      (b) => b.batch === batchId || b.batchId === batchId
    );
    return entry ? entry.dueDate : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
          <p className="mt-4 text-lg font-medium text-blue-400">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Batch Header */}
        {batch && (
          <div className="mb-8 bg-gray-800 rounded-lg p-5 border border-gray-700 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {batch.name}
                </h1>
                <p className="text-gray-400 mt-1">{batch.subject || "No subject specified"}</p>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <User size={16} />
                <span>
                  {batch.faculty?.firstName} {batch.faculty?.lastName} (Faculty)
                </span>
              </div>
            </div>
            {batch.description && (
              <p className="mt-4 text-gray-300 border-t border-gray-700 pt-4">
                {batch.description}
              </p>
            )}
          </div>
        )}

        {/* Problems List Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-400">
            <BookOpen className="inline-block mr-2" /> Assigned Problems
          </h2>
          <div className="text-sm text-gray-400">
            {problems.length} {problems.length === 1 ? "Problem" : "Problems"} Available
          </div>
        </div>

        {problems.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <FileText size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">No Problems Assigned Yet</h3>
            <p className="text-gray-400">
              There are no problems assigned to this batch at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => {
              const dueDate = getBatchDueDate(problem, batchId);
              return (
                <div
                  key={problem._id}
                  className={`bg-gray-800 rounded-lg border overflow-hidden shadow-lg transition-transform duration-200 hover:transform hover:scale-[1.02] ${
                    isPastDue(dueDate)
                      ? "border-red-900/50"
                      : "border-gray-700"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-white mb-2 flex-1">
                        {problem.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          problem.difficulty === "Easy"
                            ? "bg-green-900/50 text-green-400"
                            : problem.difficulty === "Medium"
                            ? "bg-yellow-900/50 text-yellow-400"
                            : "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center text-gray-400 text-sm">
                      <User size={14} className="mr-1" />
                      <span>
                        By {problem.createdBy?.firstName || "Faculty"}{" "}
                        {problem.createdBy?.lastName || ""}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center text-gray-400 text-sm">
                      <CalendarDays size={14} className="mr-1" />
                      <span>Created on {formatDate(problem.createdAt)}</span>
                    </div>

                    {dueDate && (
                      <div
                        className={`mt-2 flex items-center text-sm ${
                          isPastDue(dueDate)
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        <Clock size={14} className="mr-1" />
                        <span>
                          {isPastDue(dueDate) ? "Was due on " : "Due by "}
                          {formatDate(dueDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-900 px-5 py-3 border-t border-gray-800">
                    <Link
                      to={`/problems/${problem._id}/${batchId}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition flex items-center justify-center w-full"
                    >
                      Open Problem
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProblems;