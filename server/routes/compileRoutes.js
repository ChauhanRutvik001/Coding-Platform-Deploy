
/**
 * CODE COMPILATION AND DRAFT MANAGEMENT ROUTES
 * 
 * This file contains routes for code compilation, execution, and draft management.
 * These routes handle code compilation with test cases and saving/retrieving code drafts.
 * 
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 * 
 * BASE PATH: /api/v1/compile
 */

import express from "express";
import { compileCode, saveCode, getCode } from "../controllers/compileController.js";
import { isAuthorized } from '../middlewares/auth.js';

const router = express.Router();
router.use(isAuthorized);

/**
 * POST /compile/
 * Compile and run code with test cases
 * 
 * USED BY FRONTEND COMPONENTS:
 * - CodeEditor/CodeEditor.jsx (line 95, 142, 249) - Via /compiler/run-code endpoint
 * 
 * NOTE: Frontend primarily uses /compiler/run-code for compilation,
 * this endpoint may be for alternative compilation methods
 */
router.post("/", compileCode);

/**
 * POST /compile/saveCode
 * Save code draft for later retrieval
 * 
 * USED BY FRONTEND COMPONENTS:
 * - CodeEditor/CodeEditor.jsx (line 282) - Saves code draft with problemId, language, and code
 * - CodeEditor/TestCaseResults.jsx (line 44) - Save button triggers handleSaveCode function
 */
router.post("/saveCode", saveCode);

/**
 * GET /compile/getCode
 * Retrieve saved code draft
 * 
 * USED BY FRONTEND COMPONENTS:
 * - CodeEditor/CodeEditor.jsx (line 54) - Retrieves saved code draft with problemId and language parameters
 */
router.get("/getCode", getCode);

export default router;
