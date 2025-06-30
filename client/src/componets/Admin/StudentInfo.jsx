import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { FaUserGraduate } from "react-icons/fa";

const StudentInfo = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [branchWiseCount, setBranchWiseCount] = useState([]);
  const [semesterWiseCount, setSemesterWiseCount] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/problems/getStudents");
        setUsers(response.data.students);
        setTotalStudents(response.data.totalStudents);
        setBranchWiseCount(response.data.branchWiseCount);
        setSemesterWiseCount(response.data.semesterBranchBatchWiseCount);
      } catch (err) {
        setError("Failed to fetch student data. Please try again later.");
        console.error("Error fetching sorted users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUserGraduate className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Student Info
              </h1>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate(-1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-grow">
        <div
          className="w-full bg-gray-900 rounded-lg shadow-xl p-0"
          style={{ minHeight: "calc(100vh - 180px)" }}
        >
          <div className="px-4 pb-8 pt-6">
            {loading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
                  <p className="mt-4 text-blue-500 text-lg font-medium">
                    Loading, please wait...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xl font-medium mb-4">
                  Total Students:{" "}
                  <span className="text-yellow-400 font-bold">
                    {totalStudents}
                  </span>
                </p>
                <BranchWiseCount branches={branchWiseCount} />
                <SemesterWiseCount
                  semesters={semesterWiseCount}
                  onSemesterClick={(semester) =>
                    navigate(`/students/semester/${semester}`)
                  }
                />
                {error && (
                  <div className="px-4 py-2 mb-4 bg-red-700 text-white rounded">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BranchWiseCount = ({ branches }) => (
  <div className="mt-4 mb-4">
    <h3 className="text-lg font-medium text-white">Batch-wise Count:</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {branches.map((branch, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-4"
        >
          <span className="text-sm font-semibold text-yellow-400">
            {branch._id?.toUpperCase()}
          </span>
          <span className="text-sm text-gray-300">{branch.count} students</span>
        </div>
      ))}
    </div>
  </div>
);

const SemesterWiseCount = ({ semesters, onSemesterClick }) => (
  <div className="pb-4">
    <h3 className="text-lg font-medium text-white">Semester-wise Count:</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {Object.entries(semesters).map(([semester, branches]) => (
        <div
          key={semester}
          className="border border-gray-700 rounded-lg bg-gray-800 p-4 cursor-pointer hover:bg-gray-700"
          onClick={() => onSemesterClick(semester)}
        >
          <h4 className="text-md font-semibold text-blue-400 mb-2">
            Semester: {semester}
          </h4>
          {Object.entries(branches).map(([branch, batches]) => (
            <div key={branch} className="mb-4">
              <h5 className="text-sm font-medium text-yellow-400">
                Branch: {branch.toUpperCase()}
              </h5>
              <ul className="mt-2 space-y-1">
                {Object.entries(batches).map(([batch, count]) => (
                  <li
                    key={batch}
                    className="text-sm text-gray-300 bg-gray-900 p-2 rounded-md"
                  >
                    <span className="font-medium text-green-400">
                      Batch {batch.toUpperCase()}:
                    </span>{" "}
                    {count} students
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default StudentInfo;
