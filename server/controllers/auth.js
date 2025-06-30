import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import { createToken, verifyToken } from "../utils/jwt.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import cron from "node-cron";
import dotenv from "dotenv";
dotenv.config();

export const login = async (req, res) => {
  console.log("login Api hit");
  const { id, email, password } = req.body;
  // console.log(id, email, password);
  console.log("-->", req.ip);

  try {
    // Check if this is the first user ever to log in
    const userCount = await User.countDocuments({});
    const isFirstUserEver = userCount === 0;
    
    // If this is the first user ever, create an admin account
    if (isFirstUserEver && (id || email) && password) {
      const username = id || email.split('@')[0];
      const adminUser = await User.create({
        username: username,
        id: id || username, // Use username as ID if no ID provided
        email: email || `${username}@admin.com`,
        password: password,
        role: "admin",
        isApproved: true,
        firstTimeLogin: false,
        sessionId: uuidv4(),
        lastLoginTime: new Date()
      });
      
      const token = await createToken({ id: adminUser._id, sessionId: adminUser.sessionId });
      const oneDay = 1000 * 60 * 60 * 24;

      return res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          expires: new Date(Date.now() + oneDay),
        })
        .json({
          message: "Welcome! You are the first user and have been set as an administrator.",
          user: {
            profile: adminUser.profile || {},
            _id: adminUser._id,
            username: adminUser.username,
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
          },
          success: true,
        });
    }

    // Normal login flow for existing users
    let user;
    if (id) {
      user = await User.findOne({ id });
    } else if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(200).json({
        message: "Invalid ID & Password!",
        success: false,
      });
    }

    if (!user.isApproved) {
      return res.status(200).json({
        message: "Your registration request has not been approved yet.",
        success: false,
      });
    }

    const isPasswordValid = await user.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(200).json({
        message: "Invalid ID & Password!",
        success: false,
      });
    }

    const isFirstTime = user.firstTimeLogin;

    if (isFirstTime) {
      return res.status(200).json({
        firstTimeLogin: isFirstTime,
        message: "Welcome on your first login!",
        success: true,
      });
    }

    if (user.sessionId) {
      return res.status(400).json({
        message: "You are already logged in from another session.",
        success: false,
      });
    }

    const sessionId = uuidv4();
    user.sessionId = sessionId;
    user.lastLoginTime = new Date();
    await user.save({ validateBeforeSave: false });

    const token = await createToken({ id: user._id, sessionId: sessionId });
    const oneDay = 1000 * 60 * 60 * 24;

    return res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + oneDay),
      })
      .json({
        message: "Welcome back!",
        user: {
          profile: user.profile,
          _id: user._id,
          username: user.username,
          id: user.id,
          email: user.email,
          role: user.role,
          branch: user.branch,
          semester: user.semester,
          batch: user.batch,
        },
        success: true,
      });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "An error occurred during login. Please try again later.",
      success: false,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "All fields are required.", success: false });
    }

    let email = `${oldPassword.toLowerCase()}@charusat.edu.in`;
    let facultyEmail = `${oldPassword.toLowerCase()}@charusat.ac.in`;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.findOne({ email: facultyEmail });
    }

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found.", success: false });
    }

    if (!user.isApproved) {
      return res
        .status(404)
        .json({ message: "You are not approved yet.", success: false });
    }

    const isPasswordValid = await user.comparePassword(
      oldPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Old password is not valid.", success: false });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password.",
        success: false,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
        success: false,
      });
    }

    user.password = newPassword;
    user.firstTimeLogin = false;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully!",
      success: true,
    });
  } catch (error) {
    console.error("PasswordChange error:", error);
    return res.status(500).json({
      message: "An error occurred while changing the password.",
      success: false,
    });
  }
};

export const register = async (req, res) => {
  try {
    return res.status(400).json({
      message: "Registration is disabled in this application.",
      success: false,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(400).json({
      message: error.message || "Failed to create account.",
      success: false,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  const decoded = await verifyToken(token);
  const user = await User.findByIdAndUpdate(decoded.id, { verified: true });
  if (!user) throw new NotFoundError("invalid");

  await successEmail(user.email);
  res.status(StatusCodes.OK).json({ status: "success", msg: "email verified" });
};

export const logout = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Invalid user",
        success: false,
      });
    }

    await User.updateOne({ _id: user._id }, { $set: { sessionId: null } });

    res.cookie("token", "logout", {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    return res
      .status(200)
      .json({ message: "Successfully logged out", success: true });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "An error occurred while logging out.",
      success: false,
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        message: "Already authorised",
        success: false,
      });
    }

    return res.status(200).json({
      user: {
        profile: user.profile,
        _id: user._id,
        username: user.username,
        id: user.id,
        email: user.email,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        batch: user.batch,
      },
      success: true,
    });
  } catch (error) {
    console.log("error found");
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const fetchSubjects = async (req, res) => {
  try {
    // Since registration is disabled, this endpoint is no longer needed
    return res.status(200).json({
      success: true,
      subjects: [],
      message: "Note: Registration has been disabled for this application."
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching subjects.",
      error: error.message,
    });
  }
};

export const getSocketToken = async (req, res) => {
  try {
    // Get the token from the cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
        success: false
      });
    }

    // Verify the token to ensure it's valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id);

    if (!user || user.sessionId !== decoded.sessionId) {
      return res.status(401).json({
        message: "Invalid session",
        success: false
      });
    }

    // Generate a short-lived socket token
    const socketToken = jwt.sign(
      { 
        id: user._id, 
        sessionId: user.sessionId,
        purpose: 'socket'
      }, 
      process.env.JWT_SECRET_KEY, 
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success: true,
      socketToken
    });
  } catch (error) {
    console.error("Socket token error:", error);
    return res.status(500).json({
      message: "Failed to generate socket token",
      success: false
    });
  }
};

cron.schedule("* * * * *", async () => {
  const currentTime = new Date();
  const expirationTime = 1000 * 60 * 60 * 24;

  const users = await User.find({
    lastLoginTime: { $lt: new Date(currentTime - expirationTime) },
  });

  for (let user of users) {
    user.sessionId = null;
    user.lastLoginTime = null;
    await user.save();

    console.log(`User ${user.username}'s session has been expired.`);
  }
});
