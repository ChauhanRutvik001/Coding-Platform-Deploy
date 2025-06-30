import Contest from "../models/contest.js";
import user from "../models/user.js";
import Problem from "../models/problem.js";
import Submission from "../models/submission.js";

// Function to determine contest status based on current time
const determineStatus = (start_time, end_time) => {
  const now = new Date();
  if (now < start_time) {
    return "upcoming"; // Contest has not started yet
  } else if (now >= start_time && now <= end_time) {
    return "ongoing"; // Contest is currently live
  } else {
    return "completed"; // Contest has ended
  }
};

// Create a new contest
export const createContest = async (req, res) => {
  try {
    const {
      name,
      description,
      created_by,
      problems,
      start_time,
      end_time,
    } = req.body;

    // Validate required fields
    if (!name || !description || !created_by || !start_time || !end_time) {
      return res.status(400).json({
        error:
          "Name, description, creator, start time, and end time are required",
      });
    }

    // Convert to Date objects
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Validate date-time values
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ error: "Start time must be before end time" });
    }

    // Determine contest status
    const status = determineStatus(startTime, endTime);

    // Create a new contest instance
    const newContest = new Contest({
      name,
      description,
      created_by,
      problems,
      start_time: startTime,
      end_time: endTime,
      status,
    });

    console.log(newContest);

    // Save the contest to the database
    await newContest.save();
    res.status(201).json(newContest);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Update a contest
export const updateContest = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    created_by,
    problems,
    start_time,
    end_time,
  } = req.body;

  try {
    // Convert to Date objects
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    // Validate date-time values
    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ error: "Start time must be before end time" });
    }

    // Determine contest status
    const status = determineStatus(startTime, endTime);

    const updatedContest = await Contest.findByIdAndUpdate(
      id,
      {
        name,
        description,
        problems,
        start_time: startTime,
        end_time: endTime,
        status,
      },
      { new: true, runValidators: true }
    );

    if (!updatedContest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    res.status(200).json(updatedContest);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a contest
export const deleteContest = async (req, res) => {
  const { id } = req.params;

  try {
    // Find and delete the contest
    const deletedContest = await Contest.findByIdAndDelete(id);

    if (!deletedContest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Remove assigned students from all problems in the contest
    const problemUpdates = deletedContest.problems.map(async (problemId) => {
      const problem = await Problem.findById(problemId);
      if (problem) {
        problem.assignedStudents = problem.assignedStudents.filter(
          (studentId) => !deletedContest.assignedStudents.includes(studentId)
        );
        await problem.save();
      }
    });

    await Promise.all(problemUpdates);

    res.status(204).send(); // No content
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getContestById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming authentication middleware attaches user info
  const userRole = req.user.isAdmin; // Get user role from authentication

  try {
    const contest = await Contest.findById(id)
      .populate("created_by")
      .populate("problems");

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    // Access control logic:
    if (
      userRole === "admin" || // Admin can access all contests
      (userRole === "faculty" &&
        contest.created_by._id.toString() === userId.toString()) || // Faculty can access only their own contests
      (userRole === "student" && contest.assignedStudents.includes(userId)) // Student can access only assigned contests
    ) {
      return res.status(200).json(contest);
    }

    return res
      .status(403)
      .json({ error: "You do not have access to this contest." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Get all contests
export const getAllContests = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authentication middleware
    const userRole = req.user.isAdmin; // Get user role

    let contests;

    if (userRole === "admin") {
      // Admins can see all contests
      contests = await Contest.find().populate("problems");
    } else if (userRole === "faculty") {
      // Faculty can only see contests they created
      contests = await Contest.find({ created_by: userId }).populate(
        "problems"
      );
    } else if (userRole === "student") {
      // Students can only see contests they are assigned to
      contests = await Contest.find({ assignedStudents: userId }).populate(
        "problems"
      );
    } else {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Update contest status dynamically
    const now = new Date();
    contests.forEach((contest) => {
      contest.status = determineStatus(contest.start_time, contest.end_time);
    });

    res.status(200).json(contests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const assignContestToStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const { id } = req.params;

    if (!id || !studentIds || !Array.isArray(studentIds)) {
      return res
        .status(400)
        .json({ error: "Contest ID and valid student IDs are required." });
    }

    // Find contest
    const contest = await Contest.findById(id).populate("problems");
    if (!contest) {
      return res.status(404).json({ error: "Contest not found." });
    }

    // Assign students to the contest
    contest.assignedStudents = [
      ...new Set([...contest.assignedStudents, ...studentIds]),
    ];

    // Assign students to all problems within the contest
    const problemUpdates = contest.problems.map(async (problemId) => {
      const problem = await Problem.findById(problemId);
      if (problem) {
        problem.assignedStudents = [
          ...new Set([...problem.assignedStudents, ...studentIds]),
        ];
        await problem.save();
      }
    });

    await Promise.all(problemUpdates);
    await contest.save();

    res
      .status(200)
      .json({ message: "Contest assigned to students successfully.", contest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getAssignedStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch, semester, batch } = req.query;
    console.log(req.query);

    if (!id) {
      return res.status(400).json({ error: "Contest ID is required." });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found." });
    }

    const filter = {
      _id: { $in: contest.assignedStudents },
      role: "student",
    };

    if (branch && branch !== "ALL") {
      filter.branch = branch;
    }
    if (semester && semester !== "ALL") {
      filter.semester = semester;
    }
    if (batch && batch !== "ALL") {
      filter.batch = batch;
    }

    const assignedStudents = await user
      .find(filter)
      .select("username semester batch branch _id id");

    res.status(200).json({ assignedStudents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getUnassignedStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch, semester, batch } = req.query;
    console.log(req.query);

    if (!id) {
      return res.status(400).json({ error: "Contest ID is required." });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return res.status(404).json({ error: "Contest not found." });
    }

    const filter = {
      _id: { $nin: contest.assignedStudents },
      role: "student", // Exclude assigned students
    };

    if (branch && branch !== "ALL") {
      filter.branch = branch;
    }
    if (semester && semester !== "ALL") {
      filter.semester = semester;
    }
    if (batch && batch !== "ALL") {
      filter.batch = batch;
    }

    // // Fetch students who are NOT assigned to this contest
    // const unassignedStudents = await user
    //   .find({
    //     _id: { $nin: contest.assignedStudents },
    //     role: "student", // Exclude assigned students
    //   })
    //   .select("username semester batch branch _id id");

    const unassignedStudents = await user
      .find(filter)
      .select("username semester batch branch _id id");

    res.status(200).json({ unassignedStudents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const unassignContestToStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const { id } = req.params; // Contest ID from params

    if (!id || !studentIds || !Array.isArray(studentIds)) {
      return res
        .status(400)
        .json({ error: "Contest ID and valid student IDs are required." });
    }

    // Find contest
    const contest = await Contest.findById(id).populate("problems");
    if (!contest) {
      return res.status(404).json({ error: "Contest not found." });
    }

    // Remove students from the contest's assignedStudents list
    contest.assignedStudents = contest.assignedStudents.filter(
      (studentId) => !studentIds.includes(studentId.toString())
    );

    // Remove students from all problems within the contest
    const problemUpdates = contest.problems.map(async (problemId) => {
      const problem = await Problem.findById(problemId);
      if (problem) {
        problem.assignedStudents = problem.assignedStudents.filter(
          (studentId) => !studentIds.includes(studentId.toString())
        );
        await problem.save();
      }
    });

    await Promise.all(problemUpdates);
    await contest.save();

    res.status(200).json({
      message: "Students unassigned from contest successfully.",
      contest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const getContestDashboard = async (req, res) => {
  const { id } = req.params;
  const { 
    page = 1, 
    limit = 10,
    sortBy = 'totalMarks',
    sortOrder = 'desc',
    branch = 'ALL',
    semester = 'ALL',
    batch = 'ALL'
  } = req.query;

  try {
    const contest = await Contest.findById(id).populate('problems');
    if (!contest) {
      return res.status(404).json({ error: "Contest not found." });
    }

    // Get all problems in the contest
    const problemNames = contest.problems.map(problem => ({
      id: problem._id,
      name: problem.name,
      maxMarks: problem.maxMarks
    }));

    // Get submissions with detailed student info
    const submissions = await Submission.find(
      { problem_id: { $in: contest.problems.map(p => p._id) } },
      {
        totalMarks: 1,
        createdAt: 1,
        problem_id: 1,
        _id: 1
      }
    ).populate({
      path: "user_id",
      select: "id username branch semester batch _id role",
      match: { 
        role: "student",
        ...(branch !== 'ALL' && { branch }),
        ...(semester !== 'ALL' && { semester }),
        ...(batch !== 'ALL' && { batch })
      }
    }).lean();

    // Group submissions by student and track problem-wise marks
    const studentScores = submissions.reduce((acc, submission) => {
      if (!submission.user_id) return acc;
      
      const studentId = submission.user_id._id.toString();
      
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId: submission.user_id.id,
          username: submission.user_id.username,
          branch: submission.user_id.branch,
          semester: submission.user_id.semester,
          batch: submission.user_id.batch,
          totalMarks: 0,
          lastSubmissionTime: new Date(0),
          problemMarks: Array(problemNames.length).fill(0),
          submissionCount: 0
        };
      }

      // Update problem-specific marks
      const problemIndex = problemNames.findIndex(p => 
        p.id.toString() === submission.problem_id.toString()
      );
      if (problemIndex !== -1) {
        acc[studentId].problemMarks[problemIndex] = Math.max(
          acc[studentId].problemMarks[problemIndex],
          submission.totalMarks
        );
      }
      
      acc[studentId].totalMarks = acc[studentId].problemMarks.reduce((sum, mark) => sum + mark, 0);
      acc[studentId].submissionCount++;
      
      const submissionTime = new Date(submission.createdAt);
      if (submissionTime > acc[studentId].lastSubmissionTime) {
        acc[studentId].lastSubmissionTime = submissionTime;
      }
      
      return acc;
    }, {});

    // Convert to array and format dates
    let rankings = Object.values(studentScores).map(student => ({
      ...student,
      lastSubmissionDate: student.lastSubmissionTime.toLocaleDateString(),
      lastSubmissionTime: student.lastSubmissionTime.toLocaleTimeString(),
    }));

    // Apply sorting
    rankings.sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      
      switch(sortBy) {
        case 'totalMarks':
          if (b.totalMarks !== a.totalMarks) {
            return (b.totalMarks - a.totalMarks) * order;
          } else {
            return a.studentId.localeCompare(b.studentId) * order;
          }
        case 'studentId':
          return a.studentId.localeCompare(b.studentId) * order;
        default:
          return (b.totalMarks - a.totalMarks) * order;
      }
    });

    // Add ranks after sorting
    rankings = rankings.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    // Apply pagination
    const totalStudents = rankings.length;
    const totalPages = Math.ceil(totalStudents / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedRankings = rankings.slice(startIndex, endIndex);

    res.status(200).json({
      contestName: contest.name,
      problemNames,
      rankings: paginatedRankings,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalStudents,
        limit: Number(limit)
      },
      sortOptions: {
        current: sortBy,
        order: sortOrder
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};