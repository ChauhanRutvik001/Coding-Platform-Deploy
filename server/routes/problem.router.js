import express from 'express';
import {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  updateProblemDueDate,
  deleteProblem,
  assignProblemToStudents,
  assignProblemToBatches,
  getProblemWithStudents,
  getStudents,
  getProblemWithUnassignedStudents,
  unassignStudents,
  unassignBatches,
  getProblemByIdForUpdate,
  getProblemBatches,
  getProblemsByBatch,
  getRecentDueProblems,
  getProblemDetails
} from '../controllers/problem.controller.js';
import { isAdminOrFaculty, isAuthorized } from '../middlewares/auth.js';

const router = express.Router();
router.use(isAuthorized);

// Admin/Faculty only routes - Problem CRUD
router.post('/',  isAdminOrFaculty, createProblem); // Used by: Problem/ProblemForm.jsx (line 356) - Create problem
router.put('/:id',  isAdminOrFaculty, updateProblem); // Used by: Problem/ProblemForm.jsx (line 356), Problem/BatchAssignedStudents.jsx (line 114) - Update problem
router.patch('/:id',  isAdminOrFaculty, updateProblemDueDate); // Used for due date updates (not directly visible in current components)
router.delete('/:id',  isAdminOrFaculty, deleteProblem); // Used by: Problem/MakeProblem.jsx (line 64) - Delete problem
router.get('/getStudents', isAdminOrFaculty, getStudents); // Used by: Admin/StudentInfo.jsx (line 18), Admin/SemesterStudentList.jsx (line 20)
router.get('/getProblemByIdForUpdate/:id', isAdminOrFaculty, getProblemByIdForUpdate); // Used by: Problem/ProblemForm.jsx (line 57) - Edit problem

// Problem assignment routes (Admin/Faculty only)
router.post('/:id/assign', isAdminOrFaculty, assignProblemToStudents); // Used for assigning problems to students (not directly visible in current components)
router.get('/:id/students', isAdminOrFaculty, getProblemWithStudents); // Used for getting students assigned to a problem (not directly visible in current components)
router.get('/:id/unassignStudent', isAdminOrFaculty, getProblemWithUnassignedStudents); // Used for getting unassigned students (not directly visible in current components)
router.post('/:id/unassign-students', isAdminOrFaculty, unassignStudents); // Used for unassigning students from problems (not directly visible in current components)
router.post('/:id/assignBatches', isAdminOrFaculty, assignProblemToBatches); // Used by: Problem/BatchAssignedStudents.jsx (line 94) - Assign problem to batches
router.post('/:id/unassign-batches', isAdminOrFaculty, unassignBatches); // Used by: Problem/BatchAssignedStudents.jsx (line 105) - Unassign batches from problem
router.get('/:id/batches', isAdminOrFaculty, getProblemBatches); // Used by: Problem/BatchAssignedStudents.jsx (line 45) - Get batches assigned to problem
router.get('/batch/:batchId', getProblemsByBatch); // Used by: Problem/BatchProblems.jsx (line 24) - Get problems by batch for students
router.get('/recent-due-problems', isAuthorized, getRecentDueProblems)
// Public routes (All authenticated users)
router.get('/problems', getProblems); // Used for problem listing (not directly visible in current components)
router.get('/:id', getProblemById); // Used by: Problem/ProblemShow.jsx (line 42), Problem/BatchAssignedStudents.jsx (line 39) - Get problem details
// Get detailed problem info with batch details
router.get('/:id/details', getProblemDetails);

export default router;
