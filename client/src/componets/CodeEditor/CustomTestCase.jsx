import React, { useState } from "react";
import { Play, Plus, X, Terminal, Clock, HardDrive, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";

const CustomTestCase = ({ language, code }) => {
  const [customTests, setCustomTests] = useState([{ id: 1, input: "", output: "", isRunning: false, result: null }]);
  const [nextId, setNextId] = useState(2);

  const addCustomTest = () => {
    const newTest = {
      id: nextId,
      input: "",
      output: "",
      isRunning: false,
      result: null
    };
    setCustomTests([...customTests, newTest]);
    setNextId(nextId + 1);
  };

  const removeCustomTest = (id) => {
    if (customTests.length > 1) {
      setCustomTests(customTests.filter(test => test.id !== id));
    }
  };

  const updateTestInput = (id, input) => {
    setCustomTests(customTests.map(test => 
      test.id === id ? { ...test, input } : test
    ));
  };

  const runCustomTest = async (testId) => {
    if (!code?.trim()) {
      alert("Please write some code first!");
      return;
    }

    const test = customTests.find(t => t.id === testId);
    if (!test) return;

    // Set loading state
    setCustomTests(customTests.map(t => 
      t.id === testId ? { ...t, isRunning: true, result: null } : t
    ));

    try {
      const response = await axiosInstance.post("/compiler/custom-test", {
        code: code,
        language: language,
        input: test.input
      });

      if (response.data.success) {
        setCustomTests(customTests.map(t => 
          t.id === testId ? { 
            ...t, 
            isRunning: false, 
            result: response.data.result,
            output: response.data.result.stdout || response.data.result.error || "No output"
          } : t
        ));
      } else {
        throw new Error(response.data.message || "Failed to run custom test");
      }
    } catch (error) {
      console.error("Custom test error:", error);
      setCustomTests(customTests.map(t => 
        t.id === testId ? { 
          ...t, 
          isRunning: false, 
          result: null,
          output: error.response?.data?.message || error.message || "An error occurred"
        } : t
      ));
    }
  };

  const getStatusIcon = (result) => {
    if (!result) return null;
    
    if (result.error) {
      return <XCircle className="text-red-500" size={16} />;
    } else if (result.status?.id === 3) { // Accepted
      return <CheckCircle className="text-green-500" size={16} />;
    } else {
      return <XCircle className="text-yellow-500" size={16} />;
    }
  };

  const getStatusText = (result) => {
    if (!result) return "";
    
    if (result.error) {
      return "Error";
    } else if (result.status?.id === 3) {
      return "Success";
    } else {
      return result.status?.description || "Unknown";
    }
  };
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="text-blue-400" size={18} />
          <h4 className="text-md font-medium text-white">Test Cases</h4>
        </div>
        <button
          onClick={addCustomTest}
          className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
        >
          <Plus size={14} className="mr-1" />
          Add Test
        </button>
      </div>      <div className="space-y-3">
        {customTests.map((test, index) => (
          <div key={test.id} className="bg-gray-900 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-white">Test Case {index + 1}</h5>
              <div className="flex items-center space-x-2">
                {test.result && (
                  <div className="flex items-center space-x-1 text-xs">
                    {getStatusIcon(test.result)}
                    <span className={`${
                      test.result.error ? 'text-red-400' :
                      test.result.status?.id === 3 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {getStatusText(test.result)}
                    </span>
                    {test.result.time && (
                      <span className="text-gray-400 ml-1 flex items-center">
                        <Clock size={10} className="mr-0.5" />
                        {test.result.time}s
                      </span>
                    )}
                    {test.result.memory && (
                      <span className="text-gray-400 ml-1 flex items-center">
                        <HardDrive size={10} className="mr-0.5" />
                        {(test.result.memory / 1024).toFixed(1)}MB
                      </span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => runCustomTest(test.id)}
                  disabled={test.isRunning}
                  className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                    test.isRunning 
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Play size={12} className="mr-1" />
                  {test.isRunning ? "Running..." : "Run"}
                </button>
                {customTests.length > 1 && (
                  <button
                    onClick={() => removeCustomTest(test.id)}
                    className="flex items-center px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Input Section */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Input:
                </label>
                <textarea
                  value={test.input}
                  onChange={(e) => updateTestInput(test.id, e.target.value)}
                  placeholder="Enter your custom input here..."
                  className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Output Section */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Output:
                </label>
                <div className="w-full h-24 p-2 bg-gray-700 border border-gray-600 rounded text-white text-xs font-mono overflow-auto">
                  {test.isRunning ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-400 text-xs">Running...</span>
                    </div>
                  ) : test.output ? (
                    <pre className="whitespace-pre-wrap text-xs">
                      {test.result?.error ? (
                        <span className="text-red-400">{test.output}</span>
                      ) : (
                        <span className="text-green-400">{test.output}</span>
                      )}
                    </pre>
                  ) : (
                    <span className="text-gray-500 italic text-xs">No output yet. Click 'Run' to execute.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>      <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800/30 rounded">
        <p className="text-xs text-blue-200">
          <strong>💡 Tip:</strong> Use custom test cases to debug your code with specific inputs before submitting.
        </p>
      </div>
    </div>
  );
};

export default CustomTestCase;
