import Batch from "../models/batch.js";
import Problem from "../models/problem.js";
import Submission from "../models/submission.js";

const studentBatchController = {
  // Get all batches that a student is part of (with server-side search & pagination)
  getMyBatches: async (req, res) => {
    try {
      const studentId = req.user.id;
      const {
        search = "",
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      // Build query
      const query = {
        students: studentId,
        isActive: true,
      };
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
        .populate("faculty", "username email id")
        .populate("students", "username id")
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
      console.error("Error fetching student batches:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batches",
      });
    }
  },

  // Get specific batch details
  getBatchDetails: async (req, res) => {
    try {
      const { batchId } = req.params;
      const studentId = req.user.id;

      // Find the batch and ensure the student is part of it
      const batch = await Batch.findOne({
        _id: batchId,
        students: studentId,
        isActive: true,
      })
        .populate("faculty", "username email id")
        .populate("students", "username id email branch semester batch")
        .populate({
          path: "assignedProblems",
          select: "title difficulty createdAt batchDueDates",
          populate: {
            path: "createdBy",
            select: "username",
          },
        });

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found or you don't have access to it",
        });
      }
      const assignedProblemsWithDueDate = batch.assignedProblems.map(
        (problem) => {
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
            dueDate,
            createdBy: problem.createdBy,
          };
        }
      );
      return res.status(200).json({
        success: true,
        batch:{
          ...batch.toObject(),
          assignedProblems: assignedProblemsWithDueDate,  
        }
      });
    } catch (error) {
      console.error("Error fetching batch details:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching batch details",
        error: error.message,
      });
    }
  },

  // Get problems for a batch with search and pagination
  getBatchProblems: async (req, res) => {
    try {
      const { batchId } = req.params;
      const studentId = req.user.id;
      const {
        search = "",
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // First verify the student has access to this batch
      const batch = await Batch.findOne({
        _id: batchId,
        students: studentId,
        isActive: true,
      });

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: "Batch not found or you don't have access to it",
        });
      }

      // Build query for problems
      const query = {
        _id: { $in: batch.assignedProblems },
      };

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { difficulty: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Get problems with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [problems, totalProblems] = await Promise.all([
        Problem.find(query)
          .select("_id title difficulty createdAt batchDueDates")
          .populate("createdBy", "username")
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Problem.countDocuments(query),
      ]);
      const problemsWithDueDate = problems.map((problem) => {
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
          dueDate, // per-batch due date
          createdBy: problem.createdBy,
        };
      });
      return res.status(200).json({
        success: true,
        problems,
        totalProblems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProblems / parseInt(limit)),
      });
    } catch (error) {
      console.error("Error fetching batch problems:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching problems",
        error: error.message,
      });
    }
  },

  // Get batch progress analytics for students
//   getBatchProgress: async (req, res) => {
//     try {
//       const { batchId } = req.params;
//       const studentId = req.user.id;

//       // First verify the student has access to this batch
//       const batch = await Batch.findOne({
//         _id: batchId,
//         students: studentId,
//         isActive: true,
//       }).populate("students", "username id email branch semester batch");

//       if (!batch) {
//         return res.status(404).json({
//           success: false,
//           message: "Batch not found or you don't have access to it",
//         });
//       }

//       // Get all problems assigned to this batch
// const problems = await Problem.find({
//   _id: { $in: batch.assignedProblems }
// }).select('_id title difficulty createdAt batchDueDates');

//       // Get all student IDs in this batch
//       const batchStudentIds = batch.students.map((student) => student._id);

//       // Get all submissions for batch students on batch problems
//       const submissions = await Submission.find({
//         user_id: { $in: batchStudentIds },
//         problem_id: { $in: batch.assignedProblems },
//       })
//         .populate("user_id", "username id")
//         .populate("problem_id", "title difficulty");

//       // Calculate progress statistics
//       const progressStats = {
//         totalStudents: batch.students.length,
//         totalProblems: problems.length,
//         submissionStats: {},
//         problemStats: {},
//         studentStats: {},
//         overallProgress: {},
//       };

//       // Calculate per-problem statistics
//       problems.forEach((problem) => {
//         const problemSubmissions = submissions.filter(
//           (sub) => sub.problem_id._id.toString() === problem._id.toString()
//         );

//         // Get highest marks per student for this problem
//         const studentBestSubmissions = {};
//         problemSubmissions.forEach((sub) => {
//           const studentId = sub.user_id._id.toString();
//           if (
//             !studentBestSubmissions[studentId] ||
//             sub.totalMarks > studentBestSubmissions[studentId].totalMarks
//           ) {
//             studentBestSubmissions[studentId] = sub;
//           }
//         });

//         const bestSubmissions = Object.values(studentBestSubmissions);
//         const studentsAttempted = bestSubmissions.length;
//         const studentsCompleted = bestSubmissions.filter(
//           (sub) =>
//             sub.numberOfTestCasePass === sub.numberOfTestCase &&
//             sub.numberOfTestCase > 0
//         ).length;
//         const studentsPartial = bestSubmissions.filter(
//           (sub) =>
//             sub.numberOfTestCasePass > 0 &&
//             sub.numberOfTestCasePass < sub.numberOfTestCase
//         ).length;

//         progressStats.problemStats[problem._id] = {
//           title: problem.title,
//           difficulty: problem.difficulty,
//           studentsAttempted,
//           studentsCompleted,
//           studentsPartial,
//           completionRate:
//             studentsAttempted > 0
//               ? ((studentsCompleted / studentsAttempted) * 100).toFixed(1)
//               : 0,
//           attemptRate: (
//             (studentsAttempted / progressStats.totalStudents) *
//             100
//           ).toFixed(1),
//           averageScore:
//             bestSubmissions.length > 0
//               ? (
//                   bestSubmissions.reduce((sum, sub) => {
//                     const score =
//                       sub.numberOfTestCase > 0
//                         ? (sub.numberOfTestCasePass / sub.numberOfTestCase) *
//                           100
//                         : 0;
//                     return sum + score;
//                   }, 0) / bestSubmissions.length
//                 ).toFixed(1)
//               : 0,
//         };
//       }); // Calculate per-student statistics
//       batch.students.forEach((student) => {
//         const studentSubmissions = submissions.filter(
//           (sub) => sub.user_id._id.toString() === student._id.toString()
//         );

//         // Get best submission per problem for this student
//         const problemsAttempted = new Set();
//         const problemsCompleted = new Set();
//         let totalScore = 0;
//         let problemsWithScores = 0;

//         const studentBestByProblem = {};
//         const problemDetails = {}; // Add detailed problem status for each student

//         studentSubmissions.forEach((sub) => {
//           const problemId = sub.problem_id._id.toString();
//           if (
//             !studentBestByProblem[problemId] ||
//             sub.totalMarks > studentBestByProblem[problemId].totalMarks
//           ) {
//             studentBestByProblem[problemId] = sub;
//           }
//         });

//         // Calculate problem details for this student
//         problems.forEach((problem) => {
//           const problemId = problem._id.toString();
//           const bestSub = studentBestByProblem[problemId];

//           if (bestSub) {
//             problemsAttempted.add(problemId);
//             const score =
//               bestSub.numberOfTestCase > 0
//                 ? (bestSub.numberOfTestCasePass / bestSub.numberOfTestCase) *
//                   100
//                 : 0;
//             const isCompleted =
//               bestSub.numberOfTestCasePass === bestSub.numberOfTestCase &&
//               bestSub.numberOfTestCase > 0;

//             if (isCompleted) {
//               problemsCompleted.add(problemId);
//             }

//             if (bestSub.numberOfTestCase > 0) {
//               totalScore += score;
//               problemsWithScores++;
//             }

//             problemDetails[problemId] = {
//               status: isCompleted ? "completed" : "attempted",
//               score: score.toFixed(1),
//               testCasesPassed: bestSub.numberOfTestCasePass,
//               totalTestCases: bestSub.numberOfTestCase,
//               submissionDate: bestSub.createdAt,
//             };
//           } else {
//             problemDetails[problemId] = {
//               status: "not_started",
//               score: 0,
//               testCasesPassed: 0,
//               totalTestCases: 0,
//               submissionDate: null,
//             };
//           }
//         });

//         progressStats.studentStats[student._id] = {
//           username: student.username,
//           problemsAttempted: problemsAttempted.size,
//           problemsCompleted: problemsCompleted.size,
//           completionRate:
//             problemsAttempted.size > 0
//               ? (
//                   (problemsCompleted.size / problemsAttempted.size) *
//                   100
//                 ).toFixed(1)
//               : 0,
//           averageScore:
//             problemsWithScores > 0
//               ? (totalScore / problemsWithScores).toFixed(1)
//               : 0,
//           progressPercentage: (
//             (problemsAttempted.size / progressStats.totalProblems) *
//             100
//           ).toFixed(1),
//           problemDetails, // Add individual problem details
//         };
//       });

//       // Calculate overall batch statistics
//       const allStudentStats = Object.values(progressStats.studentStats);
//       progressStats.overallProgress = {
//         averageCompletionRate:
//           allStudentStats.length > 0
//             ? (
//                 allStudentStats.reduce(
//                   (sum, stat) => sum + parseFloat(stat.completionRate),
//                   0
//                 ) / allStudentStats.length
//               ).toFixed(1)
//             : 0,
//         averageScore:
//           allStudentStats.length > 0
//             ? (
//                 allStudentStats.reduce(
//                   (sum, stat) => sum + parseFloat(stat.averageScore),
//                   0
//                 ) / allStudentStats.length
//               ).toFixed(1)
//             : 0,
//         studentsActive: allStudentStats.filter(
//           (stat) => stat.problemsAttempted > 0
//         ).length,
//         totalSubmissions: submissions.length,
//         averageAttemptsPerStudent: (
//           submissions.length / progressStats.totalStudents
//         ).toFixed(1),
//       };

//       return res.status(200).json({
//         success: true,
//         batch: {
//           _id: batch._id,
//           name: batch.name,
//           subject: batch.subject,
//           branch: batch.branch,
//           semester: batch.semester,
//         },
//         progressStats,
//         problems,
//       });
//     } catch (error) {
//       console.error("Error fetching batch progress:", error);
//       return res.status(500).json({
//         success: false,
//         message: "An error occurred while fetching batch progress",
//         error: error.message,
//       });
//     }
//   },
 getBatchProgress: async (req, res) => {
    try {
      const { batchId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const studentId = req.user.id;

      // First verify the student has access to this batch
      const batch = await Batch.findOne({
        _id: batchId,
        students: studentId,
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
        _id: { $in: batch.assignedProblems }
      })
      .select('_id title difficulty createdAt batchDueDates totalMarks')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: 1 }); // Sort by creation date

      // Get all problems for calculating complete statistics (non-paginated)
      const allProblems = await Problem.find({
        _id: { $in: batch.assignedProblems }
      }).select('_id title difficulty createdAt batchDueDates totalMarks');      // CHANGED: Map problems to include only the due date for this batch
      const problemsWithDueDate = problems.map(problem => {
        let dueDate = null;
        if (problem.batchDueDates && problem.batchDueDates.length > 0) {
          const entry = problem.batchDueDates.find(
            (b) => b.batch?.toString() === batchId
          );
          if (entry) {
            dueDate = entry.dueDate;
          }
        }        return {
          _id: problem._id,
          title: problem.title,
          difficulty: problem.difficulty,
          createdAt: problem.createdAt,
          totalMarks: problem.totalMarks || 100, // Include total marks
          dueDate, // per-batch due date
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
        }        return {
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
        });

        const bestSubmissions = Object.values(studentBestSubmissions);
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
        ).length;        // Calculate average marks percentage for this problem
        const problemTotalMarks = problem.totalMarks || 100; // Fallback to 100 if not set
        const averageMarksPercentage = bestSubmissions.length > 0
          ? (bestSubmissions.reduce((sum, sub) => sum + sub.totalMarks, 0) / bestSubmissions.length / problemTotalMarks * 100).toFixed(1)
          : 0;

        progressStats.problemStats[problem._id] = {
          title: problem.title,
          difficulty: problem.difficulty,
          totalMarks: problemTotalMarks,
          dueDate: problem.dueDate, // include due date in stats
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
        );        // Get best submission per problem for this student
        const problemsAttempted = new Set();
        const problemsCompleted = new Set();
        let totalMarksEarned = 0;
        let totalPossibleMarks = 0;
        const submissionDates = []; // For tie-breaking
        
        // Calculate total possible marks for all problems in the batch
        problemsWithDueDate.forEach((problem) => {
          totalPossibleMarks += problem.totalMarks;
        });

        const studentBestByProblem = {};
        const problemDetails = {}; // Add detailed problem status for each student

        studentSubmissions.forEach((sub) => {
          const problemId = sub.problem_id._id.toString();
          if (
            !studentBestByProblem[problemId] ||
            sub.totalMarks > studentBestByProblem[problemId].totalMarks
          ) {
            studentBestByProblem[problemId] = sub;
          }
        });        // Calculate problem details for this student
        allProblemsWithDueDate.forEach((problem) => {
          const problemId = problem._id.toString();
          const bestSub = studentBestByProblem[problemId];          if (bestSub) {
            problemsAttempted.add(problemId);
            totalMarksEarned += bestSub.totalMarks;
            submissionDates.push(new Date(bestSub.createdAt));

            const isCompleted =
              bestSub.numberOfTestCasePass === bestSub.numberOfTestCase &&
              bestSub.numberOfTestCase > 0;

            if (isCompleted) {
              problemsCompleted.add(problemId);
            }

            let status = 'attempted';
            if (isCompleted) {
              status = 'completed';
            } else if (bestSub.numberOfTestCasePass === 0) {
              status = 'failed';
            } else if (bestSub.numberOfTestCasePass > 0 && bestSub.numberOfTestCasePass < bestSub.numberOfTestCase) {
              status = 'partial';
            }

            problemDetails[problemId] = {
              status: status,
              score: problem.totalMarks > 0 ? ((bestSub.totalMarks / problem.totalMarks) * 100).toFixed(1) : 0,
              totalMarks: bestSub.totalMarks,
              maxMarks: problem.totalMarks,
              testCasesPassed: bestSub.numberOfTestCasePass,
              totalTestCases: bestSub.numberOfTestCase,
              submissionDate: bestSub.createdAt,
              dueDate: problem.dueDate, // include due date in details
            };
          } else {
            problemDetails[problemId] = {
              status: "not_started",
              score: 0,
              totalMarks: 0,
              maxMarks: problem.totalMarks,
              testCasesPassed: 0,
              totalTestCases: 0,
              submissionDate: null,
              dueDate: problem.dueDate, // include due date in details
            };
          }
        });

        // Calculate submission timing sum for tie-breaking
        const submissionTimingSum = submissionDates.reduce((sum, date) => sum + date.getTime(), 0);

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
          problemDetails, // Add individual problem details
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
            : 0,        totalMarksEarned: totalMarksInBatch,
        studentsActive: allStudentStats.filter(
          (stat) => stat.problemsAttempted > 0
        ).length,
        totalSubmissions: submissions.length,
        averageAttemptsPerStudent: (
          submissions.length / progressStats.totalStudents
        ).toFixed(1),
      };

      return res.status(200).json({
        success: true,
        batch: {
          _id: batch._id,
          name: batch.name,
          subject: batch.subject,
          branch: batch.branch,
          semester: batch.semester,
        },
        progressStats,
        problems: problemsWithDueDate, // return problems with due dates
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

export default studentBatchController;
