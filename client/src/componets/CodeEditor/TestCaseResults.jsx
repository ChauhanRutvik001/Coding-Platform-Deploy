import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import ErrorDisplay from "../Common/ErrorDisplay";

const TestCaseResults = ({
  results,
  activeTestCaseIndex,
  setActiveTestCaseIndex,
  isLoading,
  runLoading,
  submitLoading,
  handleRun,
  handleSubmit,
  handleSaveCode,
  handleClearResults,
  error,
  apiKeyError,
  onClearApiKeyError,
  onGoToProfile,
  isPastDue,
  saveStatus,
}) => {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  // Countdown timer for auto-save
  useEffect(() => {
    let interval;
    if (saveStatus === 'unsaved') {
      setCountdown(5);
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [saveStatus]);

  const hasResults = results && results.length > 0;
  const currentTestCase =
    hasResults && activeTestCaseIndex >= 0 && activeTestCaseIndex < results.length
      ? results[activeTestCaseIndex]
      : null;

  // Save status configurations
  const getSaveStatusConfig = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          text: 'Saving...',
          icon: '🔄',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'saved':
        return {
          text: 'Saved',
          icon: '✓',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'unsaved':
        return {
          text: 'Unsaved Changes',
          icon: '●',
          bgColor: 'bg-orange-500',
          textColor: 'text-white'
        };
      case 'error':
        return {
          text: 'Save Failed',
          icon: '⚠',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      default:
        return {
          text: 'Save Code',
          icon: '💾',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
    }
  };

  const statusConfig = getSaveStatusConfig();
  return (
    <div className="mt-4">
      {/* Auto-save status indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            <span className="mr-1">{statusConfig.icon}</span>
            {statusConfig.text}
          </span>          {saveStatus === 'unsaved' && (
            <span className="text-xs text-gray-500">
              Auto-save in {countdown} second{countdown !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {saveStatus === 'error' && (
          <button
            onClick={handleSaveCode}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
          >
            Retry Save
          </button>
        )}
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleRun}
          disabled={isLoading || runLoading || submitLoading}
          className={`px-4 py-2 rounded-lg shadow-md text-white transition-all duration-200 ${
            runLoading ? "bg-gray-500" : "bg-yellow-500 hover:bg-yellow-400"
          }`}
        >
          {runLoading ? "Running..." : "Run Test Case"}
        </button>        <button
          onClick={handleSubmit}
          disabled={isLoading || submitLoading || runLoading || isPastDue}
          className={`px-4 py-2 rounded-lg shadow-md text-white transition-all duration-200 ${
            submitLoading ? "bg-gray-500" : isPastDue ? "bg-red-800" : "bg-green-600 hover:bg-green-500"
          }`}
          title={isPastDue ? "Submission deadline has passed" : ""}
        >
          {submitLoading ? "Submitting..." : isPastDue ? "Submission Closed" : "Submit Code"}
        </button>        <button 
          onClick={handleSaveCode} 
          disabled={saveStatus === 'saving'}
          className={`px-4 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 ${statusConfig.bgColor} ${statusConfig.textColor} hover:opacity-90 disabled:opacity-50`}
        >
          <span>{statusConfig.icon}</span>
          <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Code'}</span>        </button>      </div>      {/* API Key Error Display */}
      {apiKeyError && (
        <div className="mt-4 relative">
          <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
            <ErrorDisplay
              error={apiKeyError}
              onGoToProfile={onGoToProfile}
              onRetry={handleRun}
            />
          </div>
          <button
            onClick={onClearApiKeyError}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 shadow-lg"
            title="Close API key error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && !apiKeyError && (
        <div className="mt-4 p-4 bg-red-800 text-red-200 rounded-lg shadow-lg max-w-full overflow-auto relative">
          <button
            onClick={handleClearResults}
            className="absolute top-2 right-2 text-red-200 hover:text-white transition-colors"
            title="Close error message"
          >
            <X size={18} />
          </button>
          <strong>Error:</strong> {error}
        </div>
      )}{hasResults && !error && !apiKeyError ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              {results.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestCaseIndex(index)}
                  className={`px-3 py-2 rounded-lg shadow-md transition-all duration-200 ${
                    activeTestCaseIndex === index
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Case {index + 1}
                </button>
              ))}
            </div>
            
            {/* Close/Clear Results Button */}
            <button
              onClick={handleClearResults}
              className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-all duration-200"
              title="Close test case results"
            >
              <X size={16} className="mr-1" />
              Close Results
            </button>
          </div>

          {currentTestCase && (
            <div className="mt-4 bg-gray-800 p-4 rounded-lg shadow-lg text-gray-300">
              <h3
                className={`text-lg font-semibold ${
                  currentTestCase.passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {currentTestCase.passed ? "Accepted" : "Failed"}
              </h3>

              <div className="mt-2 flex flex-col">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Input</h4>
                  <div className="p-3 bg-gray-900 rounded-lg overflow-auto mb-2">
                    {currentTestCase.input || "No input provided"}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Output</h4>
                  <div className="p-3 bg-gray-900 rounded-lg overflow-auto">
                    {currentTestCase.output || "No output available"}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Expected Output</h4>
                <div className="p-3 bg-gray-900 rounded-lg overflow-auto">
                  {currentTestCase.expectedOutput || "No expected output"}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (        !error && !apiKeyError && (
          <div className="mt-4 text-gray-500">
            {/* No results available */}
          </div>
        )
      )}

      {/* Notification for past due submissions */}
      {isPastDue && (
        <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
            </svg>
            <span>The submission deadline for this problem has passed.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseResults;
