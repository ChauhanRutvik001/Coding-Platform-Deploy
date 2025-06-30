import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminFacultyController from '../controllers/admin.faculty.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Faculty management endpoints
router.route("/get-faculty-by-admin").post(isAdmin, adminFacultyController.getFaculty); // Used by: CreateBatch.jsx (line 68), BatchDetails.jsx (line 71), BatchManagement.jsx (line 39), AdminRegister.jsx (line 38)
router.route("/deleteFaculty").delete(isAdmin, adminFacultyController.deleteFaculty); // Used for faculty deletion (not directly visible in current components)
router.route("/create-faculty").post(isAdmin, adminFacultyController.createFaculty); // Used by: CreateFaculty.jsx (line 45)
router.route("/bulk-create-faculty").post(isAdmin, adminFacultyController.bulkCreateFaculty); // Used by: CreateFaculty.jsx (line 203)

// Student management endpoints
router.route("/bulk-student-register").post(isAdmin, adminFacultyController.BulkStudentRequests); // Used by: StudentRegister.jsx (line 377)
router.route("/student-register").post(isAdmin, adminFacultyController.registerStudent); // Used by: StudentRegister.jsx (line 295)
router.route("/get-students").post(isAdmin, adminFacultyController.getStudents); // Used by: CreateBatch.jsx (lines 87, 160, 194), BatchDetails.jsx (line 84)
router.route("/remove-student/:userId").delete(isAdmin, adminFacultyController.removeStudent); // Used for student removal (not directly visible in current components)

export default router;
