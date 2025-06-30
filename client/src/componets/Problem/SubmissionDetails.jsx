import React, { useState } from "react";
import PropTypes from "prop-types";

const SubmissionDetails = ({ submission, onBack }) => {
  const [expandedCase, setExpandedCase] = useState(null); // Default: No case expanded
  // console.log(submission);

  const safeAccess = (obj, path, defaultValue = "N/A") => {
    try {
      return path.reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue),
        obj
      );
    } catch {
      return defaultValue;
    }
  };

  const toggleExpand = (index) => {
    setExpandedCase(expandedCase === index ? null : index);
  };

  const isLoaded = submission && Object.keys(submission).length > 0;  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          className="mb-4 sm:mb-6 bg-blue-600 px-4 py-2 sm:px-6 sm:py-3 rounded-lg text-white hover:bg-blue-500 transition-colors duration-200 text-sm sm:text-base font-medium shadow-lg"
          onClick={onBack}
        >
          ← Back to Submissions
        </button>

        <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl text-white mb-4 sm:mb-6 break-words">
          Submission Details:{" "}
          <span className="text-blue-400 block sm:inline mt-1 sm:mt-0">
            {safeAccess(submission, ["problem_id", "title"], "Problem Title Unavailable")}
          </span>
        </h3>        {isLoaded ? (
          <>
            {/* Test Case Overview */}
            <div className="mb-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <span className="text-base sm:text-lg font-semibold text-white">
                  Test Cases: {safeAccess(submission, ["numberOfTestCasePass"], 0)}/
                  {safeAccess(submission, ["numberOfTestCase"], 0)} Passed
                </span>
                <span
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium ${
                    safeAccess(submission, ["numberOfTestCase"]) ===
                    safeAccess(submission, ["numberOfTestCasePass"])
                      ? "bg-green-600 text-green-100"
                      : "bg-red-600 text-red-100"
                  }`}
                >
                  {safeAccess(submission, ["numberOfTestCase"]) ===
                  safeAccess(submission, ["numberOfTestCasePass"])
                    ? "✓ All Passed"
                    : "✗ Some Failed"}
                </span>
              </div>
            </div>            {/* Marks and Details */}
            <div className="mb-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700">
              <span className="text-base sm:text-lg font-semibold text-white">
                Total Marks: {safeAccess(submission, ["totalMarks"], "Not Available")}
              </span>
            </div>

            {/* Runtime and Memory */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 sm:p-6 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700">
                <p className="text-gray-300 text-sm sm:text-base mb-2">Runtime</p>
                <p className="text-xl sm:text-2xl lg:text-3xl text-white font-bold">
                  {safeAccess(submission, ["execution_time"], 0).toFixed(2)} ms
                </p>
              </div>
              <div className="p-4 sm:p-6 bg-gray-800 rounded-lg text-center shadow-lg border border-gray-700">
                <p className="text-gray-300 text-sm sm:text-base mb-2">Memory</p>
                <p className="text-xl sm:text-2xl lg:text-3xl text-white font-bold">
                  {safeAccess(submission, ["memory_usage"], 0).toFixed(2)} MB
                </p>
              </div>
            </div>            {/* Code Block */}
            <div className="mb-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700">
              <p className="text-white mb-3 sm:mb-4 font-bold text-base sm:text-lg">Code:</p>
              <div className="relative">
                <pre className="bg-gray-900 p-3 sm:p-4 rounded-lg text-gray-100 overflow-x-auto text-xs sm:text-sm border border-gray-600 max-h-64 sm:max-h-96 overflow-y-auto">
                  <code className="break-words whitespace-pre-wrap">
                    {safeAccess(submission, ["code"], "No code available")}
                  </code>
                </pre>
              </div>
            </div>            {/* Test Cases */}
            <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Test Cases</h4>
            {submission.testCaseResults?.length > 0 ? (
              <div className="space-y-4">
                {submission.testCaseResults.map((testCase, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                    {/* Summary */}
                    <div
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-6 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleExpand(index)}
                    >
                      <p className="text-white font-bold text-sm sm:text-base mb-2 sm:mb-0">
                        Test Case {index + 1} -{" "}
                        <span
                          className={testCase?.passed ? "text-green-400" : "text-red-400"}
                        >
                          {testCase?.passed ? "✓ Passed" : "✗ Failed"}
                        </span>
                      </p>
                      <button className="text-blue-400 hover:text-blue-300 text-sm sm:text-base font-medium transition-colors self-start sm:self-auto">
                        {expandedCase === index ? "Hide Details ↑" : "Show Details ↓"}
                      </button>
                    </div>

                    {/* Details */}
                    {expandedCase === index && (
                      <div className="border-t border-gray-600 p-4 sm:p-6 bg-gray-900/50">
                        <div className="space-y-4">
                          <div>
                            <p className="text-white font-medium mb-2 text-sm sm:text-base">Input:</p>
                            <pre className="bg-gray-900 p-3 sm:p-4 rounded-lg text-gray-100 overflow-x-auto text-xs sm:text-sm border border-gray-600 max-h-32 overflow-y-auto">
                              {testCase.input || "No input provided"}
                            </pre>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-2 text-sm sm:text-base">Your Output:</p>
                            <pre className="bg-gray-900 p-3 sm:p-4 rounded-lg text-gray-100 overflow-x-auto text-xs sm:text-sm border border-gray-600 max-h-32 overflow-y-auto">
                              {testCase.output || "No output generated"}
                            </pre>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-2 text-sm sm:text-base">Expected Output:</p>
                            <pre className="bg-gray-900 p-3 sm:p-4 rounded-lg text-gray-100 overflow-x-auto text-xs sm:text-sm border border-gray-600 max-h-32 overflow-y-auto">
                              {testCase.expectedOutput || "Expected output not available"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-700 text-center">
                <p className="text-gray-400 text-sm sm:text-base">No test cases available for this submission.</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-700 text-center">
            <p className="text-gray-400 text-sm sm:text-base">Submission details not loaded.</p>
          </div>        )}
      </div>
    </div>
  );
};

SubmissionDetails.propTypes = {
  submission: PropTypes.shape({
    problem_id: PropTypes.shape({
      title: PropTypes.string,
    }),
    numberOfTestCasePass: PropTypes.number,
    numberOfTestCase: PropTypes.number,
    totalMarks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    execution_time: PropTypes.number,
    memory_usage: PropTypes.number,
    language: PropTypes.string,
    code: PropTypes.string,
    testCaseResults: PropTypes.arrayOf(
      PropTypes.shape({
        input: PropTypes.string,
        output: PropTypes.string,
        expectedOutput: PropTypes.string,
        passed: PropTypes.bool,
      })
    ),
  }).isRequired,
  onBack: PropTypes.func.isRequired,
};

export default SubmissionDetails;
