import express from "express";
import { login, logout, verifyEmail, getCurrentUser, changePassword, fetchSubjects, getSocketToken } from "../controllers/auth.js";
import { isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

// Authentication endpoints
router.route("/login").post(login); // Used by: Login.jsx (line 50)
router.route("/verify").get(verifyEmail); // Used for email verification (not directly visible in frontend)
router.route("/logout").get(logout); // Used by: Header.jsx (line 109)
router.route("/get-current-user").get(getCurrentUser); // Used by: Auth/auth.js (for user session management)
router.route("/change-password").post(changePassword); // Used by: PassWordChange.jsx (line 43)
router.route("/fetch-subjects").get(fetchSubjects); // Used for subject dropdown (not directly visible in current components)
router.route("/socket-token").get(isAuthorized, getSocketToken); // New endpoint for socket token

// forget password - endpoint not implemented yet

export default router;