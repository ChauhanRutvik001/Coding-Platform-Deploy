import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./Layout";
import Login from "./Login";
import Browse from "./Browse";
import Student from "./Student";
import MakeContest from "./Contest/MakeContest";
import CreateContest from "./Contest/CreateContest";
import MakeProblem from "./Problem/MakeProblem";
import ProblemForm from "./Problem/ProblemForm";
import ProblemShow from "./Problem/ProblemShow";
import NotFoundError from "./NotFoundError";
import Contest from "./Contest/Contest";
import Profile from "./Profile/Profile";
import AdminPage from "./Admin/AdminPage";
import Dashboard from "./Problem/Dashboard";
import History from "./History";
import AdminRegister from "./Admin/AdminRegister";
import CreateFaculty from "./Admin/CreateFaculty";
import { default as AdminStudentRegister } from "./Admin/StudentRegister";
import StudentList from "./Admin/StudentList";
import StudentInfo from "./Admin/StudentInfo";
import Details from "./Problem/Details";
import Support from "./Support";
import AssignedContest from "./Contest/AssignedContest";
import UnAssignContest from "./Contest/UnAssignContest";
import Duplicate from "./Duplicate";
import ContestDashboard from "./Contest/ContestDashboard";
import BatchManagement from "./Admin/BatchManagement";
import CreateBatch from "./Admin/CreateBatch";
import BatchDetails from "./Admin/BatchDetails";
import FacultyBatchList from "./Faculty/BatchList";
import FacultyBatchDetails from "./Faculty/BatchDetails";
import FacultyBatchProgress from "./Faculty/BatchProgress";
import StudentBatchList from "./Student/BatchList";
import StudentBatchDetails from "./Student/BatchDetails";
import StudentBatchProgress from "./Student/BatchProgress";
import ManageUser from "./Admin/ManageUser";
import SemesterStudentList from "./Admin/SemesterStudentList";
import BatchAssignedStudents from "./Problem/BatchAssignedStudents";
import AdminProblems from "./Admin/AdminProblems";
import FacultyBatches from "./Admin/FacultyBatches";
import ProblemDetails from "./Problem/ProblemDetails";
import { useSelector } from "react-redux";
import AdminApiKeyManagement from "./Admin/AdminApiKeyManagement";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleBasedHome from "./RoleBasedHome";

const Body = () => {
  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [        { path: "/", element: <RoleBasedHome /> },
        { path: "/browse", element: <Browse /> },
        { 
          path: "/login", 
          element: (
            <PublicRoute>
              <Login />
            </PublicRoute>
          )
        },
        { path: "/support", element: <Support /> },
        
        // Student routes
        { 
          path: "/student", 
          element: (
            <ProtectedRoute allowedRoles={['student']}>
              <Student />
            </ProtectedRoute>
          )
        },
        { 
          path: "/student/batches", 
          element: (
            <ProtectedRoute allowedRoles={['student']}>
              <StudentBatchList />
            </ProtectedRoute>
          )
        },
        { 
          path: "/student/batch/:batchId", 
          element: (
            <ProtectedRoute allowedRoles={['student']}>
              <StudentBatchDetails />
            </ProtectedRoute>
          )
        },
        { 
          path: "/student/batch/:batchId/progress",
          element: (
            <ProtectedRoute allowedRoles={['student']}>
              <StudentBatchProgress />
            </ProtectedRoute>
          )
        },
        
        // Admin routes
        { 
          path: "/pending-requests", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          )
        },
        { 
          path: "/registerFaculty", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRegister />
            </ProtectedRoute>
          )
        },
        { 
          path: "/create-faculty", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateFaculty />
            </ProtectedRoute>
          )
        },
        { 
          path: "/registerStudents", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminStudentRegister />
            </ProtectedRoute>
          )
        },
        { 
          path: "/admin/batch/batches", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <BatchManagement />
            </ProtectedRoute>
          )
        },
        { 
          path: "/admin/batch/batches/create", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateBatch />
            </ProtectedRoute>
          )
        },
        { 
          path: "/admin/batch/batches/:batchId", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <BatchDetails />
            </ProtectedRoute>
          )
        },
        { 
          path: "/admin/users", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUser />
            </ProtectedRoute>
          )
        },
        { 
          path: "/admin/problems", 
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProblems />
            </ProtectedRoute>
          )
        },
        {
          path:"/admin/api-keys",
          element: (
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminApiKeyManagement />
            </ProtectedRoute>
          )
        },
        
        // Faculty routes
        { 
          path: "/faculty/batches", 
          element: (
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyBatchList />
            </ProtectedRoute>
          )
        },
        { 
          path: "/faculty/batches/:batchId", 
          element: (
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyBatchDetails />
            </ProtectedRoute>
          )
        },
        { 
          path: "/faculty/batches/:batchId/progress",
          element: (
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyBatchProgress />
            </ProtectedRoute>
          )
        },
        { 
          path: "/faculty/:facultyId/batches", 
          element: (
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <FacultyBatches />
            </ProtectedRoute>
          )
        },
        { 
          path: "/faculty/:facultyId/batch/:batchId/students",
          element: (
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <StudentList />
            </ProtectedRoute>
          )
        },
        
        // Protected routes for all authenticated users
        { 
          path: "/make-contest", 
          element: (
            <ProtectedRoute>
              <MakeContest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/create-contest", 
          element: (
            <ProtectedRoute>
              <CreateContest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/create-contest/:id", 
          element: (
            <ProtectedRoute>
              <CreateContest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/contests/:id", 
          element: (
            <ProtectedRoute>
              <Contest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/make-problem", 
          element: (
            <ProtectedRoute>
              <MakeProblem />
            </ProtectedRoute>
          )
        },
        { 
          path: "/problem-form", 
          element: (
            <ProtectedRoute>
              <ProblemForm />
            </ProtectedRoute>
          )
        },
        { 
          path: "/problem-form/:id", 
          element: (
            <ProtectedRoute>
              <ProblemForm />
            </ProtectedRoute>
          )
        },
        { 
          path: "/problems/:id/:batchId", 
          element: (
            <ProtectedRoute>
              <ProblemShow />
            </ProtectedRoute>
          )
        },
        { 
          path: "/profile", 
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )
        },
        { 
          path: "/dashboard/:problemId", 
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )
        },
        { 
          path: "/history", 
          element: (
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          )
        },
        { 
          path: "/studentinformation", 
          element: (
            <ProtectedRoute>
              <StudentInfo />
            </ProtectedRoute>
          )
        },
        { 
          path: "/submissions/:submissionId", 
          element: (
            <ProtectedRoute>
              <Details />
            </ProtectedRoute>
          )
        },
        { 
          path: "/assignContestToStudents/:contestId",
          element: (
            <ProtectedRoute>
              <UnAssignContest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/unassignContestToStudents/:contestId",
          element: (
            <ProtectedRoute>
              <AssignedContest />
            </ProtectedRoute>
          )
        },
        { 
          path: "/duplicate", 
          element: (
            <ProtectedRoute>
              <Duplicate />
            </ProtectedRoute>
          )
        },
        { 
          path: "/contests/:id/dashboard", 
          element: (
            <ProtectedRoute>
              <ContestDashboard />
            </ProtectedRoute>
          )
        },
        { 
          path: "/students/semester/:semesterId",
          element: (
            <ProtectedRoute>
              <SemesterStudentList />
            </ProtectedRoute>
          )
        },
        { 
          path: "/batch-assign/:problemId", 
          element: (
            <ProtectedRoute>
              <BatchAssignedStudents />
            </ProtectedRoute>
          )
        },
        { 
          path: "/problem-details/:problemId", 
          element: (
            <ProtectedRoute>
              <ProblemDetails />
            </ProtectedRoute>
          )
        },
        
        // 404 route
        { path: "*", element: <NotFoundError /> },
      ],
    },
  ]);

  return <RouterProvider router={appRouter} />;
};

export default Body;