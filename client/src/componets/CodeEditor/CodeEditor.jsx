import React, { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import ScoreAndLanguageSelector from "./ScoreAndLanguageSelector";
import CodeEditorArea from "./CodeEditorArea";
import TestCaseResults from "./TestCaseResults";
import CustomTestCase from "./CustomTestCase";
import ErrorDisplay from "../Common/ErrorDisplay";
import ApiUsageStats from "../Problem/ApiUsageStats";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchHistory, setCurrentPage } from "../../redux/slices/historySlice";
import { fetchSubmissions } from "../../redux/slices/submissionSlice";
import { useNavigate } from "react-router-dom";

const CodeEditor = ({ language, setLanguage, problem, onSubmission, isPastDue }) => {
  const user = useSelector((state) => state.app.user);
  const [assignLoading, setAssignLoading] = useState(false); // For button-specific loading
  const userId = user._id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const testcases = problem.testCases;

  // console.log(testcases[0]);

  const [codeByLanguage, setCodeByLanguage] = useState({
    java: `import java.util.*;
import java.lang.*;
import java.io.*;

class Main {
    public static void main(String[] args){
        // Your code goes here
        System.out.println("Hello, World!");
    }
}`,
    python: `print("Hello, World!")`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code goes here
    cout << "Hello, World!" << endl;
    return 0;
}`,
  });

  const [results, setResults] = useState(null);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);  const [isLoading, setIsLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeyError, setApiKeyError] = useState(null); // Separate state for API key errors
  const previousLanguageRef = useRef(language);
  const [theme, setTheme] = useState("vs-dark"); // Default theme
  
  // Auto-save functionality state
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved', 'saving', 'unsaved', 'error'
  const [lastSavedCode, setLastSavedCode] = useState({});
  const [isCustomTestOpen, setIsCustomTestOpen] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const saveInProgressRef = useRef(false);
  useEffect(() => {
    const fetchSavedCode = async () => {
      try {
        const response = await axiosInstance.get("/compile/getCode", {
          params: { problemId: problem._id },
        });
        if (response.data.success) {
          setCodeByLanguage(response.data.code);
          setLastSavedCode(response.data.code);
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("Error fetching saved code:", error);
      }
    };

    fetchSavedCode();
  }, [userId, problem._id]);
  // Auto-save function with debouncing and better error handling
  const autoSaveCode = useCallback(async (codeToSave) => {
    if (saveInProgressRef.current) return;
    
    // Check if code has actually changed
    const hasChanged = Object.keys(codeToSave).some(lang => 
      codeToSave[lang] !== lastSavedCode[lang]
    );
    
    if (!hasChanged) return;

    saveInProgressRef.current = true;
    setSaveStatus("saving");

    try {
      const response = await axiosInstance.post("/compile/saveCode", {
        problemId: problem._id,
        codeByLanguage: codeToSave,
      });

      // console.log("Auto-save response:", response.data);
      
      // Handle no-change response
      if (response.data.isNoChange) {
        setLastSavedCode(codeToSave);
        setSaveStatus("saved");
        return;
      }
      
      setLastSavedCode(codeToSave);
      setSaveStatus("saved");
      
      // Optional: Show subtle success indication
      if (process.env.NODE_ENV === 'development') {
        // console.log('Auto-saved at:', response.data.timestamp);
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      setSaveStatus("error");
      
      // Retry logic for network errors
      if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
        setTimeout(() => {
          if (saveStatus === 'error') {
            autoSaveCode(codeToSave);
          }
        }, 10000); // Retry after 10 seconds
      }
    } finally {
      saveInProgressRef.current = false;
    }
  }, [problem._id, lastSavedCode, saveStatus]);

  // Effect to handle auto-save with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Check if code has changed
    const hasChanged = Object.keys(codeByLanguage).some(lang => 
      codeByLanguage[lang] !== lastSavedCode[lang]
    );

    if (hasChanged) {
      setSaveStatus("unsaved");
      
      // Set new timeout for auto-save (5 seconds)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveCode(codeByLanguage);
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [codeByLanguage, autoSaveCode, lastSavedCode]);
  // Cleanup timeout on unmount and handle page unload
  useEffect(() => {
    // Handle page unload to save any pending changes
    const handleBeforeUnload = async (event) => {
      const hasUnsavedChanges = Object.keys(codeByLanguage).some(lang => 
        codeByLanguage[lang] !== lastSavedCode[lang]
      );
      
      if (hasUnsavedChanges && !saveInProgressRef.current) {
        // Try to save immediately (note: may not complete in time)
        try {
          navigator.sendBeacon('/api/v1/compile/saveCode', JSON.stringify({
            problemId: problem._id,
            codeByLanguage,
          }));
        } catch (error) {
          console.warn('Failed to save on page unload:', error);
        }
        
        // Show warning to user
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [codeByLanguage, lastSavedCode, problem._id]);

  useEffect(() => {
    previousLanguageRef.current = language;
  }, [language]);
  const handleLanguageChange = async (newLanguage) => {
    // Save current code before switching languages
    if (saveStatus === 'unsaved' || saveStatus === 'error') {
      try {
        setSaveStatus("saving");
        await axiosInstance.post("/compile/saveCode", {
          problemId: problem._id,
          codeByLanguage,
        });
        setLastSavedCode(codeByLanguage);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Error saving before language switch:", error);
        setSaveStatus("error");
        // Continue with language change even if save fails
      }
    }
    
    setLanguage(newLanguage);
  };

  const handleEditorChange = (value) => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [language]: value,
    }));
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme); // Update theme state
  };  const handleClearResults = () => {
    setResults(null);
    setError(null);
    setApiKeyError(null);
    setActiveTestCaseIndex(0);
  };

  const handleRun = async () => {
    setIsLoading(true);
    setRunLoading(true);
    setResults(null);
    setError(null);
    setApiKeyError(null); // Clear previous API key errors
    setAssignLoading(true); // Start loading

    try {
      const response = await axiosInstance.post("/compiler/run-code", {
        code: codeByLanguage[language],
        language,
        allTestCases: false,
        problemId: problem._id,
      });

      const testResults = response.data.testResults;
      // console.log(testResults)

      // Check if any test case contains an error
      const errorTestCase = testResults.find((test) => test.error);
      if (errorTestCase) {
        setError(errorTestCase.error); // Set the first error encountered
        setResults(null); // Optionally clear results if you don't want partial results
      } else {
        setResults(testResults);
      }
    } catch (error) {
      // Check if this is an API key related error
      if (error.response?.data?.error && [
        'api_keys_required', 
        'no_active_keys', 
        'daily_limit_exceeded',
        'rate_limit_exceeded',
        'api_key_invalid'
      ].includes(error.response.data.error)) {
        setApiKeyError(error.response.data);
      } else {
        setError(
          error.response?.data?.message || 
          error.response?.data?.details || 
          "Failed to run code. Please try again."
        );
      }
    } finally {
      setAssignLoading(false);
      setIsLoading(false);
      setRunLoading(false);
    }
  };

  // const handleSubmit = async () => {
  //   setIsLoading(true);
  //   setSubmitLoading(true);
  //   setResults(null);
  //   setError(null);
  //   setAssignLoading(true); // Start loading

  //   try {
  //     // Prepare data for compilation request
  //     const compilePayload = {
  //       code: codeByLanguage[language],
  //       language,
  //       allTestCases: true, // Ensures backend processes all test cases
  //       problemId: problem._id,
  //     };

  //     // Send code and test cases to the backend for compilation
  //     const compileResponse = await axiosInstance.post(
  //       "/compiler/run-code",
  //       compilePayload
  //     );

  //     let {
  //       testResults,
  //       overallTime,
  //       averageMemory,
  //       allPassed,
  //     } = compileResponse.data;

  //     console.log("Compilation Results:", testResults);
  //     setResults(testResults);

  //     // Check for errors in test results
  //     const errorTestCase = testResults.find((test) => test.error);
  //     if (errorTestCase) {
  //       setError(errorTestCase.error); // Display the first error encountered
  //       console.error("Compilation Error:", errorTestCase.error);
  //       return;
  //     }

  //     overallTime = (overallTime * 1000).toFixed(2); // Now in ms
  //     averageMemory = (averageMemory / 1024).toFixed(2); // Now in MB

  //     console.log(`Overall Time: ${overallTime} ms`);
  //     console.log(`Average Memory: ${averageMemory} MB`);

  //     // Calculate metrics and prepare test case results
  //     const numberOfTestCase = testResults.length;
  //     const numberOfTestCasePass = testResults.filter((test) => test.passed)
  //       .length;
  //     const testCaseResults = testResults.map((test, index) => {
  //       const marks =
  //         test.passed && testcases[index]?.marks ? testcases[index].marks : 0;
  //       return { ...test, marks };
  //     });

  //     const totalMarks = testCaseResults.reduce(
  //       (sum, test) => sum + test.marks,
  //       0
  //     );
  //     const submissionStatus = allPassed ? "completed" : "rejected";

  //     console.log("Number of Test Cases:", numberOfTestCase);
  //     console.log("Number of Test Cases Passed:", numberOfTestCasePass);
  //     console.log("Total Marks Obtained:", totalMarks);
  //     console.log("Submission Status:", submissionStatus);

  //     // Prepare submission payload with time in ms and memory in MB
  //     const submissionPayload = {
  //       user_id: userId,
  //       problem_id: problem._id,
  //       code: codeByLanguage[language],
  //       language,
  //       execution_time: overallTime, // Now in ms
  //       memory_usage: averageMemory, // Now in MB
  //       status: submissionStatus,
  //       numberOfTestCase,
  //       numberOfTestCasePass,
  //       totalMarks,
  //       testCaseResults,
  //     };
  const handleSubmit = async () => {
    setIsLoading(true);
    setSubmitLoading(true);
    setResults(null);
    setError(null);
    setApiKeyError(null); // Clear previous API key errors
    setAssignLoading(true);

    try {
      // Auto-save before submitting to ensure no code is lost
      if (saveStatus === 'unsaved' || saveStatus === 'error') {
        setSaveStatus("saving");
        try {
          await axiosInstance.post("/compile/saveCode", {
            problemId: problem._id,
            codeByLanguage,
          });
          setLastSavedCode(codeByLanguage);
          setSaveStatus("saved");
        } catch (saveError) {
          console.warn("Failed to save before submit:", saveError);
          // Continue with submission even if save fails
        }
      }

      const compilePayload = {
        code: codeByLanguage[language],
        language,
        allTestCases: true, // Ensure all test cases are run
        problemId: problem._id,
      };

      const compileResponse = await axiosInstance.post(
        "/compiler/run-code",
        compilePayload
      );
      const { testResults, savedSubmission } = compileResponse.data;

      // console.log("Compilation Results:", testResults);
      // console.log("Compilation Results:", savedSubmission);

      setResults(testResults);

      if (savedSubmission) {
        // console.log("Submission Saved Successfully:", savedSubmission);
        if (onSubmission) {
          onSubmission(savedSubmission);
          dispatch(fetchHistory({ page: 1, limit: 9 }));
          dispatch(setCurrentPage(1));
          dispatch(fetchSubmissions({ page: 1, limit: 7 }));
        }
      }
    } catch (error) {
      // Check if this is an API key related error
      if (error.response?.data?.error && [
        'api_keys_required', 
        'no_active_keys', 
        'daily_limit_exceeded',
        'rate_limit_exceeded',
        'api_key_invalid'
      ].includes(error.response.data.error)) {
        setApiKeyError(error.response.data);
      } else {
        setError(
          error.response?.data?.message || 
          error.response?.data?.details || 
          "An error occurred. Please try again."
        );
      }
      console.error("Submission Error:", error);
    } finally {
      setIsLoading(false);
      setSubmitLoading(false);
      setAssignLoading(false);
    }
  };
  const handleSaveCode = async () => {
    // Clear auto-save timeout since we're manually saving
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus("saving");
    
    try {
      await axiosInstance.post("/compile/saveCode", {
        problemId: problem._id,
        codeByLanguage,
      });
      
      setLastSavedCode(codeByLanguage);
      setSaveStatus("saved");
      toast.success("Code saved successfully!");
    } catch (error) {
      console.error("Error saving code:", error);
      setSaveStatus("error");
      toast.error("Failed to save code. Please try again.");
    }
  };  return (
    <div className="code-editor bg-gray-900 p-6 shadow-lg">
      {/* API Usage Stats */}
      <ApiUsageStats />

      {/* Language and Score Selector */}
      <ScoreAndLanguageSelector
        language={language}
        handleLanguageChange={handleLanguageChange}
        score={problem.totalMarks}
      />

      {/* Code Editor Area */}
      <CodeEditorArea
        language={language}
        code={codeByLanguage[language] || ""}
        handleEditorChange={handleEditorChange}
        theme={theme}
        handleThemeChange={handleThemeChange}
      />      {/* Test Case Results */}
      <TestCaseResults
        results={results}
        activeTestCaseIndex={activeTestCaseIndex}
        setActiveTestCaseIndex={setActiveTestCaseIndex}
        isLoading={isLoading}
        runLoading={runLoading}
        submitLoading={submitLoading}
        handleRun={handleRun}
        handleSubmit={handleSubmit}
        handleSaveCode={handleSaveCode}
        handleClearResults={handleClearResults}
        error={error}
        apiKeyError={apiKeyError}
        onClearApiKeyError={() => setApiKeyError(null)}
        onGoToProfile={() => navigate('/profile?tab=apikeys')}
        isPastDue={isPastDue}
        saveStatus={saveStatus}
      />

      {/* Custom Test Cases - Collapsible */}
      <div className="mt-6">
        <button
          onClick={() => setIsCustomTestOpen(!isCustomTestOpen)}
          className="flex items-center justify-between w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors duration-200"
        >
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white">Custom Test Cases</h3>
              <p className="text-sm text-gray-400">Test your code with custom inputs</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {isCustomTestOpen ? 'Hide' : 'Show'}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                isCustomTestOpen ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Collapsible Custom Test Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCustomTestOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="pt-4">
            <CustomTestCase 
              language={language}
              code={codeByLanguage[language] || ""}
            />
          </div>
        </div>
      </div>

      {assignLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="text-white text-lg font-semibold">Submitting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
