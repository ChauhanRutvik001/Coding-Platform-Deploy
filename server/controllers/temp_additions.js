// Import batch model - don't include this in final merge
import Batch from "../models/batch.js";

// New methods to add to the problem controller

// Assign problem to batches
export const assignProblemToBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  const { batchIds, dueDate } = req.body; // Array of batch IDs and optional due date

  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    return res.status(400).json({ message: "No batch IDs provided." });
  }

  try {
    // Find the problem
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check authorization - only the creator or admin can assign
    const userId = req.user.id;
    const userRole = req.user.isAdmin;

    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to assign this problem to batches" });
    }

    // Verify all batches exist and are accessible to this faculty
    const batches = await Batch.find({ 
      _id: { $in: batchIds },
      $or: [
        { faculty: userId },
        { createdBy: userId }
      ]
    });
    
    if (batches.length !== batchIds.length) {
      return res.status(400).json({ 
        message: "Some batches don't exist or you don't have permission to assign to them." 
      });
    }

    // Add batches to assignedBatches if not already there
    for (const batchId of batchIds) {
      if (!problem.assignedBatches.includes(batchId)) {
        problem.assignedBatches.push(batchId);
      }
    }

    // Update due date if provided
    if (dueDate) {
      problem.dueDate = new Date(dueDate);
    }

    await problem.save();

    // For each batch, add all the students to assignedStudents (if they're not already there)
    let assignedStudentCount = 0;
    for (const batch of batches) {
      for (const studentId of batch.students) {
        if (!problem.assignedStudents.includes(studentId)) {
          problem.assignedStudents.push(studentId);
          assignedStudentCount++;
        }
      }
    }

    // Save again after adding all students
    await problem.save();

    res.status(200).json({ 
      message: `Problem assigned to ${batches.length} batches and ${assignedStudentCount} new students.`,
      problem 
    });
  } catch (error) {
    console.error("Error assigning problem to batches:", error);
    res.status(500).json({ message: error.message });
  }
};

// Unassign problem from batches
export const unassignBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  const { batchIds } = req.body; // Array of batch IDs to unassign

  if (!Array.isArray(batchIds) || batchIds.length === 0) {
    return res.status(400).json({ message: "No batch IDs provided." });
  }

  try {
    // Find the problem
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Check authorization - only the creator or admin can unassign
    const userId = req.user.id;
    const userRole = req.user.isAdmin;

    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to unassign batches from this problem" });
    }

    // Get all batches to be unassigned
    const batchesToUnassign = await Batch.find({ _id: { $in: batchIds } });
    
    // Create a set of all student IDs in these batches for efficient checking
    const studentsInBatches = new Set();
    for (const batch of batchesToUnassign) {
      batch.students.forEach(studentId => studentsInBatches.add(studentId.toString()));
    }
    
    // Remove the batches from assignedBatches
    problem.assignedBatches = problem.assignedBatches.filter(
      batchId => !batchIds.includes(batchId.toString())
    );
    
    // If a student is in any remaining batch, they should still be assigned
    // First, get all batches that are still assigned to the problem
    const remainingBatchIds = problem.assignedBatches.map(id => id.toString());
    const remainingBatches = await Batch.find({ _id: { $in: remainingBatchIds } });
    
    // Create a set of all students in remaining batches
    const studentsInRemainingBatches = new Set();
    for (const batch of remainingBatches) {
      batch.students.forEach(studentId => studentsInRemainingBatches.add(studentId.toString()));
    }
    
    // Filter assignedStudents to only keep students who are in at least one remaining batch
    problem.assignedStudents = problem.assignedStudents.filter(studentId => {
      const studentIdStr = studentId.toString();
      // Keep if student is in a remaining batch OR if they were assigned individually (not in any batch we're unassigning)
      return studentsInRemainingBatches.has(studentIdStr) || !studentsInBatches.has(studentIdStr);
    });
    
    await problem.save();

    res.status(200).json({
      message: `${batchIds.length} batches unassigned from problem successfully`,
      problem
    });
  } catch (error) {
    console.error("Error unassigning batches from problem:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get problems by batch for students
export const getProblemsByBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { batchId } = req.params;

    // Find the batch and verify the student is in it
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    if (!batch.students.includes(userId)) {
      return res.status(403).json({ message: "You are not a member of this batch" });
    }

    // Find all problems assigned to this batch
    const problems = await Problem.find({ assignedBatches: batchId })
      .select('_id title difficulty createdAt dueDate createdBy')
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      problems,
      totalProblems: problems.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching batch problems:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all batches assigned to a problem
export const getProblemBatches = async (req, res) => {
  const { id } = req.params; // Problem ID
  
  try {
    const problem = await Problem.findById(id).populate({
      path: 'assignedBatches',
      select: 'name description students subject',
      populate: {
        path: 'students',
        select: 'username firstName lastName id email',
        model: 'User'
      }
    });
    
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }
    
    const userId = req.user.id;
    const userRole = req.user.isAdmin;
    
    if (problem.createdBy.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized to view batches for this problem" });
    }
    
    res.status(200).json({
      batches: problem.assignedBatches,
      success: true
    });
    
  } catch (error) {
    console.error("Error fetching problem batches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
