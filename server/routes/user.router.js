import express from "express";
import {
  updateUser,
  uploadProfilePic,
  getProfilePic,
  removeProfilePic,
  addApiKey,
  getApiKeys,
  updateApiKey,
  deleteApiKey,
  getApiKeyUsage,
} from "../controllers/user.controller.js";
import { isAuthorized } from "../middlewares/auth.js";
import studentBatchController from "../controllers/student.batch.controller.js";

import { upload } from "../utils/multer.utils.js"

const router = express.Router();

// User profile management endpoints
router.put("/update",isAuthorized, updateUser); // Used for user profile updates (not directly visible in current components)

// Profile picture management endpoints
router.post('/upload-avatar', isAuthorized, upload.single('avatar'), uploadProfilePic); // Used by: Profile/ProfileLeft.jsx (line 71)
router.get('/profile/upload-avatar', isAuthorized, getProfilePic); // Used for getting profile picture (not directly visible in current components)
router.delete('/profile/remove-profile-pic', isAuthorized, removeProfilePic); // Used by: Profile/ProfileLeft.jsx (line 103)

// Student batch routes
router.get('/my-batches', isAuthorized, studentBatchController.getMyBatches); // Used by: Student.jsx (line 19), Student/BatchList.jsx (line 24)
router.get('/batches/:batchId', isAuthorized, studentBatchController.getBatchDetails); // Used by: Student/BatchDetails.jsx (line 71)
router.get('/batches/:batchId/problems', isAuthorized, studentBatchController.getBatchProblems); // Used by: Student/BatchDetails.jsx (line 26)
router.get('/batches/:batchId/progress', isAuthorized, studentBatchController.getBatchProgress); // Used by: Student/BatchProgress.jsx (line 38)

// API Key management endpoints
router.post('/api-keys', isAuthorized, addApiKey); // Add new API key
router.get('/api-keys', isAuthorized, getApiKeys); // Get all API keys for user
router.put('/api-keys/:apiKeyId', isAuthorized, updateApiKey); // Update API key (name, active status)
router.delete('/api-keys/:apiKeyId', isAuthorized, deleteApiKey); // Delete API key
router.get('/api-keys/usage', isAuthorized, getApiKeyUsage); // Get usage statistics

export default router;