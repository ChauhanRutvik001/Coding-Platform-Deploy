import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import "../../CSS/ProblemShow.css";
import Submission from "./Submission";
import Solution from "./Solution";
import Statement from "./Statement";
import CodeEditor from "../CodeEditor/CodeEditor";
import toast from "react-hot-toast";

const ProblemShow = () => {
  const { id, batchId } = useParams();
  const location = useLocation();
  const { state } = location;
  const { startTime, endTime } = state || {};
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("statement");
  const [latestSubmission, setLatestSubmission] = useState(null); // Store latest submission
  const [isPastDue, setIsPastDue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const codeTemplates = {
    java: "public class Solution {\n  public static void main(String[] args) {\n    // Your code here\n  }\n}",
    python: 'if __name__ == "__main__":\n    # Your code here\n    pass',
    cpp: "#include <iostream>\nint main() {\n  // Your code here\n  return 0;\n}",
  };

  const resizableRef = useRef(null);

  // Helper to get due date for this batch
  const getBatchDueDate = (problem, batchId) => {
    if (!problem?.batchDueDates) return null;
    const entry = problem.batchDueDates.find(
      (b) => b.batch === batchId || b.batchId === batchId
    );
    return entry ? entry.dueDate : null;
  };

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/problems/${id}`);
        setProblem(response.data.problem || response.data);
        console.log("Fetched Problem:", response.data.problem || response.data);
        setError(null);
        // Check if problem is past due date for this batch
        if (batchId && response.data.batchDueDates && response.data.batchDueDates.length > 0) {
          console.log("Batch Due Dates:", response.data.batchDueDates);
          const entry = response.data.batchDueDates.find(
            (b) => b.batch === batchId || b.batchId === batchId
          );
          if (entry && entry.dueDate) {
            const dueDate = new Date(entry.dueDate);
            console.log("Due Date:", dueDate);
            setIsPastDue(new Date() > dueDate);
          } else {
            setIsPastDue(false);
          }
        } else {
          setIsPastDue(false);
        }
      } catch (err) {
        console.error("Error fetching problem:", err);
        setError(err.response?.data?.message || "Failed to load problem");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id, batchId]);

  useEffect(() => {
    setCode(codeTemplates[language]);
  }, [language]);

  const handleSubmission = (submission) => {
    setLatestSubmission(submission); // Update with the new submission
    setActiveTab("submissions");
  };

  // Format the due date for display
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const dueDate = batchId && problem ? getBatchDueDate(problem, batchId) : null;
  const isBatchPastDue = dueDate ? new Date() > new Date(dueDate) : false;

  useEffect(() => {
    if (problem && batchId && problem.batchDueDates) {
      const batchDueDate = problem.batchDueDates.find(bd => {
        if (!bd || !bd.batch) return false;
        const bdBatchId = typeof bd.batch === "object" ? bd.batch._id : bd.batch.toString();
        return bdBatchId === batchId;
      });

      if (batchDueDate && batchDueDate.dueDate) {
        const dueDate = new Date(batchDueDate.dueDate);
        const now = new Date();
        setIsPastDue(dueDate < now);
      }
    }
  }, [problem, batchId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-900/40 border border-red-800 text-red-200 px-4 py-3 rounded">
          <p className="font-medium">Error loading problem</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
        <span className="ml-4 text-white text-lg">
          Loading problem details...
        </span>
      </div>
    );
  }

  return (
    <div className="problem-container">
      <div
        ref={resizableRef}
        className="resizable bg-gray-900 p-4 flex flex-col"
      >
        <div className="sticky top-0 z-10 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full flex items-center shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
          >
            <svg
              className="MuiSvgIcon-root _icon_1pe2i_343"
              style={{ width: "15px" }}
              focusable="false"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="white"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
            </svg>
          </button>
          
          {/* Title Section - FIXED for all screen sizes */}
          <div className="mb-4">
            {/* Problem Title - Always visible with proper truncation */}
            <div className="mb-2">
              <h1 
                className="text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-2 sm:line-clamp-1"
                title={problem.title}
              >
                {problem.title}
              </h1>
            </div>
            
            {/* Due date badge - Separate from title for better small screen layout */}
            {batchId && problem.batchDueDates && (
              <div className="mt-2">
                {(() => {
                  // Find the due date for this batch
                  const batchDueDate = problem.batchDueDates.find((bd) => {
                    if (!bd || !bd.batch) return false;
                    const bdBatchId =
                      typeof bd.batch === "object"
                        ? bd.batch._id
                        : bd.batch.toString();
                    return bdBatchId === batchId;
                  });

                  if (!batchDueDate || !batchDueDate.dueDate) {
                    return (
                      <div className="text-gray-400 text-sm flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>No due date</span>
                      </div>
                    );
                  }

                  const dueDate = new Date(batchDueDate.dueDate);
                  const now = new Date();
                  const isPastDue = dueDate < now;

                  // Format the date
                  const dateOptions = {
                    month: "short",
                    day: "numeric",
                  };
                  const timeOptions = {
                    hour: "2-digit",
                    minute: "2-digit",
                  };

                  const dateFormatted = dueDate.toLocaleDateString(
                    undefined,
                    dateOptions
                  );
                  const timeFormatted = dueDate.toLocaleTimeString(
                    undefined,
                    timeOptions
                  );

                  return (
                    <div
                      className={`px-3 py-1.5 rounded-md border ${
                        isPastDue
                          ? "border-red-700 bg-red-900/30 text-red-400"
                          : "border-blue-700 bg-blue-900/30 text-blue-400"
                      } text-sm flex items-center`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        <span className="font-medium">Due: </span>
                        {dateFormatted} at {timeFormatted}
                        {isPastDue && " (Past Due)"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="border-b border-gray-700 mb-4">
            <button
              onClick={() => setActiveTab("statement")}
              className={`py-2 px-4 ${
                activeTab === "statement"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-400 hover:text-white"
              } transition-all duration-200`}
            >
              Statement
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`py-2 px-4 ${
                activeTab === "submissions"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-400 hover:text-white"
              } transition-all duration-200`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab("solution")}
              className={`py-2 px-4 ${
                activeTab === "solution"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-400 hover:text-white"
              } transition-all duration-200`}
            >
              Solution
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "statement" && <Statement problem={problem} />}
          {activeTab === "submissions" && (
            <Submission
              problemId={problem._id}
              latestSubmission={latestSubmission} // Pass latest submission
            />
          )}
          {activeTab === "solution" && <Solution />}
        </div>
      </div>

      {/* Divider */}
      <div
        className="divider"
        onMouseDown={() => {
          window.addEventListener("mousemove", handleResize);
          window.addEventListener("mouseup", () => {
            window.removeEventListener("mousemove", handleResize);
          });
        }}
      ></div>

      {/* Right Column: Code Editor */}
      <CodeEditor
        language={language}
        setLanguage={setLanguage}
        code={code}
        setCode={setCode}
        problem={problem}
        onSubmission={handleSubmission}
        isPastDue={isPastDue}
      />
    </div>
  );
};

export default ProblemShow;