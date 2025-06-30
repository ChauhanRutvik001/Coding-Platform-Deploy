
/**
 * CODE COMPILATION AND EXECUTION ROUTES
 * 
 * This file contains routes for code compilation and execution using Judge0 API.
 * Routes handle code submission, testing against problem test cases, and submission creation.
 * 
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 * 
 * BASE PATH: /api/v1/compiler
 * 
 * FEATURES:
 * - Rate limiting per user (20 requests per minute)
 * - Queue management for concurrent submissions
 * - Judge0 API integration with RapidAPI
 * - Base64 encoding/decoding for code and test data
 * - Comprehensive error handling with retry logic
 * - Test case execution and result comparison
 * - Automatic submission creation for full test runs
 */

import express from "express";
import axios from "axios";
import problem from "../models/problem.js";
import submission from "../models/submission.js";
import User from "../models/user.js";
import AdminApiKey from "../models/adminApiKeys.js";
import SystemSettings from "../models/systemSettings.js";
import { isAuthorized } from "../middlewares/auth.js";
// We'll dynamically import batch model when needed to avoid circular dependencies

const router = express.Router();

// Update Judge0 API base URL and token to use RapidAPI
const JUDGE0_BASE_URL = "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = "dbe32c7301msha8dfc9660bdf2bfp1bf391jsn29d2b4dbdae2"; // Fallback system key

// Function to get available admin API key
const getAdminApiKey = async () => {
  try {
    const adminKeys = await AdminApiKey.find();
    if (!adminKeys || adminKeys.length === 0) {
      return { 
        error: 'NO_ADMIN_KEYS',
        message: 'No admin API keys configured. Please add admin API keys.',
        key: null 
      };
    }

    // Reset daily usage if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let needsUpdate = false;
    adminKeys.forEach(apiKey => {
      const lastReset = new Date(apiKey.lastResetDate);
      lastReset.setHours(0, 0, 0, 0);
      
      if (today > lastReset) {
        apiKey.dailyUsage = 0;
        apiKey.lastResetDate = new Date();
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      await Promise.all(adminKeys.map(key => key.save()));
    }

    // Find an active API key with available quota
    const availableKeys = adminKeys.filter(
      key => key.isActive && key.dailyUsage < key.dailyLimit
    );

    if (availableKeys.length === 0) {
      const activeKeys = adminKeys.filter(k => k.isActive);
      
      console.log(`⚠️ No available admin API keys:`, {
        totalKeys: adminKeys.length,
        activeKeys: activeKeys.length,
      });

      if (activeKeys.length === 0) {
        return {
          error: 'NO_ACTIVE_ADMIN_KEYS',
          message: 'All admin API keys are inactive.',
          key: null
        };
      } else {
        return {
          error: 'ADMIN_LIMIT_EXCEEDED',
          message: 'All admin API keys have reached their daily limit.',
          key: null
        };
      }
    }

    // Select key with lowest usage (load balancing)
    const selectedKey = availableKeys.reduce((min, key) => 
      key.dailyUsage < min.dailyUsage ? key : min
    );

    console.log(`🎯 Selected admin API key:`, {
      keyName: selectedKey.name,
      usage: `${selectedKey.dailyUsage}/${selectedKey.dailyLimit}`,
      availableKeys: availableKeys.length
    });    return {
      error: null,
      key: selectedKey.key,
      keyId: selectedKey._id,
      keyName: selectedKey.name,
      usage: `${selectedKey.dailyUsage}/${selectedKey.dailyLimit}`,
      isAdminKey: true
    };
  } catch (error) {
    console.error("Error getting admin API key:", error);
    return {
      error: 'SYSTEM_ERROR',
      message: 'Failed to check admin API key availability.',
      key: null
    };
  }
};

// Function to check if admin API keys should be used
const shouldUseAdminKeys = async () => {
  try {
    const setting = await SystemSettings.findOne({ settingName: 'useAdminApiKeys' });
    return setting ? Boolean(setting.settingValue) : false;
  } catch (error) {
    console.error("Error checking admin API key mode:", error);
    return false;
  }
};

// Function to get API key (either admin or user based on system setting)
const getApiKey = async (userId) => {
  try {
    const useAdminKeys = await shouldUseAdminKeys();
    
    if (useAdminKeys) {
      console.log(`🔧 Using admin API keys for user ${userId}`);
      return await getAdminApiKey();
    } else {
      console.log(`👤 Using user API keys for user ${userId}`);
      return await getUserApiKey(userId);
    }
  } catch (error) {
    console.error("Error determining API key source:", error);
    return {
      error: 'SYSTEM_ERROR',
      message: 'Failed to determine API key source.',
      key: null
    };
  }
};

// Function to get available user API key with detailed error information
const getUserApiKey = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.apiKeys || user.apiKeys.length === 0) {
      return { 
        error: 'NO_API_KEYS',
        message: 'No Judge0 API keys found. Please add your API keys in your profile to run code.',
        key: null 
      };
    }

    // Reset daily usage if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let needsUpdate = false;
    user.apiKeys.forEach(apiKey => {
      const lastReset = new Date(apiKey.lastResetDate);
      lastReset.setHours(0, 0, 0, 0);
      
      if (today > lastReset) {
        apiKey.dailyUsage = 0;
        apiKey.lastResetDate = new Date();
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      await user.save();
    }

    // Find an active API key with available quota
    const availableKeys = user.apiKeys.filter(
      key => key.isActive && key.dailyUsage < key.dailyLimit
    );

    if (availableKeys.length === 0) {
      const activeKeys = user.apiKeys.filter(k => k.isActive);
      const exhaustedKeys = user.apiKeys.filter(k => k.dailyUsage >= k.dailyLimit);
      
      console.log(`⚠️ No available user API keys for user ${userId}:`, {
        totalKeys: user.apiKeys.length,
        activeKeys: activeKeys.length,
        exhaustedKeys: exhaustedKeys.length
      });

      if (activeKeys.length === 0) {
        return {
          error: 'NO_ACTIVE_KEYS',
          message: 'All your API keys are inactive. Please activate at least one API key in your profile.',
          key: null
        };
      } else {
        const keyUsageInfo = activeKeys.map(key => ({
          name: key.name,
          usage: `${key.dailyUsage}/${key.dailyLimit}`,
          remaining: key.dailyLimit - key.dailyUsage
        }));

        return {
          error: 'LIMIT_EXCEEDED',
          message: 'All your API keys have reached their daily limit. Please wait until tomorrow or add more API keys.',
          keyUsageInfo,
          key: null
        };
      }
    }

    // Select key with lowest usage (load balancing)
    const selectedKey = availableKeys.reduce((min, key) => 
      key.dailyUsage < min.dailyUsage ? key : min
    );

    console.log(`🎯 Selected API key with lowest usage:`, {
      keyName: selectedKey.name,
      usage: `${selectedKey.dailyUsage}/${selectedKey.dailyLimit}`,
      availableKeys: availableKeys.length
    });    return {
      error: null,
      key: selectedKey.key,
      keyId: selectedKey._id,
      userId: userId,
      keyName: selectedKey.name,
      usage: `${selectedKey.dailyUsage}/${selectedKey.dailyLimit}`
    };
  } catch (error) {
    console.error("Error getting user API key:", error);
    return {
      error: 'SYSTEM_ERROR',
      message: 'Failed to check API key availability. Please try again.',
      key: null
    };
  }
};

// Function to increment API key usage
const incrementApiKeyUsage = async (userId, keyId, isAdminKey = false) => {
  try {
    if (isAdminKey) {
      // Increment admin API key usage
      const adminKey = await AdminApiKey.findById(keyId);
      if (adminKey) {
        adminKey.dailyUsage += 1;
        await adminKey.save();
        console.log(`📈 Incremented admin API key usage: ${adminKey.name} (${adminKey.dailyUsage}/${adminKey.dailyLimit})`);
      }
    } else {
      // Increment user API key usage
      const user = await User.findById(userId);
      if (user && keyId) {
        const apiKey = user.apiKeys.id(keyId);
        if (apiKey) {
          apiKey.dailyUsage += 1;
          await user.save();
          console.log(`📈 Incremented user API key usage: ${apiKey.name} (${apiKey.dailyUsage}/${apiKey.dailyLimit})`);
        }
      }
    }
  } catch (error) {
    console.error("Error incrementing API key usage:", error);
  }
};

const getLanguageId = (language) => {
  const languageMap = {
    python: 71,
    cpp: 54,
    java: 62,
    javascript: 63,
  };
  return languageMap[language] || null;
};

const decodeBase64 = (base64Str) => {
  if (!base64Str) return "";
  const buffer = Buffer.from(base64Str, "base64");
  return buffer.toString("utf-8");
};

const encodeToBase64 = (str) => {
  return Buffer.from(str, "utf-8").toString("base64");
};

const normalizeOutput = (output) => {
  if (!output || typeof output !== "string") {
    return ""; // Return an empty string if output is not valid
  }
  return output
    .replace(/\r\n/g, "\n") // Normalize line breaks first
    .trim(); // Trim the output
};

const logServerInstance = (response, requestType) => {
  const instance = response.headers["x-server-instance"];
  console.log(`${requestType} handled by instance:`, instance);
  console.log("Response status:", response.status);
};

// Add a simple request counter for basic load monitoring
let requestCounter = 0;

// Add queue monitoring
const queueStatus = {
  pending: 0,
  processing: 0,
};

// Add rate limiting configuration
const userSubmissionLimits = {
  windowMs: 60000, // 1 minute
  maxRequests: 20, // max requests per minute per user
};
const userSubmissionCounts = new Map();

// Add this function to manage rate limiting
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userCount = userSubmissionCounts.get(userId) || {
    count: 0,
    timestamp: now,
  };

  if (now - userCount.timestamp > userSubmissionLimits.windowMs) {
    // Reset if window has passed
    userCount.count = 1;
    userCount.timestamp = now;
  } else if (userCount.count >= userSubmissionLimits.maxRequests) { // Fixed typo: maxRequits -> maxRequests
    return false; // Rate limit exceeded
  } else {
    userCount.count++;
  }

  userSubmissionCounts.set(userId, userCount);
  return true;
};

/**
 * POST /compiler/run-code
 * Execute code against problem test cases using Judge0 API
 * 
 * FEATURES:
 * - Rate limiting: 20 requests per minute per user
 * - Queue management for concurrent submissions
 * - Support for multiple programming languages (Python, C++, Java, JavaScript)
 * - Test case execution with hidden/visible test case filtering
 * - Full submission creation when allTestCases=true
 * - Comprehensive error handling and retry logic
 * - Performance metrics tracking (time, memory usage)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - CodeEditor/CodeEditor.jsx (line 95) - Main code execution for testing
 * - CodeEditor/CodeEditor.jsx (line 142) - Commented alternative execution
 * - CodeEditor/CodeEditor.jsx (line 249) - Code submission for full evaluation
 * 
 * REQUEST BODY:
 * - code: Source code to execute
 * - language: Programming language (python, cpp, java, javascript)
 * - allTestCases: Boolean - if true, runs all test cases and creates submission
 * - problemId: ID of the problem containing test cases
 * 
 * RESPONSE:
 * - testResults: Array of test case results with pass/fail status
 * - overallTime: Total execution time in milliseconds
 * - averageMemory: Average memory usage in MB
 * - totalMarks: Total marks obtained from passed test cases
 * - submissionStatus: "completed" or "rejected"
 * - submissionId: ID of created submission (when allTestCases=true)
 */
router.post("/run-code", isAuthorized, async (req, res) => {
  const { code, language, allTestCases, problemId } = req.body;
  const userId = req.user?.id;

  // Check rate limit
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      message: "Too many submissions. Please wait before trying again.",
    });
  }
  
  // Check due date if this is a submission (allTestCases true)
  if (allTestCases && problemId) {
    try {
      const problemData = await problem.findById(problemId);
      if (problemData && problemData.dueDate) {
        const now = new Date();
        const dueDate = new Date(problemData.dueDate);
        
        if (now > dueDate) {
          return res.status(403).json({
            success: false,
            message: "Submission deadline has passed. You can no longer submit solutions for this problem.",
          });
        }
      }
    } catch (err) {
      console.error("Error checking problem due date:", err);
      // Continue execution even if there's an error checking the due date
    }
  }

  // Increment queue counter
  queueStatus.pending++;
  requestCounter = (requestCounter + 1) % Number.MAX_SAFE_INTEGER;

  try {
    console.log(req.body);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!code || !language || !problemId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Missing required fields.",
      });
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language.",
      });
    }

    const problemData = await problem.findById(problemId).select("testCases");

    if (
      !problemData ||
      !problemData.testCases ||
      problemData.testCases.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No test cases found for the given problem ID.",
      });
    }

    let selectedTestCases;

    if (!allTestCases) {
      selectedTestCases = problemData.testCases.filter(
        (testCase) => !testCase.is_hidden
      );
    } else {
      selectedTestCases = problemData.testCases; // Run all test cases during submission
    }

    if (selectedTestCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No visible test cases available for execution.",
      });
    }

    // Ensure source code is properly encoded before submission
    const submissions = selectedTestCases.map((testCase) => ({
      source_code: encodeToBase64(code), // Encode source code to base64
      language_id: languageId,
      stdin: encodeToBase64(testCase.inputs || ""), // Encode stdin to base64
      expected_output: encodeToBase64(testCase.outputs || ""), // Encode expected output to base64
      cpu_time_limit: testCase.cpu_time_limit || 2, // Default to 2 seconds if not provided
      memory_limit: testCase.memory_limit * 1024 || 128 * 1024, // Default to 128 MB if not provided
    }));    // Add request tracking
    console.log(`Processing request #${requestCounter} for user ${userId}`);
    queueStatus.pending--;
    queueStatus.processing++;    // Get API key (either admin or user based on system setting)
    const userApiResult = await getApiKey(userId);
    
    // Check for API key errors and return appropriate error responses
    if (userApiResult.error) {
      queueStatus.processing--;
      
      let errorCode;
      let errorResponse = {
        success: false,
        error: userApiResult.error.toLowerCase(),
        message: userApiResult.message
      };

      switch (userApiResult.error) {
        case 'NO_API_KEYS':
          errorCode = 'api_keys_required';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Keys Required';
          errorResponse.description = 'You need to add Judge0 API keys to run code.';
          errorResponse.actionText = 'Add API Keys';
          break;
          
        case 'NO_ACTIVE_KEYS':
          errorCode = 'no_active_keys';
          errorResponse.error = errorCode;
          errorResponse.title = 'No Active API Keys';
          errorResponse.description = 'All your API keys are inactive. Please activate at least one.';
          errorResponse.actionText = 'Manage API Keys';
          break;
          
        case 'LIMIT_EXCEEDED':
          errorCode = 'daily_limit_exceeded';
          errorResponse.error = errorCode;
          errorResponse.title = 'Daily Limit Exceeded';
          errorResponse.description = 'All your API keys have reached their daily limit.';
          errorResponse.actionText = 'Add More Keys';
          errorResponse.keyUsageInfo = userApiResult.keyUsageInfo;
          break;
          
        default:
          errorCode = 'api_key_invalid';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Key Error';
          errorResponse.description = 'There was an issue with your API keys.';
          errorResponse.actionText = 'Check API Keys';
          break;
      }
      
      console.log(`❌ API key requirement not met for user ${userId}: ${errorCode}`);
      return res.status(403).json(errorResponse);
    }

    // User has valid API key - proceed with execution
    const apiKeyToUse = userApiResult.key;
    const userKeyInfo = {
      keyId: userApiResult.keyId,
      userId: userApiResult.userId,
      keyName: userApiResult.keyName,
      usage: userApiResult.usage
    };
    
    console.log(`✅ Using ${userApiResult.isAdminKey ? 'admin' : 'user'} API key: ${userKeyInfo.keyName} (${userKeyInfo.usage})`);

    // Update headers in API calls to use RapidAPI
    const submitToJudge0 = async (submission, retryCount = 3) => {
      for (let i = 0; i < retryCount; i++) {
        try {
          const response = await axios.post(
            `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false&fields=*`,
            submission,
            {
              headers: {
                "Content-Type": "application/json",
                "x-rapidapi-host": JUDGE0_API_HOST,
                "x-rapidapi-key": apiKeyToUse,
                "X-Request-ID": `${userId}-${requestCounter}-${i}`,
              },
              timeout: 10000, // 10 second timeout
            }          );
            // Increment usage count for the appropriate API key type
          await incrementApiKeyUsage(userKeyInfo.userId, userKeyInfo.keyId, userApiResult.isAdminKey);

          logServerInstance(response, "Submission");
          return response;
        } catch (error) {
          console.error(`Submission attempt ${i + 1} failed:`, error.message);
          if (i === retryCount - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    };    // Modify your results fetching to include better error handling
    const fetchResults = async (token) => {
      let result = null;
      let retries = 0;
      const maxRetries = 5;
      const maxWaitTime = 30000; // 30 seconds maximum wait time
      const startTime = Date.now();

      while (!result || result.status.id <= 2) {
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error("Execution time exceeded maximum wait time");
        }

        try {
          const response = await axios.get(
            `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true&fields=*`,
            {
              headers: {
                "x-rapidapi-host": JUDGE0_API_HOST,
                "x-rapidapi-key": apiKeyToUse,
                "X-Request-ID": `${userId}-${requestCounter}-result-${retries}`,
              },
            }
          );

          result = response.data;
          logServerInstance(response, "Status Check");

          if (result.status.id <= 2 && retries < maxRetries) {
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            continue;
          }

          break;
        } catch (error) {
          console.error(`Result fetch attempt ${retries + 1} failed:`, error.message);
          if (retries >= maxRetries) throw error;
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }

      return {
        ...result,
        compilationError: result.compile_output
          ? decodeBase64(result.compile_output)
          : null,
        standardError: result.stderr ? decodeBase64(result.stderr) : null,
        error: result.status.id === 5 ? "Time Limit Exceeded" : null,
      };
    };

    // Send code to Judge0 API
    const submissionResponses = await Promise.all(
      submissions.map((submission) => submitToJudge0(submission))
    );

    const tokens = submissionResponses.map((response) => response.data.token);

    // Fetch execution results
    const results = await Promise.all(tokens.map(fetchResults));

    // Process test results
    const testResults = results.map((result, index) => {
      const decodedOutput = decodeBase64(result.stdout?.trim() || "");
      const normalizedOutput = normalizeOutput(decodedOutput);
      const expectedOutput = normalizeOutput(
        selectedTestCases[index]?.outputs || ""
      );

      return {
        input: selectedTestCases[index]?.inputs || "",
        expectedOutput: selectedTestCases[index]?.outputs || "",
        output: decodedOutput,
        error: result.error || result.compilationError || result.standardError,
        passed: normalizedOutput === expectedOutput && !result.error,
        time: result.time,
        memory: result.memory,
      };
    });

    console.log("Test Results:", testResults);

    // Compute performance metrics
    const overallTime =
      testResults.reduce((sum, test) => sum + parseFloat(test.time || 0), 0) *
      1000; // Convert to ms
    const averageMemory =
      testResults.length > 0
        ? testResults.reduce(
            (sum, test) => sum + parseInt(test.memory || 0),
            0
          ) / testResults.length
        : 0;

    const numberOfTestCase = testResults.length;
    const numberOfTestCasePass = testResults.filter((test) => test.passed)
      .length;

    // Calculate marks for each test case
    const testCaseResults = testResults.map((test, index) => ({
      input: test.input,
      expectedOutput: test.expectedOutput,
      output: test.output,
      error: test.error,
      passed: test.passed,
      time: test.time,
      memory: test.memory,
      is_hidden: selectedTestCases[index]?.is_hidden || false,
      marks:
        test.passed && selectedTestCases[index]?.marks
          ? selectedTestCases[index].marks
          : 0,
    }));

    const totalMarks = testCaseResults.reduce(
      (sum, test) => sum + test.marks,
      0
    );
    const submissionStatus =
      numberOfTestCase === numberOfTestCasePass ? "completed" : "rejected";

    console.log("Submission Metrics:");
    console.log("Total Test Cases:", numberOfTestCase);
    console.log("Passed Test Cases:", numberOfTestCasePass);
    console.log("Total Marks Obtained:", totalMarks);
    console.log("Submission Status:", submissionStatus);    // Save the submission only if all test cases were run
    let savedSubmission = null;
    if (allTestCases) {
      try {
        // Find the problem to check if it exists and get assigned batches
        const problemData = await problem.findById(problemId);
        if (!problemData) {
          throw new Error("Problem not found");
        }
        
        // Find the batch this student belongs to that's assigned to this problem
        const Batch = await import("../models/batch.js").then(m => m.default);
        const batches = await Batch.find({
          students: userId,
          _id: { $in: problemData.assignedBatches }
        });
        
        const submissionPayload = {
          user_id: userId,
          problem_id: problemId,
          batch_id: batches.length > 0 ? batches[0]._id : null, // Use first matching batch if found
          code,
          language,
          status: submissionStatus,
          execution_time: overallTime.toFixed(2),
          memory_usage: (averageMemory / 1024).toFixed(2), // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults, // Store full test cases data in DB
        };

        const submissionResponse = await submission.create(submissionPayload);
        savedSubmission = submissionResponse;
      } catch (error) {
        console.error("Error creating submission with batch_id:", error);
        // Create submission without batch_id as fallback
        const submissionPayload = {
          user_id: userId,
          problem_id: problemId,
          code,
          language,
          status: submissionStatus,
          execution_time: overallTime.toFixed(2),
          memory_usage: (averageMemory / 1024).toFixed(2), // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults, // Store full test cases data in DB
        };

        const submissionResponse = await submission.create(submissionPayload);
        savedSubmission = submissionResponse;
      }
    }

    // Mask test case details except for the first one in the response
    res.json({
      success: true,
      testResults: testResults.map((test, index) => ({
        input: selectedTestCases[index].is_hidden ? "******" : test.input,
        expectedOutput: selectedTestCases[index].is_hidden
          ? "******"
          : test.expectedOutput,
        output: selectedTestCases[index].is_hidden ? "******" : test.output,
        error: test.error,
        passed: test.passed,
        time: test.time,
        memory: test.memory,
        marks: test.marks,
      })),
      overallTime: overallTime.toFixed(2),
      averageMemory: (averageMemory / 1024).toFixed(2), // Convert to MB
      allPassed: testResults.every((test) => test.passed),
      savedSubmission: savedSubmission
        ? {
            ...savedSubmission._doc,
            testCaseResults: savedSubmission.testCaseResults.map(
              (test, index) => ({
                input: test.is_hidden ? "******" : test.input,
                expectedOutput: test.is_hidden ? "******" : test.expectedOutput,
                output: test.is_hidden ? "******" : test.output,
                error: test.error,
                passed: test.passed,
                time: test.time,
                memory: test.memory,
                marks: test.marks,
              })
            ),
          }
        : null,
      queueStatus,
    });

    // Update queue status after processing
    queueStatus.processing--;  } catch (error) {
    // Update queue status on error
    queueStatus.processing--;

    console.error("Error during execution:", error);
    
    // Handle specific API key related errors
    let errorResponse = {
      success: false,
      message: "An error occurred while processing the code.",
      error: error.message || error,
      queueStatus,
    };

    // Check for RapidAPI/Judge0 specific errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 429) {
        errorResponse.error = 'rate_limit_exceeded';
        errorResponse.title = 'Rate Limit Exceeded';
        errorResponse.message = 'Your API key has exceeded its rate limit. Please wait or add more API keys.';
        errorResponse.description = 'The API key has too many requests in a short time period.';
        errorResponse.actionText = 'Add More Keys';
      } else if (status === 401 || status === 403) {
        errorResponse.error = 'api_key_invalid';
        errorResponse.title = 'Invalid API Key';
        errorResponse.message = 'Your API key is invalid or has been deactivated.';
        errorResponse.description = 'Please check your API key configuration in your profile.';
        errorResponse.actionText = 'Update API Key';
      } else if (errorData && errorData.error) {
        // Handle other Judge0 specific errors
        errorResponse.message = errorData.error;
      }
    }

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

/**
 * POST /compiler/compileandrun
 * Simple code compilation and execution endpoint
 * Provides detailed error handling for API key scenarios
 * 
 * REQUEST BODY:
 * - code: Source code to execute
 * - input: Input data for the program
 * - lang: Language ID for Judge0 API
 * 
 * RESPONSE:
 * - output: Program output (if successful)
 * - error: Compilation or runtime errors
 * - status: Execution status
 * - keyUsed: Which API key was used (user key name or 'system')
 * - remainingQuota: Usage information for the API key
 */
router.post("/compileandrun", isAuthorized, async (req, res) => {
  try {
    const { code, input, lang } = req.body;
    const userId = req.user.id;    console.log("🚀 Compile and run request:", { userId, lang });

    // Get API key (either admin or user based on system setting)
    const userApiResult = await getApiKey(userId);
    
    // Check for API key errors and return appropriate error responses
    if (userApiResult.error) {
      let errorCode;
      let errorResponse = {
        success: false,
        error: userApiResult.error.toLowerCase(),
        message: userApiResult.message
      };

      switch (userApiResult.error) {
        case 'NO_API_KEYS':
          errorCode = 'api_keys_required';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Keys Required';
          errorResponse.description = 'You need to add Judge0 API keys to run code.';
          errorResponse.actionText = 'Add API Keys';
          break;
          
        case 'NO_ACTIVE_KEYS':
          errorCode = 'no_active_keys';
          errorResponse.error = errorCode;
          errorResponse.title = 'No Active API Keys';
          errorResponse.description = 'All your API keys are inactive. Please activate at least one.';
          errorResponse.actionText = 'Manage API Keys';
          break;
          
        case 'LIMIT_EXCEEDED':
          errorCode = 'daily_limit_exceeded';
          errorResponse.error = errorCode;
          errorResponse.title = 'Daily Limit Exceeded';
          errorResponse.description = 'All your API keys have reached their daily limit.';
          errorResponse.actionText = 'Add More Keys';
          errorResponse.keyUsageInfo = userApiResult.keyUsageInfo;
          break;
          
        default:
          errorCode = 'api_key_invalid';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Key Error';
          errorResponse.description = 'There was an issue with your API keys.';
          errorResponse.actionText = 'Check API Keys';
          break;
      }
      
      console.log(`❌ API key requirement not met for user ${userId}: ${errorCode}`);
      return res.status(403).json(errorResponse);
    }

    // User has valid API key - proceed with execution
    const apiKey = userApiResult.key;
    const keyInfo = {
      keyId: userApiResult.keyId,
      userId: userApiResult.userId,
      keyName: userApiResult.keyName,
      usage: userApiResult.usage
    };
    
    console.log(`✅ Using user API key: ${keyInfo.keyName} (${keyInfo.usage})`);

    const url = `https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true`;
    const data = {
      language_id: lang,
      source_code: Buffer.from(code).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
    };

    const options = {
      method: "POST",
      url: url,
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      data: data,
    };    console.log(`📡 Making Judge0 API request with ${userApiResult.isAdminKey ? 'admin' : 'user'} API key: ${keyInfo.keyName}`);
    const response = await axios.request(options);

    // Increment usage for the appropriate API key type
    await incrementApiKeyUsage(keyInfo.userId, keyInfo.keyId, userApiResult.isAdminKey);

    // Format the response
    const result = {
      output: response.data.stdout ? atob(response.data.stdout) : null,
      error: response.data.stderr ? atob(response.data.stderr) : null,
      compile_output: response.data.compile_output ? atob(response.data.compile_output) : null,
      status: response.data.status?.description || "Unknown",
      keyUsed: keyInfo.keyName,
      remainingQuota: keyInfo.usage
    };

    console.log("✅ Compilation successful:", { 
      status: result.status, 
      keyUsed: result.keyUsed,
      hasOutput: !!result.output,
      hasError: !!result.error 
    });

    res.json(result);  } catch (error) {
    console.error("❌ Compilation error:", error.response?.data || error.message);
    
    // Handle specific API key related errors
    let errorResponse = {
      error: 'compilation_failed',
      message: 'Failed to compile and run the code.',
      details: error.response?.data?.error || error.message
    };

    // Check for RapidAPI/Judge0 specific errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 429) {
        errorResponse.error = 'rate_limit_exceeded';
        errorResponse.title = 'Rate Limit Exceeded';
        errorResponse.message = 'Your API key has exceeded its rate limit. Please wait or add more API keys.';
        errorResponse.description = 'The API key has too many requests in a short time period.';
        errorResponse.actionText = 'Add More Keys';
      } else if (status === 401 || status === 403) {
        errorResponse.error = 'api_key_invalid';
        errorResponse.title = 'Invalid API Key';
        errorResponse.message = 'Your API key is invalid or has been deactivated.';
        errorResponse.description = 'Please check your API key configuration in your profile.';
        errorResponse.actionText = 'Update API Key';
      } else if (errorData && errorData.error) {
        // Handle other Judge0 specific errors
        errorResponse.message = errorData.error;
      }
    }

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

/**
 * GET /compiler/queue-status
 * Get current queue status and active user count
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Available for monitoring compilation queue status
 * - Can be used for displaying system load to users
 * 
 * RESPONSE:
 * - queueStatus: Object with pending and processing counts
 * - activeUsers: Number of users currently using the system
 */
/**
 * ROUTE: POST /custom-test
 * 
 * PURPOSE:
 * Execute user's code with custom input provided by the user
 * 
 * FEATURES:
 * - Allows users to test their code with custom input
 * - Returns the output of the execution
 * - Uses same API key rotation system as other routes
 * - No test case comparison, just raw execution results
 * 
 * REQUEST BODY:
 * - code: String (user's source code)
 * - language: String (programming language)
 * - input: String (custom input provided by user)
 * 
 * RESPONSE:
 * - success: Boolean
 * - result: Object with execution details (output, time, memory, etc.)
 */
router.post("/custom-test", isAuthorized, async (req, res) => {
  const { code, language, input = "" } = req.body;
  const userId = req.user.id;

  // Input validation
  if (!code?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Code is required"
    });
  }

  if (!language) {
    return res.status(400).json({
      success: false,
      message: "Programming language is required"
    });
  }

  try {    console.log(`🔧 Custom test execution requested by user ${userId} for ${language}`);

    // Check API key availability (either admin or user based on system setting)
    const userApiResult = await getApiKey(userId);
    
    if (userApiResult.error) {
      // Structure error response based on error type
      const errorResponse = {
        success: false,
        message: userApiResult.message,
        suggestion: 'Please add your Judge0 API keys in your profile to run custom tests.'
      };

      let errorCode;
      switch (userApiResult.error) {
        case 'NO_API_KEYS':
          errorCode = 'api_keys_required';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Keys Required';
          errorResponse.description = 'You need to add Judge0 API keys to run custom tests.';
          errorResponse.actionText = 'Add API Keys';
          break;
          
        case 'NO_ACTIVE_KEYS':
          errorCode = 'no_active_keys';
          errorResponse.error = errorCode;
          errorResponse.title = 'No Active API Keys';
          errorResponse.description = 'All your API keys are inactive. Please activate at least one.';
          errorResponse.actionText = 'Manage API Keys';
          break;
          
        case 'LIMIT_EXCEEDED':
          errorCode = 'daily_limit_exceeded';
          errorResponse.error = errorCode;
          errorResponse.title = 'Daily Limit Exceeded';
          errorResponse.description = 'All your API keys have reached their daily limit.';
          errorResponse.actionText = 'Add More Keys';
          errorResponse.keyUsageInfo = userApiResult.keyUsageInfo;
          break;
          
        default:
          errorCode = 'api_key_invalid';
          errorResponse.error = errorCode;
          errorResponse.title = 'API Key Error';
          errorResponse.description = 'There was an issue with your API keys.';
          errorResponse.actionText = 'Check API Keys';
          break;
      }
      
      console.log(`❌ API key requirement not met for custom test by user ${userId}: ${errorCode}`);
      return res.status(403).json(errorResponse);
    }

    // User has valid API key - proceed with execution
    const apiKey = userApiResult.key;
    const keyInfo = {
      keyId: userApiResult.keyId,
      userId: userApiResult.userId,
      keyName: userApiResult.keyName,
      usage: userApiResult.usage
    };
    
    console.log(`✅ Using ${userApiResult.isAdminKey ? 'admin' : 'user'} API key for custom test: ${keyInfo.keyName} (${keyInfo.usage})`);    // Get language ID for Judge0
    const lang = getLanguageId(language);
    if (!lang) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    // Prepare submission data for Judge0
    const submissionData = {
      language_id: lang,
      source_code: Buffer.from(code).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
    };

    const options = {
      method: "POST",
      url: `${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=true`,
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": JUDGE0_API_HOST,
      },
      data: submissionData,
    };    console.log(`📡 Making Judge0 API request for custom test with ${userApiResult.isAdminKey ? 'admin' : 'user'} API key: ${keyInfo.keyName}`);
    const response = await axios(options);
    
    // Increment usage count for the appropriate API key type
    await incrementApiKeyUsage(userApiResult.userId, userApiResult.keyId, userApiResult.isAdminKey);

    logServerInstance(response, "CustomTest");

    if (response.data) {
      const result = {
        stdout: response.data.stdout ? Buffer.from(response.data.stdout, "base64").toString() : "",
        stderr: response.data.stderr ? Buffer.from(response.data.stderr, "base64").toString() : "",
        compile_output: response.data.compile_output ? Buffer.from(response.data.compile_output, "base64").toString() : "",
        time: response.data.time || "0.00",
        memory: response.data.memory || 0,
        status: {
          id: response.data.status?.id || 0,
          description: response.data.status?.description || "Unknown"
        }
      };

      // Check for compilation or runtime errors
      if (result.compile_output && result.compile_output.trim()) {
        result.error = `Compilation Error: ${result.compile_output}`;
      } else if (result.stderr && result.stderr.trim()) {
        result.error = `Runtime Error: ${result.stderr}`;
      } else if (result.status.id !== 3) { // 3 is "Accepted" status
        result.error = `Execution Error: ${result.status.description}`;
      }

      console.log(`✅ Custom test completed for user ${userId}`);
      
      return res.status(200).json({
        success: true,
        result: result,
        message: "Custom test executed successfully"
      });
    } else {
      throw new Error("Invalid response from Judge0 API");
    }

  } catch (error) {
    console.error("Custom test execution error:", error);
    
    // Check if this is an API key related error
    if (error.response?.data?.error && [
      'api_keys_required', 
      'no_active_keys', 
      'daily_limit_exceeded',
      'rate_limit_exceeded',
      'api_key_invalid'
    ].includes(error.response.data.error)) {
      return res.status(403).json(error.response.data);
    }
    
    return res.status(500).json({
      success: false,
      message: "Failed to execute custom test",
      error: error.response?.data?.message || error.message
    });
  }
});

router.get("/queue-status", isAuthorized, (req, res) => {
  res.json({
    success: true,
    queueStatus,
    activeUsers: userSubmissionCounts.size,
  });
});

export default router;