import User from "../models/user.js";
import bcrypt from "bcrypt";
import Submission from "../models/submission.js";
import Code from "../models/Code.js";
import Contest from "../models/contest.js";
import Batch from "../models/batch.js";
import Problem from "../models/problem.js";
import { query } from "express";
import batch from "../models/batch.js";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const adminController = {
  getusers: async (req, res) => {
    try {
      const users = await User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username email id role createdAt branch")
        .lean();
      res.status(200).json({
        success: true,
        message: "Users fetched successfully.",
        users,
      });
    } catch (error) {
      console.error("Error in fetching users:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },  getFaculty: async (req, res) => {
    const { page = 1, limit = 10, branch, batch, sort, search } = req.body;

    try {
      const skip = (page - 1) * limit;
      const query = { role: "faculty", isApproved: true };
      if (branch) query.branch = branch;
      if (batch) query.batch = batch;
      if (search)
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { branch: { $regex: search, $options: "i" } },
          { batch: { $regex: search, $options: "i" } },
          { id: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];

      let sortOption = { createdAt: -1 };
      if (sort === "oldest") sortOption = { createdAt: 1 };

      const facultys = await User.find(query)
        .select("username branch email batch createdAt id")
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

      const totalFaculty = await User.countDocuments(query);
      const totalPages = Math.ceil(totalFaculty / limit);

      res.status(200).json({
        success: true,
        message: "Faculty fetched successfully.",
        facultys,
        totalPages,
        currentPage: page,
        totalFaculty,
      });
    } catch (error) {
      console.error("Error in fetching faculty:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  deleteFaculty: async (req, res) => {
    try {
      const { facultyId } = req.body;

      if (!facultyId) {
        return res
          .status(400)
          .json({ success: false, message: "Faculty ID is required" });
      }

      const faculty = await User.findById(facultyId);

      if (!faculty) {
        return res
          .status(404)
          .json({ success: false, message: "Faculty not found" });
      }

      await User.findByIdAndDelete(facultyId);

      res.status(200).json({
        success: true,
        message: "Faculty deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  createFaculty: async (req, res) => {
    try {
      const { username, email } = req.body;
      const branch = "cspit-it"; // Default branch is always cspit-it

      // Validate required fields
      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: "Username and email are required",
        });
      }

      // Check if email matches expected format (@charusat.ac.in)
      if (!email.endsWith("@charusat.ac.in")) {
        return res.status(400).json({
          success: false,
          message: "Email must end with @charusat.ac.in",
        });
      }

      // Check if user with this email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Extract ID from email (part before @)
      const id = email.split("@")[0];

      // Create new faculty user (subject is optional)
      const newFaculty = new User({
        username,
        id,
        email,
        branch,
        password: id, // Set password to be the same as ID
        role: "faculty",
        isApproved: true, // Auto-approve since admin is creating
        firstTimeLogin: true, // User should change password on first login
      }); // Save the new faculty
      await newFaculty.save();

      // Send welcome notification
      try {
        const { notificationService } = await import("../app.js");
        if (notificationService) {
          await notificationService.createNotification(
            newFaculty._id.toString(),
            "Welcome to Online Programming Submission & Evaluation",
            `Hello ${newFaculty.username}, your faculty account has been created successfully. Use your ID as password for first login.`,
            "account",
            { accountType: "faculty" }
          );
        }
      } catch (notifError) {
        console.error("Failed to send welcome notification:", notifError);
      }

      res.status(201).json({
        success: true,
        message: "Faculty created successfully",
        data: {
          username: newFaculty.username,
          email: newFaculty.email,
          id: newFaculty.id,
          branch: newFaculty.branch,
        },
      });
    } catch (error) {
      console.error("Error creating faculty account:", error);
      res.status(500).json({
        success: false,
        message: "An internal server error occurred",
        error: error.message,
      });
    }
  },
  bulkCreateFaculty: async (req, res) => {
    try {
      const { facultyList } = req.body;

      if (
        !facultyList ||
        !Array.isArray(facultyList) ||
        facultyList.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or empty faculty list",
        });
      }

      const results = { success: [], errors: [] };

      for (const faculty of facultyList) {
        const { username, email } = faculty;
        const branch = "cspit-it"; // Default branch is always cspit-it

        // Validate required fields
        if (!username || !email) {
          results.errors.push({
            email: email || "unknown",
            message: "Username and email are required",
          });
          continue;
        }

        // Check if email matches expected format (@charusat.ac.in)
        if (!email.endsWith("@charusat.ac.in")) {
          results.errors.push({
            email,
            message: "Email must end with @charusat.ac.in",
          });
          continue;
        }

        try {
          // Check if user with this email already exists
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            results.errors.push({
              email,
              message: "User with this email already exists",
            });
            continue;
          }

          // Extract ID from email (part before @)
          const id = email.split("@")[0];

          // Create new faculty user
          const newFaculty = new User({
            username,
            id,
            email,
            branch,
            password: id, // Set password to be the same as ID
            role: "faculty",
            isApproved: true, // Auto-approve since admin is creating
            firstTimeLogin: true, // User should change password on first login
          });
          // Save the new faculty
          await newFaculty.save();

          results.success.push({
            email,
            id,
            username,
          });
        } catch (error) {
          console.error("Error creating faculty:", error);
          results.errors.push({
            email,
            message: "Error creating faculty: " + error.message,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Bulk faculty creation completed",
        results,
      });
    } catch (error) {
      console.error("Error in bulk faculty creation:", error);
      res.status(500).json({
        success: false,
        message: "An internal server error occurred",
        error: error.message,
      });
    }
  },
  BulkStudentRequests: async (req, res) => {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid or missing students data." });
    }

    try {
      const results = { success: [], errors: [] };

      // Valid batch and semester values for validation
      const validBatches = ["a1", "b1", "c1", "d1", "a2", "b2", "c2", "d2"];
      const validSemesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

      // Bulk register students
      for (const student of students) {
        const { username, id, batch, semester } = student;

        if (!username || !id || !batch || !semester) {
          results.errors.push({
            id: id || "unknown",
            message: "Incomplete student data.",
          });
          continue;
        }

        // Validate batch
        if (!validBatches.includes(batch.toLowerCase())) {
          results.errors.push({
            id,
            message: `Invalid batch "${batch}". Must be one of: ${validBatches.join(
              ", "
            )}`,
          });
          continue;
        }

        // Validate semester
        if (!validSemesters.includes(String(semester))) {
          results.errors.push({
            id,
            message: "Invalid semester. Must be between 1-8",
          });
          continue;
        }
        // Determine the branch based on the 'id'
        let branchCode;

        if (id.toLowerCase().includes("it")) {
          branchCode = "it";
        } else if (id.toLowerCase().includes("ce")) {
          branchCode = "ce";
        } else if (id.toLowerCase().includes("cse")) {
          branchCode = "cse";
        } else {
          branchCode = "unknown"; // Handle cases where the branch is not identified
        }

        if (branchCode === "unknown") {
          results.errors.push({
            id,
            message:
              "ID number is not correct. It must contain 'it', 'ce', or 'cse'.",
          });
          continue;
        }

        // Generate the branch code based on the identified branch
        const branch = `cspit-${branchCode}`;

        const role = "student";
        const password = id; // Default password is student ID
        const emailDomain = "@charusat.edu.in";
        const email = `${id.toLowerCase()}${emailDomain}`;

        try {
          const existingUser = await User.findOne({ id });
          if (existingUser) {
            results.errors.push({ id, message: "User already exists." });
            continue;
          }
          const newUser = new User({
            username,
            id,
            email,
            batch,
            semester,
            password,
            role,
            isApproved: true,
            branch, // Add the branch code to the user object
          });

          await newUser.save();
          results.success.push({
            id,
            message: "User registered successfully.",
          });
        } catch (error) {
          console.error("Error registering user:", error);
          results.errors.push({ id, message: "Error registering user." });
        }
      }

      res.json({
        success: true,
        message: "Bulk registration completed.",
        results,
      });
    } catch (error) {
      console.error("Error in bulk registration:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  },  getStudents: async (req, res) => {
    const { page = 1, limit = 10, branch, batch, sort, search } = req.body;

    try {
      const skip = (page - 1) * limit;
      const query = { role: "student", isApproved: true };
      if (branch) query.branch = branch;
      if (batch) query.batch = batch;
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { branch: { $regex: search, $options: "i" } },
          { batch: { $regex: search, $options: "i" } },
          { id: { $regex: search, $options: "i" } },
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sort === "oldest") sortOption = { createdAt: 1 };

      const students = await User.find(query)
        .select("username batch branch semester id createdAt facultyId")
        .populate("facultyId", "username email")
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

      const totalStudents = await User.countDocuments(query);
      const totalPages = Math.ceil(totalStudents / limit);

      res.status(200).json({
        success: true,
        message: "Students fetched successfully.",
        students,
        totalPages,
        currentPage: page,
        totalStudents,
      });
    } catch (error) {
      console.error("Error in fetching students:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  removeStudent: async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing User ID." });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Check if the user exists and is a student
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found.");
        }

        if (user.role !== "student") {
          throw new Error("User is not a student.");
        }

        const userName = user.id;

        // 1. Remove profile picture from GridFS if exists
        if (user.profile?.avatar) {
          try {
            const bucket = new GridFSBucket(mongoose.connection.db, {
              bucketName: "uploads",
            });
            await bucket.delete(
              new mongoose.Types.ObjectId(user.profile.avatar)
            );
          } catch (gridfsError) {
            console.warn(
              `Failed to delete profile picture for user ${userId}:`,
              gridfsError.message
            );
            // Continue with deletion even if profile picture deletion fails
          }
        }

        // 2. Remove student from all batches' students array
        await Batch.updateMany(
          { students: userId },
          { $pull: { students: userId } },
          { session }
        );

        // 3. Remove student from contests' assignedStudents array
        await Contest.updateMany(
          { assignedStudents: userId },
          { $pull: { assignedStudents: userId } },
          { session }
        );

        // 4. Remove student from problems' assignedStudents array
        await Problem.updateMany(
          { assignedStudents: userId },
          { $pull: { assignedStudents: userId } },
          { session }
        );

        // 5. Remove all submissions related to the user
        await Submission.deleteMany({ user_id: userId }, { session });

        // 6. Remove all codes related to the user
        await Code.deleteMany({ userId: userId }, { session });

        // 7. Finally, remove the user
        await User.deleteOne({ _id: userId }, { session });

        return {
          success: true,
          message: `Student with ID ${userName} and all related data have been successfully removed.`,
        };
      });

      return res.status(200).json({
        success: true,
        message: `Student and all related data have been successfully removed.`,
      });
    } catch (error) {
      console.error("Error in removing student:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error.",
      });
    } finally {
      await session.endSession();
    }
  },
  getDashboardStats: async (req, res) => {
    try {
      // Get count of students, faculty, batches, and contests
      const [studentCount, facultyCount, batchCount, contestCount, contests] =
        await Promise.all([
          User.countDocuments({ role: "student" }),
          User.countDocuments({ role: "faculty" }),
          Batch.countDocuments(), // Using Batch model to count batches directly
          Contest.countDocuments(),
          Contest.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("created_by", "username"),
        ]);

      // Get recent activity (submissions, new users, contest creations)
      const [recentSubmissions, recentUsers, recentBatches] = await Promise.all(
        [
          Submission.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .populate("user_id", "username")
            .lean(),

          User.find()
            .sort({ createdAt: -1 })
            .limit(3)
            .select("username role createdAt")
            .lean(),

          Batch.find()
            .sort({ createdAt: -1 })
            .limit(2)
            .populate("faculty", "username")
            .lean(),
        ]
      );

      // Format recent activity
      const recentActivity = [
        ...recentSubmissions.map((sub) => ({
          id: sub._id,
          userType: "student",
          name: sub.user_id ? sub.user_id.username : "Unknown Student",
          action: "submitted solution",
          timestamp: sub.createdAt,
        })),
        ...recentUsers.map((user) => ({
          id: user._id,
          userType: user.role,
          name: user.username,
          action: "registered",
          timestamp: user.createdAt,
        })),
        ...recentBatches.map((batch) => ({
          id: batch._id,
          userType: "batch",
          name: batch.name,
          action: "batch created",
          timestamp: batch.createdAt,
        })),
        ...contests.map((contest) => ({
          id: contest._id,
          userType: "faculty",
          name: contest.created_by
            ? contest.created_by.username
            : "Unknown Faculty",
          action: "created contest",
          timestamp: contest.createdAt,
        })),
      ]
        // Sort by timestamp (most recent first)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        // Limit to 5 most recent activities
        .slice(0, 5);

      return res.status(200).json({
        success: true,
        studentCount,
        facultyCount,
        batchCount,
        contestCount,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching dashboard statistics",
      });
    }
  },
  createBatch: async (req, res) => {
    try {
      const {
        name,
        description,
        facultyId,
        students,
        subject,
        semester,
        branch,
      } = req.body;

      // Validate required fields
      if (!name || !facultyId) {
        return res.status(400).json({
          success: false,
          message: "Batch name and faculty are required",
        });
      }

      // Check if faculty exists and is a faculty
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== "faculty") {
        return res.status(400).json({
          success: false,
          message: "Invalid faculty ID",
        });
      }

      // Create new batch
      const newBatch = new Batch({
        name,
        description: description || "",
        faculty: facultyId,
        students: students || [],
        subject,
        semester,
        branch,
        createdBy: req.user.id,
      });

      await newBatch.save();

      return res.status(201).json({
        success: true,
        message: "Batch created successfully",
        batch: newBatch,
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating the batch",
        error: error.message,
      });
    }
  },
  getAllBatches: async (req, res) => {
    try {
      const { page = 1, limit = 10, facultyId } = req.body;
      const skip = (page - 1) * limit;

      // Build query - filter by faculty if provided
      const query = facultyId ? { faculty: facultyId } : {};

      // Get batches with pagination
      const batches = await Batch.find(query)
        .populate("faculty", "username email id")
        .populate("students", "username id batch semester branch")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalBatches = await Batch.countDocuments(query);
      const totalPages = Math.ceil(totalBatches / limit);

      return res.status(200).json({
        success: true,
        batches,
        totalPages,
        currentPage: page,
        totalBatches,
      });
    } catch (error) {
      console.error("Error fetching batches:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batches",
        error: error.message,
      });
    }
  },
  getBatchById: async (req, res) => {
    try {
      const { batchId } = req.params;

      const batch = await Batch.findById(batchId)
        .populate("faculty", "username email id")
        .populate("students", "username id batch semester branch");

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      return res.status(200).json({
        success: true,
        batch,
      });
    } catch (error) {
      console.error("Error fetching batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the batch",
        error: error.message,
      });
    }
  },
  updateBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      const {
        name,
        description,
        facultyId,
        subject,
        semester,
        branch,
        isActive,
      } = req.body;

      // Find the batch
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Update batch properties
      if (name) batch.name = name;
      if (description !== undefined) batch.description = description;
      if (facultyId) {
        const faculty = await User.findById(facultyId);
        if (!faculty || faculty.role !== "faculty") {
          return res.status(400).json({
            success: false,
            message: "Invalid faculty ID",
          });
        }
        batch.faculty = facultyId;
      }
      if (subject !== undefined) batch.subject = subject;
      if (semester !== undefined) batch.semester = semester;
      if (branch !== undefined) batch.branch = branch;
      if (isActive !== undefined) batch.isActive = isActive;

      await batch.save();

      return res.status(200).json({
        success: true,
        message: "Batch updated successfully",
        batch,
      });
    } catch (error) {
      console.error("Error updating batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the batch",
        error: error.message,
      });
    }
  },
  deleteBatch: async (req, res) => {
    try {
      const { batchId } = req.params;

      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      await Batch.findByIdAndDelete(batchId);

      return res.status(200).json({
        success: true,
        message: "Batch deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the batch",
        error: error.message,
      });
    }
  },
  addStudentsToBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      const { studentIds } = req.body;

      if (
        !studentIds ||
        !Array.isArray(studentIds) ||
        studentIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Student IDs are required and must be a non-empty array",
        });
      }

      // Find the batch
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Validate that all students exist and are students
      const students = await User.find({
        _id: { $in: studentIds },
        role: "student",
      });

      if (students.length !== studentIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more student IDs are invalid",
        });
      }

      // Add students to batch (avoiding duplicates)
      const existingStudentIds = batch.students.map((id) => id.toString());
      const newStudentIds = studentIds.filter(
        (id) => !existingStudentIds.includes(id.toString())
      );

      if (newStudentIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No new students to add - all already in batch",
          batch,
        });
      }

      batch.students = [...batch.students, ...newStudentIds];
      await batch.save();

      return res.status(200).json({
        success: true,
        message: `${newStudentIds.length} students added to batch successfully`,
        batch,
      });
    } catch (error) {
      console.error("Error adding students to batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while adding students to the batch",
        error: error.message,
      });
    }
  },
  removeStudentsFromBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      const { studentIds } = req.body;

      if (
        !studentIds ||
        !Array.isArray(studentIds) ||
        studentIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Student IDs are required and must be a non-empty array",
        });
      }

      // Find the batch
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found",
        });
      }

      // Remove students from batch
      batch.students = batch.students.filter(
        (studentId) => !studentIds.includes(studentId.toString())
      );

      await batch.save();

      return res.status(200).json({
        success: true,
        message: "Students removed from batch successfully",
        batch,
      });
    } catch (error) {
      console.error("Error removing students from batch:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while removing students from the batch",
        error: error.message,
      });
    }
  },
  getBatchesByFaculty: async (req, res) => {
    try {
      const { facultyId } = req.params;

      // Check if faculty exists
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== "faculty") {
        return res.status(400).json({
          success: false,
          message: "Invalid faculty ID",
        });
      }

      // Get all batches for this faculty
      const batches = await Batch.find({ faculty: facultyId, isActive: true })
        .populate("students", "username id batch semester branch")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        batches,
        count: batches.length,
      });
    } catch (error) {
      console.error("Error fetching faculty batches:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching faculty batches",
        error: error.message,
      });
    }
  },
  registerStudent: async (req, res) => {
    try {
      const { id, username, batch, semester } = req.body;

      // Validate required fields
      if (!id || !username || !batch || !semester) {
        return res.status(400).json({
          success: false,
          message: "ID, username, batch, and semester are required",
        });
      }

      // Check if student ID already exists
      const existingStudent = await User.findOne({ id });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "A student with this ID already exists",
        });
      }

      // Validate batch format (assuming a1, b2, c1, etc. format)
      const validBatches = ["a1", "b1", "c1", "d1", "a2", "b2", "c2", "d2"];
      if (!validBatches.includes(batch.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid batch format. Must be one of: " + validBatches.join(", "),
        });
      }

      // Validate semester (1-8)
      const semesterNum = parseInt(semester);
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
        return res.status(400).json({
          success: false,
          message: "Invalid semester. Must be between 1-8",
        });
      }

      // Create email using ID
      const email = `${id}@charusat.edu.in`;

      // Create new student user
      const newStudent = new User({
        username,
        id: id.toLowerCase(),
        email,
        batch: batch.toLowerCase(),
        semester: semesterNum,
        password: id.toLowerCase(), // Default password is the same as ID
        role: "student",
        isApproved: true, // Auto-approve since admin is creating
        firstTimeLogin: true, // Student should change password on first login
      }); // Save the new student
      await newStudent.save();

      // Send welcome notification
      try {
        const { notificationService } = await import("../app.js");
        if (notificationService) {
          await notificationService.createNotification(
            newStudent._id.toString(),
            "Welcome to Online Programming Submission & Evaluation",
            `Hello ${newStudent.username}, your student account has been created successfully. Use your ID as password for first login.`,
            "account",
            {
              accountType: "student",
              batch: newStudent.batch,
              semester: newStudent.semester,
            }
          );
        }
      } catch (notifError) {
        console.error("Failed to send welcome notification:", notifError);
      }

      res.status(201).json({
        success: true,
        message: "Student registered successfully",
        data: {
          username: newStudent.username,
          id: newStudent.id,
          batch: newStudent.batch,
          semester: newStudent.semester,
        },
      });
    } catch (error) {
      console.error("Error registering student:", error);
      res.status(500).json({
        success: false,
        message: "An internal server error occurred",
        error: error.message,
      });
    }
  },
  getAllBranches: async (req, res) => {
    const branches = await User.distinct("branch", { branch: { $ne: null } });
    res.json(branches);
  },
  getAllBatche: async (req, res) => {
    const batches = await User.distinct("batch", { batch: { $ne: null } });
    res.json(batches);
  },
  editfaculty: async (req, res) => {
    const { _id, username, email, id } = req.body;
    if (!_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing faculty ID." });
    try {
      const updated = await User.findByIdAndUpdate(
        _id,
        { username, email, id },
        { new: true }
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Faculty not found." });
      res.json({
        success: true,
        message: "Faculty updated.",
        faculty: updated,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  editstudent: async (req, res) => {
    const { _id, username, id, batch, semester } = req.body;
    if (!_id)
      return res
        .status(400)
        .json({ success: false, message: "Missing student ID." });
    try {
      const updated = await User.findByIdAndUpdate(
        _id,
        { username, id, batch, semester },
        { new: true }
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      res.json({
        success: true,
        message: "Student updated.",
        student: updated,
      });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  removeFaculty: async (req, res) => {
    const { facultyId } = req.body;

    if (!facultyId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Faculty ID." });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Check if the faculty exists
        const faculty = await User.findById(facultyId).session(session);
        if (!faculty) {
          throw new Error("Faculty not found.");
        }

        if (faculty.role !== "faculty") {
          throw new Error("User is not a faculty member.");
        }

        // 1. Remove profile picture from GridFS if exists
        if (faculty.profile?.avatar) {
          try {
            const bucket = new GridFSBucket(mongoose.connection.db, {
              bucketName: "uploads",
            });
            await bucket.delete(
              new mongoose.Types.ObjectId(faculty.profile.avatar)
            );
          } catch (gridfsError) {
            console.warn(
              `Failed to delete profile picture for faculty ${facultyId}:`,
              gridfsError.message
            );
            // Continue with deletion even if profile picture deletion fails
          }
        }

        // 2. Remove faculty from all batches' faculty field and set to null
        await Batch.updateMany(
          { faculty: facultyId },
          { $unset: { faculty: 1 } },
          { session }
        );

        // 3. Update contests created by this faculty - transfer ownership or delete
        const facultyContests = await Contest.find({
          created_by: facultyId,
        }).session(session);

        // Option 1: Delete contests created by faculty (if no admin should inherit them)
        await Contest.deleteMany({ created_by: facultyId }, { session });

        // Option 2: Transfer to admin (uncomment if preferred)
        // const adminUser = await User.findOne({ role: "admin" }).session(session);
        // if (adminUser) {
        //   await Contest.updateMany(
        //     { created_by: facultyId },
        //     { created_by: adminUser._id },
        //     { session }
        //   );
        // }

        // 4. Update problems created by this faculty
        const facultyProblems = await Problem.find({
          createdBy: facultyId,
        }).session(session);

        // Option 1: Delete problems created by faculty
        await Problem.deleteMany({ createdBy: facultyId }, { session });

        // Option 2: Transfer to admin (uncomment if preferred)
        // if (adminUser) {
        //   await Problem.updateMany(
        //     { createdBy: facultyId },
        //     { createdBy: adminUser._id },
        //     { session }
        //   );
        // }

        // 5. Remove faculty submissions and codes (if any)
        await Submission.deleteMany({ user_id: facultyId }, { session });
        await Code.deleteMany({ userId: facultyId }, { session });

        // 6. Finally, remove the faculty user
        await User.deleteOne({ _id: facultyId }, { session });
      });

      return res.status(200).json({
        success: true,
        message: "Faculty and all related data have been successfully removed.",
      });
    } catch (error) {
      console.error("Error in removing faculty:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error.",
      });
    } finally {
      await session.endSession();
    }
  },

  removeBatch: async (req, res) => {
    const { batchId } = req.body;

    if (!batchId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Batch ID." });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Check if the batch exists
        const batch = await Batch.findById(batchId).session(session);
        if (!batch) {
          throw new Error("Batch not found.");
        }

        const batchName = batch.name;

        // 1. Remove batch from problems' assignedBatches array
        await Problem.updateMany(
          { assignedBatches: batchId },
          { $pull: { assignedBatches: batchId } },
          { session }
        );

        // 2. Update submissions that reference this batch
        // Option 1: Delete submissions related to this batch
        await Submission.deleteMany({ batch_id: batchId }, { session });

        // Option 2: Set batch_id to null (uncomment if preferred)
        // await Submission.updateMany(
        //   { batch_id: batchId },
        //   { $unset: { batch_id: 1 } },
        //   { session }
        // );

        // 3. Update users (students) - remove batch reference
        await User.updateMany(
          { batch: batchId },
          { $unset: { batch: 1 } },
          { session }
        );

        // 4. Handle contests that might reference this batch indirectly
        // Remove batch-specific contest associations if any exist
        const contestsWithBatchStudents = await Contest.find({
          assignedStudents: { $in: batch.students },
        }).session(session);

        // 5. Finally, remove the batch
        await Batch.deleteOne({ _id: batchId }, { session });
      });

      return res.status(200).json({
        success: true,
        message:
          "Batch and all related references have been successfully removed.",
      });
    } catch (error) {
      console.error("Error in removing batch:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error.",
      });
    } finally {
      await session.endSession();
    }
  },
  getAllProblems: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || "";
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";
      
      const skip = (page - 1) * limit;

      // Build search query
      let searchQuery = {};
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        searchQuery.$or = [
          { title: searchRegex },
          { difficulty: searchRegex },
          { 'createdBy.username': searchRegex },
          { 'createdBy.name': searchRegex }
        ];
      }

      // Build sort object
      const sortObject = {};
      if (sortBy === "title") {
        sortObject.title = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "difficulty") {
        sortObject.difficulty = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "totalMarks") {
        sortObject.totalMarks = sortOrder === "asc" ? 1 : -1;
      } else if (sortBy === "createdBy") {
        sortObject["createdBy.username"] = sortOrder === "asc" ? 1 : -1;
      } else {
        // Default sort by createdAt
        sortObject.createdAt = sortOrder === "asc" ? 1 : -1;
      }

      const [problems, total] = await Promise.all([
        Problem.find(searchQuery)
          .populate("createdBy", "username email name") 
          .populate("assignedBatches", "name")
          .sort(sortObject)
          .skip(skip)
          .limit(limit)
          .lean(),
        Problem.countDocuments(searchQuery)
      ]);

      const submissionCount = await Promise.all(
        problems.map(async (problem) => {
          const count = await Submission.countDocuments({ problem_id: problem._id });
          return { ...problem, count };
        })
      );

      res.json({
        success: true,
        problems: submissionCount,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        searchTerm: search,
        sortBy,
        sortOrder
      });
      
    } catch (error) {
      console.error("Error fetching problems:", error);
      res.status(500).json({ success: false, message: "Failed to fetch problems." });
    }
  },

  // New function for resetting user password
  resetUserPassword: async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Reset the password to be the same as ID and set firstTimeLogin to true
      user.password = user.id;
      user.firstTimeLogin = true;
      await user.save();

      // Send notification if possible
      try {
        const { notificationService } = await import("../app.js");
        if (notificationService) {
          await notificationService.createNotification(
            userId,
            "Password Reset",
            `Your password has been reset by an administrator. Please login with your ID as password and set a new password.`,
            "account",
            { type: "password_reset" }
          );
        }
      } catch (notifError) {
        console.error("Failed to send password reset notification:", notifError);
      }

      res.status(200).json({
        success: true,
        message: "User password reset successfully. New password is the user's ID.",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred while resetting the password.",
        error: error.message
      });
    }
  },

  // New function for expiring user session
  expireUserSession: async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    try {
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Clear the session ID to invalidate any active sessions
      user.sessionId = null;
      await user.save();

      // Send notification if possible
      try {
        const { notificationService } = await import("../app.js");
        if (notificationService) {
          await notificationService.createNotification(
            userId,
            "Session Expired",
            `Your session has been expired by an administrator. Please login again.`,
            "account",
            { type: "session_expired" }
          );
        }
      } catch (notifError) {
        console.error("Failed to send session expiration notification:", notifError);
      }

      res.status(200).json({
        success: true,
        message: "User session expired successfully.",
      });
    } catch (error) {
      console.error("Error expiring session:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred while expiring the session.",
        error: error.message
      });
    }
  },

};

export default adminController;
