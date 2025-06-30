
/**
 * SUBMISSION MANAGEMENT ROUTES
 * 
 * This file contains all routes for managing code submissions in the online programming platform.
 * Routes handle submission viewing, analytics, and individual submission details.
 * 
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 * - isAdminOrFaculty: Required for analytics and problem-specific routes
 */

import express from "express";
import {  isAdminOrFaculty, isAuthorized } from "../middlewares/auth.js";
import {
  // createSubmission,
  getUserSubmissions,
  getAllSubmissionsForProblem,
  getAllSubmissionsForAnalytics,
  getAllSubmissionsForUser,
  getSubmissionById,
} from "../controllers/submission.controller.js";

const router = express.Router();
router.use(isAuthorized);

/**
 * GET /submissions/
 * Get user's own submissions
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Problem/Submission.jsx (line 21) - Fetches user submissions with problemId parameter
 * - SubmissionPage.jsx (line 5) - Via fetchSubmissions Redux action
 * - Profile/Profile.jsx (line 8) - Via fetchSubmissions Redux action  
 * - CodeEditor/CodeEditor.jsx (line 9) - Via fetchSubmissions Redux action
 * - Header.jsx (line 10) - Via logoutSubmissions Redux action
 */
router.get("/", getUserSubmissions);

/**
 * GET /submissions/problem
 * Get all submissions for a specific problem (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Problem/Dashboard.jsx (line 346) - Fetches submissions for problem analysis with problemId parameter
 */
router.get("/problem",isAdminOrFaculty, getAllSubmissionsForProblem);

/**
 * GET /submissions/problem/analytics
 * Get submission analytics for a specific problem (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Problem/Dashboard.jsx (line 351) - Fetches analytics data for problem dashboard with problemId parameter
 */
router.get("/problem/analytics",isAdminOrFaculty, getAllSubmissionsForAnalytics);

/**
 * GET /submissions/user/submissions
 * Get all submissions for a specific user
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Currently not directly used in frontend components
 * - Available for user-specific submission queries
 */
router.get("/user/submissions", getAllSubmissionsForUser);

/**
 * GET /submissions/:id
 * Get specific submission by ID
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Problem/Details.jsx (line 17) - Fetches submission details by submissionId
 * - SubmissionPage.jsx (line 124) - Navigation to submission details page
 * - Problem/SubmissionList.jsx (line 41) - Navigation to submission details
 * - Problem/Dashboard.jsx (line 1570) - Navigation to submission details
 * - History.jsx (line 151) - Navigation to submission details
 * - Body.jsx (line 66) - Route definition for /submissions/:submissionId
 */
router.get("/:id", getSubmissionById);
// router.post("/", createSubmission);

export default router;


