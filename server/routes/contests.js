
/**
 * CONTEST MANAGEMENT ROUTES
 * 
 * This file contains all routes for managing programming contests in the online platform.
 * Routes handle contest CRUD operations, student assignment/unassignment, and contest analytics.
 * 
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 * - isAdminOrFaculty: Required for admin/faculty operations (create, update, delete, assign)
 * - isAdmin: Required for admin-only operations
 */

import express from "express";
import {
  createContest,
  getAllContests,
  getContestById,
  updateContest,
  deleteContest,
  assignContestToStudents,
  getAssignedStudents,
  getUnassignedStudents,
  unassignContestToStudents,
  getContestDashboard,
} from "../controllers/contestController.js";
import {
  isAuthorized,
  isAdmin,
  isAdminOrFaculty,
} from "../middlewares/auth.js";

const router = express.Router();

// Middleware to ensure the user is authenticated
router.use(isAuthorized);

/**
 * POST /contests/create
 * Create a new contest (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/CreateContest.jsx (line 133) - Creates new contest with contest data
 */
router.post("/create", isAdminOrFaculty, createContest);

/**
 * GET /contests/
 * Get all contests
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/MakeContest.jsx (line 80) - Fetches all contests for listing
 * - Browse.jsx (line 186) - Navigation to contests page
 */
router.get("/", getAllContests);

/**
 * GET /contests/:id
 * Get specific contest by ID
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/CreateContest.jsx (line 67) - Fetches contest details for editing
 * - Contest/Contest.jsx (line 50) - Fetches contest details for display
 * - Contest/MakeContest.jsx (line 265) - Navigation to contest details
 * - Body.jsx (line 53) - Route definition for /contests/:id
 */
router.get("/:id", getContestById);

/**
 * PUT /contests/:id
 * Update existing contest (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/CreateContest.jsx (line 130) - Updates contest with modified data
 */
router.put("/:id", isAdminOrFaculty, updateContest);

/**
 * DELETE /contests/:id
 * Delete contest (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/MakeContest.jsx (line 56) - Deletes contest by contestToDelete ID
 */
router.delete("/:id", isAdminOrFaculty, deleteContest);

/**
 * POST /contests/:id/assignContestToStudents
 * Assign contest to selected students (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/UnAssignContest.jsx (line 76) - Assigns contest to students with student IDs
 */
router.post(
  "/:id/assignContestToStudents",
  isAdminOrFaculty,
  assignContestToStudents
);

/**
 * GET /contests/:id/getAssignedStudents
 * Get list of students assigned to contest (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/AssignedContest.jsx (line 29) - Fetches assigned students for contest management
 */
router.get("/:id/getAssignedStudents", isAdminOrFaculty, getAssignedStudents);

/**
 * GET /contests/:id/unassignedStudents
 * Get list of students not assigned to contest (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/UnAssignContest.jsx (line 28) - Fetches unassigned students for assignment
 */
router.get("/:id/unassignedStudents", isAdminOrFaculty, getUnassignedStudents);

/**
 * POST /contests/:id/unassignContestToStudents
 * Remove contest assignment from selected students (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/AssignedContest.jsx (line 77) - Unassigns contest from students with student IDs
 */
router.post(
  "/:id/unassignContestToStudents",
  isAdminOrFaculty,
  unassignContestToStudents
);

/**
 * GET /contests/:id/dashboard
 * Get contest dashboard with analytics and statistics (Admin/Faculty only)
 * 
 * USED BY FRONTEND COMPONENTS:
 * - Contest/ContestDashboard.jsx (line 51) - Fetches dashboard data with query parameters
 * - Contest/MakeContest.jsx (line 309) - Navigation to contest dashboard
 * - Body.jsx (line 68) - Route definition for /contests/:id/dashboard
 */
router.get(
  "/:id/dashboard",
  isAuthorized,
  isAdminOrFaculty,
  getContestDashboard
);

export default router;
