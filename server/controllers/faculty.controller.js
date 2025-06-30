import User from "../models/user.js";
import bcrypt from "bcrypt";
import Code from "../models/Code.js";
import Submission from "../models/submission.js";
import Batch from "../models/batch.js";
import Problem from "../models/problem.js";
import Contest from "../models/contest.js";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const facultyController = {
  getStudents: async (req, res) => {
    const { facultyId, page = 1, limit = 10 } = req.body;

    if (!facultyId) {
      return res
        .status(400)
        .json({ success: false, message: "Faculty ID is required." });
    }

    try {
      const skip = (page - 1) * limit; // Calculate the number of documents to skip

      const students = await User.find({
        facultyId,
        role: "student",
        isApproved: true,
      })
        .select("username batch branch semester id createdAt")
        .sort({ id: 1 })
        .skip(skip)
        .limit(limit);

      // Get total count of approved students for this faculty
      const totalStudents = await User.countDocuments({
        facultyId,
        role: "student",
        isApproved: true,
      });

      // Calculate total pages and return data
      const totalPages = Math.ceil(totalStudents / limit);

      res.status(200).json({
        success: true,
        message: "Students fetched successfully.",
        students,
        totalPages, // Include totalPages
        currentPage: page,
        totalStudents,
      });
    } catch (error) {
      console.error("Error in fetching students by faculty ID:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },

  expireSession: async (req, res) => {
    const { userId } = req.body;

    console.log("User ID received:", userId);

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    try {
      // Find the user by ID and clear their sessionId
      const user = await User.findOneAndUpdate(
        { _id: userId },
        { sessionId: null },
        { new: true }
      );

      console.log("User found:", user);

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message: "User not found or already logged out.",
          });
      }

      res.status(200).json({
        success: true,
        message: "Session expired successfully. User has been logged out.",
      });
    } catch (error) {
      console.error("Error expiring session:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  },
  removeUser: async (req, res) => {
    const { userId } = req.params;

    console.log("User ID received:", userId);

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing User ID." });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Check if the user exists
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found.");
        }

        console.log("User found:", user);
        const userName = user.id;

        // Only allow removal of students by faculty
        if (user.role !== "student") {
          throw new Error("Faculty can only remove students.");
        }

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
      });

      return res.status(200).json({
        success: true,
        message: `Student and all related data have been successfully removed.`,
      });
    } catch (error) {
      console.error("Error in removing user:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error.",
      });
    } finally {
      await session.endSession();
    }
  },

  // Batch related functions for faculty
  getMyBatches: async (req, res) => {
    try {
      const facultyId = req.user.id;
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      // Build query
      const query = { faculty: facultyId, isActive: true };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }
      // Build sort
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
      // Query batches
      const batches = await Batch.find(query)
        .populate("students", "username id batch semester branch")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));
      const totalBatches = await Batch.countDocuments(query);
      const totalPages = Math.ceil(totalBatches / limit);
      return res.status(200).json({
        success: true,
        batches,
        totalBatches,
        totalPages,
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.error("Error fetching faculty batches:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batches",
      });
    }
  },
  getBatchDetails: async (req, res) => {
    try {
      const { batchId } = req.params;
      const facultyId = req.user.id;
      
      // Find the batch and ensure it belongs to this faculty
      const batch = await Batch.findOne({ _id: batchId, faculty: facultyId })
        .populate('students', 'username id batch semester branch email')
        .populate('faculty', 'username email id')
        
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found or you don't have access to it"
        });
      }
      
      // Explicitly populate the assignedProblems array with full problem details
      await Batch.populate(batch, {
        path: 'assignedProblems',
        select: 'title difficulty createdAt dueDate batchDueDates',
        populate: {
          path: 'createdBy',
          select: 'username'
        }
      });
      
      return res.status(200).json({
        success: true,
        batch
      });
    } catch (error) {
      console.error("Error fetching batch details:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batch details",
        error: error.message
      });
    }
  },  // Get batch progress analytics for faculty
  getBatchProgress: async (req, res) => {
    try {
      const { batchId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const facultyId = req.user.id;

      // First verify the faculty has access to this batch
      const batch = await Batch.findOne({
        _id: batchId,
        faculty: facultyId,
        isActive: true,
      }).populate("students", "username id email branch semester batch");

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found or you don't have access to it",
        });
      }

      // Calculate pagination for problems
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalProblemsCount = batch.assignedProblems.length;
      const totalPages = Math.ceil(totalProblemsCount / parseInt(limit));

      // Get paginated problems assigned to this batch
      const problems = await Problem.find({
        _id: { $in: batch.assignedProblems },
      })
      .select("_id title difficulty createdAt batchDueDates totalMarks")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

      // Get all problems for calculating complete statistics (non-paginated)
      const allProblems = await Problem.find({
        _id: { $in: batch.assignedProblems },
      }).select("_id title difficulty createdAt batchDueDates totalMarks");

      // Map problems to include only the due date for this batch
      const problemsWithDueDate = problems.map(problem => {
        let dueDate = null;
        if (problem.batchDueDates && problem.batchDueDates.length > 0) {
          const entry = problem.batchDueDates.find(
            (b) => b.batch?.toString() === batchId
          );
          if (entry) {
            dueDate = entry.dueDate;
          }
        }
        return {
          _id: problem._id,
          title: problem.title,
          difficulty: problem.difficulty,
          createdAt: problem.createdAt,
          totalMarks: problem.totalMarks || 100,
          dueDate,
        };
      });

      // Map all problems for complete statistics
      const allProblemsWithDueDate = allProblems.map(problem => {
        let dueDate = null;
        if (problem.batchDueDates && problem.batchDueDates.length > 0) {
          const entry = problem.batchDueDates.find(
            (b) => b.batch?.toString() === batchId
          );
          if (entry) {
            dueDate = entry.dueDate;
          }
        }
        return {
          _id: problem._id,
          title: problem.title,
          difficulty: problem.difficulty,
          createdAt: problem.createdAt,
          totalMarks: problem.totalMarks || 100,
          dueDate,
        };
      });

      // Get all student IDs in this batch
      const batchStudentIds = batch.students.map((student) => student._id);

      // Get all submissions for batch students on batch problems
      const submissions = await Submission.find({
        user_id: { $in: batchStudentIds },
        problem_id: { $in: batch.assignedProblems },
      })
        .populate("user_id", "username id")
        .populate("problem_id", "title difficulty");      // Calculate progress statistics
      const progressStats = {
        totalStudents: batch.students.length,
        totalProblems: allProblemsWithDueDate.length, // Use all problems count
        submissionStats: {},
        problemStats: {},
        studentStats: {},
        overallProgress: {},
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProblems: totalProblemsCount,
          limit: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      };

      // Calculate per-problem statistics for all problems (for complete stats)
      allProblemsWithDueDate.forEach((problem) => {
        const problemSubmissions = submissions.filter(
          (sub) => sub.problem_id._id.toString() === problem._id.toString()
        );

        // Get highest marks per student for this problem
        const studentBestSubmissions = {};
        problemSubmissions.forEach((sub) => {
          const studentId = sub.user_id._id.toString();
          if (
            !studentBestSubmissions[studentId] ||
            sub.totalMarks > studentBestSubmissions[studentId].totalMarks
          ) {
            studentBestSubmissions[studentId] = sub;
          }
        });        const bestSubmissions = Object.values(studentBestSubmissions);
        const studentsAttempted = bestSubmissions.length;
        const studentsCompleted = bestSubmissions.filter(
          (sub) =>
            sub.numberOfTestCasePass === sub.numberOfTestCase &&
            sub.numberOfTestCase > 0
        ).length;
        const studentsPartial = bestSubmissions.filter(
          (sub) =>
            sub.numberOfTestCasePass > 0 &&
            sub.numberOfTestCasePass < sub.numberOfTestCase
        ).length;

        // Calculate average marks percentage for this problem
        const problemTotalMarks = problem.totalMarks || 100; // Fallback to 100 if not set
        const averageMarksPercentage = bestSubmissions.length > 0
          ? (bestSubmissions.reduce((sum, sub) => sum + sub.totalMarks, 0) / bestSubmissions.length / problemTotalMarks * 100).toFixed(1)
          : 0;

        progressStats.problemStats[problem._id] = {
          title: problem.title,
          difficulty: problem.difficulty,
          totalMarks: problemTotalMarks,
          studentsAttempted,
          studentsCompleted,
          studentsPartial,
          completionRate:
            studentsAttempted > 0
              ? ((studentsCompleted / studentsAttempted) * 100).toFixed(1)
              : 0,
          attemptRate: (
            (studentsAttempted / progressStats.totalStudents) *
            100
          ).toFixed(1),
          averageMarksPercentage: averageMarksPercentage,
        };
      });      // Calculate per-student statistics
      batch.students.forEach((student) => {
        const studentSubmissions = submissions.filter(
          (sub) => sub.user_id._id.toString() === student._id.toString()
        );

        // Get best submission per problem for this student
        const problemsAttempted = new Set();
        const problemsCompleted = new Set();
        let totalMarksEarned = 0;
        let totalPossibleMarks = 0;
        const submissionDates = []; // For tie-breaking        // Calculate total possible marks for all problems in the batch
        allProblemsWithDueDate.forEach((problem) => {
          totalPossibleMarks += problem.totalMarks || 100;
        });

        const studentBestByProblem = {};
        studentSubmissions.forEach((sub) => {
          const problemId = sub.problem_id._id.toString();
          if (
            !studentBestByProblem[problemId] ||
            sub.totalMarks > studentBestByProblem[problemId].totalMarks
          ) {
            studentBestByProblem[problemId] = sub;
          }
        });        Object.values(studentBestByProblem).forEach((sub) => {
          const problemId = sub.problem_id._id.toString();
          
          problemsAttempted.add(problemId);
          totalMarksEarned += sub.totalMarks;
          
          // Add submission date for tie-breaking
          submissionDates.push(new Date(sub.createdAt));
          
          if (
            sub.numberOfTestCasePass === sub.numberOfTestCase &&
            sub.numberOfTestCase > 0
          ) {
            problemsCompleted.add(problemId);
          }
        });

        // Calculate submission timing sum for tie-breaking (sum of timestamps)
        const submissionTimingSum = submissionDates.reduce((sum, date) => sum + date.getTime(), 0);

        // Create problem details for this student
        const problemDetails = {};
        Object.values(studentBestByProblem).forEach((sub) => {
          const problemId = sub.problem_id._id.toString();
          const problem = allProblemsWithDueDate.find(p => p._id.toString() === problemId);
          const problemTotalMarks = problem ? problem.totalMarks : 100;
          
          let status = 'attempted';
          if (sub.numberOfTestCasePass === sub.numberOfTestCase && sub.numberOfTestCase > 0) {
            status = 'completed';
          } else if (sub.numberOfTestCasePass === 0) {
            status = 'failed';
          } else {
            status = 'partial';
          }
          
          problemDetails[problemId] = {
            status: status,
            score: problemTotalMarks > 0 ? ((sub.totalMarks / problemTotalMarks) * 100).toFixed(1) : 0,
            totalMarks: sub.totalMarks,
            maxMarks: problemTotalMarks,
            submissionDate: sub.createdAt
          };
        });

        progressStats.studentStats[student._id] = {
          _id: student._id,
          username: student.username,
          email: student.email,
          id: student.id,
          branch: student.branch,
          semester: student.semester,
          batch: student.batch,
          problemsAttempted: problemsAttempted.size,
          problemsCompleted: problemsCompleted.size,
          totalMarksEarned: totalMarksEarned,
          totalPossibleMarks: totalPossibleMarks,
          submissionTimingSum: submissionTimingSum, // For tie-breaking
          problemDetails: problemDetails, // Individual problem details
          completionRate:
            problemsAttempted.size > 0
              ? (
                  (problemsCompleted.size / problemsAttempted.size) *
                  100
                ).toFixed(1)
              : 0,          scorePercentage:
            totalPossibleMarks > 0
              ? ((totalMarksEarned / totalPossibleMarks) * 100).toFixed(1)
              : "0.0",
          progressPercentage: (
            (problemsAttempted.size / progressStats.totalProblems) *
            100
          ).toFixed(1),
        };
      });      // Calculate overall batch statistics
      const allStudentStats = Object.values(progressStats.studentStats);
      const totalMarksInBatch = allStudentStats.reduce((sum, stat) => sum + stat.totalMarksEarned, 0);
      
      progressStats.overallProgress = {
        averageCompletionRate:
          allStudentStats.length > 0
            ? (
                allStudentStats.reduce(
                  (sum, stat) => sum + parseFloat(stat.completionRate),
                  0
                ) / allStudentStats.length
              ).toFixed(1)
            : 0,
        averageScorePercentage:
          allStudentStats.length > 0
            ? (
                allStudentStats.reduce(
                  (sum, stat) => sum + parseFloat(stat.scorePercentage),
                  0
                ) / allStudentStats.length
              ).toFixed(1)
            : 0,
        totalMarksEarned: totalMarksInBatch,
        studentsActive: allStudentStats.filter(
          (stat) => stat.problemsAttempted > 0
        ).length,
        totalSubmissions: submissions.length,
        averageAttemptsPerStudent: (
          submissions.length / progressStats.totalStudents
        ).toFixed(1),
      };      return res.status(200).json({
        success: true,
        batch: {
          _id: batch._id,
          name: batch.name,
          subject: batch.subject,
          branch: batch.branch,
          semester: batch.semester,
        },
        progressStats,
        problems: problemsWithDueDate, // return paginated problems with due dates
      });
    } catch (error) {
      console.error("Error fetching batch progress:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batch progress",
        error: error.message,
      });
    }
  },
};

export default facultyController;
