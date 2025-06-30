import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import util from "util";
import Code from "../models/Code.js";
import problem from "../models/problem.js";
import { count } from "console";

const __dirname = path.resolve();
const execAsync = util.promisify(exec);
const TIME_LIMIT = 10000;

export const compileCode = async (req, res) => {
  const { code, language, testCases, allTestcase, problemId } = req.body;
  if (!code || !testCases || !language) {
    return res
      .status(400)
      .json({ error: "Code, Testcases, and language are required" });
  }
  
  // If this is a submission (not just running test cases) and problemId is provided, check due date
  if (allTestcase && problemId) {
    try {
      const problemData = await problem.findById(problemId);
      if (problemData && problemData.dueDate) {
        const now = new Date();
        const dueDate = new Date(problemData.dueDate);
        
        if (now > dueDate) {
          return res
            .status(403)
            .json({ error: "Submission deadline has passed. You can no longer submit solutions for this problem." });
        }
      }
    } catch (err) {
      console.error("Error checking problem due date:", err);
      // Continue execution even if there's an error checking the due date
    }
  }

  const fileExtension =
    language === "python"
      ? "py"
      : language === "cpp"
      ? "cpp"
      : language === "java"
      ? "java"
      : null;
  if (!fileExtension) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const fileName =
    language === "java"
      ? "Solution.java"
      : `Solution_${uuidv4()}.${fileExtension}`;
  const tempDir = path.join(__dirname, "temp");
  const filePath = path.join(tempDir, fileName);

  try {
    const testCasesToRun = allTestcase ? testCases : [testCases[0]];

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(filePath, code);

    const compileCommand =
      language === "cpp"
        ? `g++ ${filePath} -o ${filePath}.exe`
        : language === "java"
        ? `javac ${filePath}`
        : null;
    const runCommand =
      language === "cpp" && process.platform === "win32"
        ? `${filePath}.exe`
        : language === "cpp"
        ? `${filePath}.out`
        : language === "java"
        ? `java -cp ${tempDir} Solution`
        : `python ${filePath}`;

    if (compileCommand) {
      const { stderr: compileStderr } = await execAsync(compileCommand);
      if (compileStderr) {
        throw new Error(`Compilation Error: ${compileStderr}`);
      }
    }

    // const arraysEqual = (arr1, arr2) => arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
    const normalizeValue = (value) => {
      try {
        return JSON.parse(value); // Attempt to parse as a number, boolean, etc.
      } catch {
        return value; // Fallback to the original value (string)
      }
    };

    const normalizeArray = (arr) => arr.map(normalizeValue);

    const arraysEqual = (arr1, arr2) => {
      const mergeArrayToString = (arr) => arr.map(String).join(" ");

      const mergedArr1 = mergeArrayToString(arr1);
      const mergedArr2 = mergeArrayToString(arr2);

      console.log("Merged arr1:", mergedArr1);
      console.log("Merged arr2:", mergedArr2);

      if (mergedArr1 !== mergedArr2) {
        console.log(
          `Merged arr1: "${mergedArr1}" (type: string) vs Merged arr2: "${mergedArr2}" (type: string)`
        );
        return false;
      }
      return true;
    };

    const executeWithTimeout = (inputs) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Execution timed out")),
          TIME_LIMIT
        );
        const inputValues = inputs.map((input) => input.value);
        console.log("Input Values:", inputValues);
        const inputString = inputValues.join(" ") + "\n";
        console.log("Input String:", inputString);

        const child = exec(
          runCommand,
          { timeout: TIME_LIMIT },
          (error, stdout, stderr) => {
            clearTimeout(timeout);

            if (error) {
              if (
                stderr.includes("invalid_argument") ||
                stderr.includes("stoi")
              ) {
                resolve({ output: ["Invalid input"], time: 0, memory: 0 });
              } else {
                reject(
                  new Error(`Execution Error: ${stderr || error.message}`)
                );
              }
            } else {
              const outputArray = stdout
                .trim()
                .split(/\s+/)
                .map((line) => {
                  try {
                    return JSON.parse(line); // Attempt to parse numbers, booleans, etc.
                  } catch {
                    return line; // Fallback to treating as a string
                  }
                });
              const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
              console.log("Output Array:", outputArray);
              resolve({
                output: outputArray,
                time: Date.now(),
                memory: memoryUsage,
              });
            }
          }
        );

        const startTime = Date.now();
        child.stdin.write(inputString);
        child.stdin.end();
        child.on("close", () =>
          resolve({
            time: Date.now() - startTime,
            memory: process.memoryUsage().heapUsed / 1024 / 1024,
          })
        );
      });
    };

    let totalExecutionTime = 0;
    let totalMemoryUsage = 0;
    const testResults = [];

    const overallStartTime = Date.now();

    for (const { inputs, outputs: expectedOutputs } of testCasesToRun) {
      try {
        const { output, time, memory } = await executeWithTimeout(inputs);
        const expectedValues = expectedOutputs.map((output) => output.value);
        console.log("Expected Values:", expectedValues);
        const passed = arraysEqual(output, expectedValues);

        testResults.push({
          inputs,
          expectedOutputs,
          output,
          passed,
          time,
          memory,
        });
        totalExecutionTime += time;
        totalMemoryUsage += memory;
      } catch (runError) {
        testResults.push({
          inputs,
          expectedOutputs,
          output: runError.message,
          passed: false,
        });
      }
    }

    const overallExecutionTime = Date.now() - overallStartTime;
    const averageMemoryUsage = totalMemoryUsage / testCasesToRun.length;    console.log("Test results:", testResults);
    console.log("Overall execution time:", overallExecutionTime);
    console.log("Average memory usage:", averageMemoryUsage);

    // Check if this is a submission (allTestcase is true) and problemId is provided
    // If so, create a submission record
    if (allTestcase && req.body.problemId && req.user) {
      try {
        const problemData = await problem.findById(req.body.problemId);
        if (!problemData) {
          return res.status(404).json({ error: "Problem not found" });
        }

        // Find the batch this student belongs to that's assigned to this problem
        const Batch = (await import('../models/batch.js')).default;
        const batches = await Batch.find({
          students: req.user.id,
          _id: { $in: problemData.assignedBatches }
        });

        // Calculate submission stats
        const allPassed = testResults.every(test => test.passed);
        const numberOfTestCase = testResults.length;
        const numberOfTestCasePass = testResults.filter(test => test.passed).length;
        
        // Get the test case marks from the problem model
        let totalMarks = 0;
        if (problemData.testCases && problemData.testCases.length > 0) {
          for (let i = 0; i < testResults.length; i++) {
            if (testResults[i].passed && problemData.testCases[i]) {
              totalMarks += problemData.testCases[i].marks || 0;
            }
          }
        }

        // Create submission
        const Submission = (await import('../models/submission.js')).default;
        const submission = new Submission({
          user_id: req.user.id,
          problem_id: req.body.problemId,
          batch_id: batches.length > 0 ? batches[0]._id : null, // Use first matching batch if found
          code: code,
          language: language,
          status: allPassed ? "completed" : "rejected",
          execution_time: overallExecutionTime,
          memory_usage: averageMemoryUsage / 1024, // Convert to MB
          numberOfTestCase,
          numberOfTestCasePass,
          totalMarks,
          testCaseResults: testResults,
        });

        const savedSubmission = await submission.save();
        
        res.json({
          testResults,
          overallTime: overallExecutionTime,
          averageMemory: averageMemoryUsage,
          savedSubmission
        });
      } catch (submissionError) {
        console.error("Error creating submission:", submissionError);
        // Still return test results even if submission creation fails
        res.json({
          testResults,
          overallTime: overallExecutionTime,
          averageMemory: averageMemoryUsage,
          submissionError: submissionError.message
        });
      }
    } else {
      res.json({
        testResults,
        overallTime: overallExecutionTime,
        averageMemory: averageMemoryUsage,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred", details: error.message });
  } finally {
    try {
      await fs.unlink(filePath);
      if (language === "cpp") {
        await fs.unlink(`${filePath}.exe`);
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
  }
};

export const saveCode = async (req, res) => {
  const { problemId, codeByLanguage } = req.body;

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access" });
  }
  const userId = req.user.id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access" });
  }

  // Validate input
  if (!problemId || !codeByLanguage) {
    return res
      .status(400)
      .json({ success: false, message: "Problem ID and code are required" });
  }

  // Validate that codeByLanguage is an object
  if (typeof codeByLanguage !== 'object' || Array.isArray(codeByLanguage)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid code format" });
  }

  try {
    // Check if there's an existing code record
    const existingCode = await Code.findOne({ userId, problemId });
    
    // If no changes, don't update
    if (existingCode && JSON.stringify(existingCode.codeByLanguage) === JSON.stringify(codeByLanguage)) {
      return res
        .status(200)
        .json({ 
          success: true, 
          message: "No changes detected", 
          code: existingCode,
          isNoChange: true 
        });
    }

    const code = await Code.findOneAndUpdate(
      { userId, problemId },
      { 
        codeByLanguage, 
        updatedAt: new Date() 
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    res
      .status(200)
      .json({ 
        success: true, 
        message: "Code saved successfully", 
        code,
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error("Error saving code:", error);
    res
      .status(500)
      .json({ 
        success: false, 
        message: "Error saving code", 
        error: error.message 
      });
  }
};

export const getCode = async (req, res) => {
  const { problemId } = req.query;

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access" });
  }
  const userId = req.user.id;

  if (!userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access" });
  }
  // console.log("Received query params:", req.query);

  try {
    const code = await Code.findOne({ userId, problemId });
    // console.log("Retrieved code draft:", code);

    if (code) {
      // Send back the codeByLanguage object directly
      res.status(200).json({ success: true, code: code.codeByLanguage });
    } else {
      res
        .status(404)
        .json({ success: false, message: "No code found for this problem" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching code", error });
  }
};
