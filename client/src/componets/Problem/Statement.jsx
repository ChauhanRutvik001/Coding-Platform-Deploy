import React, { useEffect } from "react";
import toast from "react-hot-toast"; // Add this import

const Statement = ({ problem }) => {
  // Log problem structure for debugging - you can remove this later
  useEffect(() => {
    console.log("Problem object structure:", Object.keys(problem));
    console.log("Sample data available:", problem.sampleIO || problem.samples || problem.testCases);
  }, [problem]);

  // This function checks for sample data in various possible locations
  const getSamples = () => {
    // Check if problem has the sampleIO array (the one you're currently using)
    if (problem.sampleIO && problem.sampleIO.length > 0) {
      return problem.sampleIO;
    }
    
    // Check if problem has a samples array (possible format for students)
    if (problem.samples && problem.samples.length > 0) {
      return problem.samples;
    }
    
    // Check if problem has testCases that should be visible to students
    if (problem.testCases && problem.testCases.length > 0) {
      // Sometimes test cases have a "public" or "isPublic" flag to determine visibility
      const publicTestCases = problem.testCases.filter(tc => 
        tc.isPublic !== false && tc.public !== false
      );
      if (publicTestCases.length > 0) {
        return publicTestCases;
      }
    }
    
    // Check if sample data is directly in the problem object
    if (problem.sampleInput && problem.sampleOutput) {
      // Create a sample array with the individual fields
      return [{
        input: problem.sampleInput,
        output: problem.sampleOutput
      }];
    }
    
    // No sample data found
    return [];
  };

  // Get samples using our flexible function
  const samples = getSamples();

  return (
    <div className="p-4 sm:p-6 md:p-8">
    
      <p className="whitespace-pre-wrap leading-7 tracking-wide text-gray-300 text-sm sm:text-base text-justify">
        {problem.description}
      </p>

      <p className="mt-4 flex flex-wrap items-center">
        <strong className="text-base sm:text-lg text-white">Difficulty:</strong>
        <span
          className={`ml-3 px-3 py-2 text-sm sm:text-base text-white font-semibold rounded-lg shadow-md ${
            problem.difficulty === "easy"
              ? "bg-green-600"
              : problem.difficulty === "medium"
              ? "bg-yellow-600"
              : "bg-red-600"
          }`}
        >
          {problem.difficulty.charAt(0).toUpperCase() +
            problem.difficulty.slice(1)}
        </span>
      </p>

      <div className="mt-5">
        <h3 className="font-bold text-base sm:text-lg text-white">
          Input Format:
        </h3>
        <p className="whitespace-pre-wrap m-2 bg-gray-800 p-4 rounded-md shadow-sm text-gray-300 text-sm sm:text-base">
          {problem.inputFormat}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="font-bold text-base sm:text-lg text-white">
          Output Format:
        </h3>
        <p className="whitespace-pre-wrap m-2 bg-gray-800 p-4 rounded-md shadow-sm text-gray-300 text-sm sm:text-base">
          {problem.outputFormat}
        </p>
      </div>

      <div className="mt-5">
        <h3 className="font-bold text-base sm:text-lg text-white">
          Constraints:
        </h3>
        <p className="whitespace-pre-wrap m-2 bg-gray-800 p-4 rounded-md shadow-sm text-gray-300 text-sm sm:text-base">
          {problem.constraints}
        </p>
      </div>

      {/* Changed to use our samples variable instead of checking problem.sampleIO directly */}
      {samples && samples.length > 0 && (
        <div className="m-2">
          <h3 className="font-bold mb-3 mt-5 text-base sm:text-lg text-white">
            Sample Input/Output:
          </h3>
          {samples.map((sample, index) => (
            <div
              key={index}
              className="mb-4 bg-gray-700 p-4 rounded-lg shadow-lg"
            >
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-bold text-sm sm:text-base">
                    Input {index + 1}:
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sample.input);
                      toast.success("Input copied!");
                    }}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
                <pre className="block bg-gray-800 p-4 rounded-md text-gray-300 text-sm sm:text-base shadow-sm overflow-x-auto">
                  {sample.input}
                </pre>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-bold text-sm sm:text-base">
                    Output {index + 1}:
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sample.output);
                      toast.success("Output copied!");
                    }}
                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
                <pre className="block bg-gray-800 p-4 rounded-md text-gray-300 text-sm sm:text-base shadow-sm overflow-x-auto">
                  {sample.output}
                </pre>
              </div>
              
              {/* Add explanation if available */}
              {sample.explanation && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-yellow-400 font-bold text-sm sm:text-base mb-2">
                    Explanation:
                  </p>
                  <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap">
                    {sample.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Statement;
