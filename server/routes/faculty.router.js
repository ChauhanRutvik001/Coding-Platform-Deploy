import express from "express";
import { isAdmin, isAdminOrFaculty, isAuthorized, isFaculty } from "../middlewares/auth.js";
import facultyController from "../controllers/faculty.controller.js";

const router = express.Router();

// Faculty student management endpoints
router
  .route("/get-students-by-faculty")
  .post(isAuthorized,isAdminOrFaculty, facultyController.getStudents); // Used for getting students under faculty (not directly visible in current components)
router
  .route("/expire-session")
  .post(isAuthorized,isAdminOrFaculty, facultyController.expireSession); // Used for session management (not directly visible in current components)
router
  .route("/remove-user/:userId")
  .delete(isAuthorized, isFaculty, facultyController.removeUser); // Used for removing users (not directly visible in current components)

// Batch management endpoints for faculty
router.route("/batches")
  .get(isAuthorized, isFaculty, facultyController.getMyBatches); // Used by: Faculty/BatchList.jsx (line 48), Problem/Dashboard.jsx (line 100)
router.route("/my-batches")
  .get(isAuthorized, isFaculty, facultyController.getMyBatches); // Used by: Problem/BatchAssignedStudents.jsx (line 22)
router.route("/batches/:batchId")
  .get(isAuthorized, isFaculty, facultyController.getBatchDetails); // Used by: Faculty/BatchDetails.jsx (line 33), Problem/BatchProblems.jsx (line 20), Problem/Dashboard.jsx (line 131)
router.route("/batches/:batchId/progress")
  .get(isAuthorized, isFaculty, facultyController.getBatchProgress); // Used by: Faculty/BatchProgress.jsx (line 34)

export default router;