import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminBatchController from '../controllers/admin.batch.controller.js';
import adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Batch management endpoints
router.route("/batches").post(isAdmin, adminBatchController.createBatch); // Used by: CreateBatch.jsx (line 268)
router.route("/batches").get(isAdmin, adminBatchController.getAllBatches); // Used by: BatchManagement.jsx (line 62), Problem/Dashboard.jsx (line 110)
router.route("/batches/:batchId").get(isAdmin, adminBatchController.getBatchById); // Used by: BatchDetails.jsx (line 49), Problem/Dashboard.jsx (line 134)
router.route("/batches/:batchId").put(isAdmin, adminBatchController.updateBatch); // Used by: BatchDetails.jsx (line 158)
router.route("/batches/:batchId").delete(isAdmin, adminBatchController.deleteBatch); // Used by: BatchManagement.jsx (line 82)
router.route("/batches/:batchId/students").post(isAdmin, adminBatchController.addStudentsToBatch); // Used by: BatchDetails.jsx (line 163)
router.route("/batches/:batchId/students").delete(isAdmin, adminBatchController.removeStudentsFromBatch); // Used by: BatchDetails.jsx (line 139)
router.route("/faculty/:facultyId/batches").get(isAdmin, adminBatchController.getBatchesByFaculty); // Not directly used in visible frontend components
router.get('/batches/:batchId/students', isAuthorized, isAdmin, adminBatchController.getBatchStudentsPaginated);
// Dashboard endpoints
router.route("/dashboard-stats").get(isAdmin, adminBatchController.getDashboardStats); // Used by: Admin/Admin.jsx (line 98) - for dashboard statistics
router.route("/dashboard-users").get(isAdmin, adminController.getusers); // Used by: Admin/Admin.jsx (line 145) - for user list on dashboard


export default router;
