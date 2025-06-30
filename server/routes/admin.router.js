import express from "express";
import { isAuthorized, isAdmin } from '../middlewares/auth.js';
import adminController from '../controllers/admin.controller.js';
import adminApiKeyController from '../controllers/adminApiKey.controller.js';

const router = express.Router();

router.use(isAuthorized);

// Dashboard endpoints
router.post("/getFaculty", isAdmin, adminController.getFaculty); // Used by: Admin/ManageUser.jsx (line 82) - for faculty management
router.post("/getStudents", isAdmin, adminController.getStudents); // Used by: Admin/ManageUser.jsx (line 93) - for student management

// User management endpoints
router.post("/deleteFaculty", isAdmin, adminController.deleteFaculty); // Used by: Admin/ManageUser.jsx (for deleting faculty)
router.post("/removeStudent", isAdmin, adminController.removeStudent); // Used by: Admin/ManageUser.jsx (for removing students)

// New user management endpoints
router.post("/resetUserPassword", isAdmin, adminController.resetUserPassword); // For resetting user passwords
router.post("/expireUserSession", isAdmin, adminController.expireUserSession); // For expiring user sessions

// Metadata endpoints for dropdowns
router.get("/branches", isAdmin, adminController.getAllBranches); // Used for branch dropdown options (not directly visible in current components)
router.get("/batches", isAdmin, adminController.getAllBatche); // Used for batch dropdown options (not directly visible in current components)

// User editing endpoints
router.post("/editFaculty/:userID", isAdmin, adminController.editfaculty); // Used for faculty editing (not directly visible in current components)
router.post("/editStudent/:userID", isAdmin, adminController.editstudent); 
router.get("/problems",isAdmin, adminController.getAllProblems); // Used by: AdminProblems.jsx (line 20) - for fetching all problems

// Admin API Key management endpoints
router.get('/api-keys', isAdmin, adminApiKeyController.getAdminApiKeys); // Get all admin API keys
router.get('/api-keys/usage', isAdmin, adminApiKeyController.getAdminApiKeyUsage); // Get admin API key usage statistics
router.get('/api-keys/mode', isAdmin, adminApiKeyController.getApiKeyMode); // Get current API key mode
router.post('/api-keys/toggle-mode', isAdmin, adminApiKeyController.toggleApiKeyMode); // Toggle between user and admin API keys
router.get('/api-keys/:apiKeyId', isAdmin, adminApiKeyController.getAdminApiKey); // Get single admin API key
router.post('/api-keys', isAdmin, adminApiKeyController.addAdminApiKey); // Add new admin API key
router.put('/api-keys/:apiKeyId', isAdmin, adminApiKeyController.updateAdminApiKey); // Update admin API key
router.delete('/api-keys/:apiKeyId', isAdmin, adminApiKeyController.deleteAdminApiKey); // Delete admin API key

export default router;