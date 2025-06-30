import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import {
  FaUserPlus,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
} from "react-icons/fa";

const CreateBatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    batches: [],
    semesters: [],
    branches: []
  });

  // Student filtering and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsPerPage, setStudentsPerPage] = useState(20);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const [batchData, setBatchData] = useState({
    name: '',
    description: '',
    facultyId: '',
    subject: '',
  });

  useEffect(() => {
    fetchFaculty();
    fetchStudents();
    // eslint-disable-next-line
  }, [currentPage, studentsPerPage, searchTerm, selectedBatch, selectedSemester, selectedBranch, sortBy, sortOrder]);

  const fetchFaculty = async () => {
    setFacultyLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100 // Get all faculty
      });

      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {
      toast.error('Failed to load faculty data');
    } finally {
      setFacultyLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: currentPage,
        limit: studentsPerPage,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        setAllStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStudents(response.data.totalStudents);

        // Set filter options if available and not already set
        if (response.data.filters && filterOptions.batches.length === 0) {
          setFilterOptions({
            batches: response.data.filters.batches || [],
            semesters: response.data.filters.semesters || [],
            branches: response.data.filters.branches || []
          });
        }
      }
    } catch (error) {
      toast.error('Failed to load student data');
    } finally {
      setStudentLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBatchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelection = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (allStudents.every(student => selectedStudents.includes(student._id))) {
      // Deselect all currently visible students
      const currentStudentIds = allStudents.map(student => student._id);
      setSelectedStudents(selectedStudents.filter(id => !currentStudentIds.includes(id)));
    } else {
      // Select all currently visible students
      const currentStudentIds = allStudents.map(student => student._id);
      const newSelectedStudents = [...selectedStudents];

      currentStudentIds.forEach(id => {
        if (!newSelectedStudents.includes(id)) {
          newSelectedStudents.push(id);
        }
      });

      setSelectedStudents(newSelectedStudents);
    }
  };

  // Bulk selection based on criteria
  const handleBulkSelection = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        const matchingStudentIds = response.data.students.map(student => student._id);
        const newSelectedStudents = [...selectedStudents];
        matchingStudentIds.forEach(id => {
          if (!newSelectedStudents.includes(id)) {
            newSelectedStudents.push(id);
          }
        });
        setSelectedStudents(newSelectedStudents);
        toast.success(`Selected ${matchingStudentIds.length} students matching current filters`);
      }
    } catch (error) {
      toast.error('Failed to perform bulk selection');
    } finally {
      setStudentLoading(false);
      fetchStudents();
    }
  };

  const handleBulkDeselection = async () => {
    setStudentLoading(true);
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000,
        search: searchTerm,
        batch: selectedBatch,
        semester: selectedSemester,
        branch: selectedBranch,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.data.success) {
        const matchingStudentIds = response.data.students.map(student => student._id);
        const newSelectedStudents = selectedStudents.filter(id => !matchingStudentIds.includes(id));
        setSelectedStudents(newSelectedStudents);
        toast.success(`Removed students from selection`);
      }
    } catch (error) {
      toast.error('Failed to remove students from selection');
    } finally {
      setStudentLoading(false);
      fetchStudents();
    }
  };

  const handleClearSelection = () => {
    setSelectedStudents([]);
    toast.success('Cleared all selected students');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'batch') setSelectedBatch(value);
    if (name === 'semester') setSelectedSemester(value);
    if (name === 'branch') setSelectedBranch(value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sortBy') setSortBy(value);
    else if (name === 'sortOrder') setSortOrder(value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePerPageChange = (e) => {
    setStudentsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batchData.name || !batchData.facultyId) {
      toast.error('Batch name and faculty are required!');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...batchData,
        students: selectedStudents
      };
      const response = await axiosInstance.post('/admin/batch/batches', payload);
      if (response.data.success) {
        toast.success('Batch created successfully!');
        navigate('/admin/batch/batches');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const allCurrentPageSelected = allStudents.length > 0 &&
    allStudents.every(student => selectedStudents.includes(student._id));

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaLayerGroup className="h-8 w-8 mr-3 text-blue-300" />
              <h1 className="text-3xl font-bold tracking-tight">
                Create Batch
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

      {/* Batch Details Section */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden mb-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <FaLayerGroup className="h-6 w-6 mr-2 text-blue-300" />
            Batch Details
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">
                Batch Name *
              </label>
              <input
                type="text"
                name="name"
                value={batchData.name}
                onChange={handleInputChange}
                placeholder="Enter batch name"
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">
                Faculty *
              </label>
              {facultyLoading ? (
                <p className="text-blue-200">Loading faculty...</p>
              ) : (
                <select
                  name="facultyId"
                  value={batchData.facultyId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a faculty</option>
                  {facultyList.map(faculty => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.username} ({faculty.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={batchData.subject}
                onChange={handleInputChange}
                placeholder="Subject name (optional)"
                className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-blue-100 mb-1 mt-4">
              Description
            </label>
            <textarea
              name="description"
              value={batchData.description}
              onChange={handleInputChange}
              placeholder="Describe this batch"
              rows="3"
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900/70 text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/batch/batches')}
                className="px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-blue-200 bg-gray-800 hover:bg-gray-700 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !batchData.name || !batchData.facultyId}
                className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-md text-sm font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Batch'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Student Selection Section */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden mb-12 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            Student Selection & Filters
          </h2>
        </div>
        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-blue-700 bg-gray-900/80 text-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <span className="absolute left-3 top-2.5 text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow transition"
            >
              {allCurrentPageSelected ? 'Deselect All' : 'Select All'}
            </button>
            <select
              name="batch"
              value={selectedBatch}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">All Batches</option>
              {filterOptions.batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            <select
              name="semester"
              value={selectedSemester}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">All Semesters</option>
              {filterOptions.semesters.map(semester => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
            <select
              name="branch"
              value={selectedBranch}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">All Branches</option>
              {filterOptions.branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            <select
              name="sortBy"
              value={sortBy}
              onChange={handleSortChange}
              className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="id">Sort by ID</option>
              <option value="username">Sort by Name</option>
              <option value="batch">Sort by Batch</option>
              <option value="semester">Sort by Semester</option>
            </select>
            <select
              name="sortOrder"
              value={sortOrder}
              onChange={handleSortChange}
              className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={handleBulkSelection}
              disabled={studentLoading}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition"
            >
              {studentLoading ? 'Processing...' : 'Select All Matching Filters'}
            </button>
            <button
              type="button"
              onClick={handleBulkDeselection}
              disabled={studentLoading || !selectedStudents.length}
              className="px-4 py-2 bg-yellow-700 hover:bg-yellow-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition"
            >
              Remove Matching From Selection
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={!selectedStudents.length}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition"
            >
              Clear All Selection
            </button>
          </div>
          {/* Table */}
          {studentLoading ? (
            <div className="text-center py-10">
              <div className="spinner"></div>
              <p className="mt-2 text-blue-200">Loading students...</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-[1200px] w-full text-left font-medium rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-900/90 via-gray-900/90 to-indigo-900/90 sticky top-0 z-10 backdrop-blur-md">
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider rounded-tl-2xl">
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={handleSelectAll}
                        className="h-5 w-5 accent-blue-500 border-gray-700 rounded focus:ring-blue-500 transition"
                      />
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider">Semester</th>
                    <th className="px-6 py-4 text-xs font-bold text-blue-200 uppercase tracking-wider rounded-tr-2xl">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {allStudents.map((student, idx) => (
                    <tr
                      key={student._id}
                      className={`transition-colors duration-150 ${
                        idx % 2 === 0 ? "bg-gray-900/70" : "bg-gray-800/70"
                      } hover:bg-blue-950/70 group`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleStudentSelection(student._id)}
                          className="h-5 w-5 accent-blue-500 border-gray-700 rounded focus:ring-blue-500 transition"
                        />
                      </td>
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-blue-400/40 group-hover:ring-4 transition">
                          {student.username
                            ? student.username
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                        </div>
                        <span className="font-semibold text-blue-100 text-base">{student.username}</span>
                      </td>
                      <td className="px-6 py-4 text-blue-300 font-mono">{student.id}</td>
                      <td className="px-6 py-4 text-blue-300">{student.batch}</td>
                      <td className="px-6 py-4 text-blue-300">{student.semester}</td>
                      <td className="px-6 py-4 text-blue-300">{student.branch || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-blue-200">
                    <span className="font-semibold">{selectedStudents.length}</span> students selected | 
                    Showing {allStudents.length} of {totalStudents} students
                  </span>
                  {selectedStudents.length > 0 && (
                    <span className="text-xs mt-1 text-blue-400 bg-blue-900/40 px-2 py-1 rounded ml-2">
                      Tip: Use filters and "Select All Matching Filters" for bulk selection
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={studentsPerPage}
                    onChange={handlePerPageChange}
                    className="px-3 py-2 border border-blue-700 bg-gray-900/80 text-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="10">10 / page</option>
                    <option value="20">20 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                  </select>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-800 border border-blue-700 text-blue-200 rounded-lg text-sm hover:bg-blue-900/60 disabled:opacity-50 transition"
                      title="First Page"
                    >
                      &laquo;
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-800 border border-blue-700 text-blue-200 rounded-lg text-sm hover:bg-blue-900/60 disabled:opacity-50 transition"
                      title="Previous Page"
                    >
                      &lsaquo;
                    </button>
                    <span className="px-3 py-2 text-sm text-blue-100 font-semibold">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-800 border border-blue-700 text-blue-200 rounded-lg text-sm hover:bg-blue-900/60 disabled:opacity-50 transition"
                      title="Next Page"
                    >
                      &rsaquo;
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-800 border border-blue-700 text-blue-200 rounded-lg text-sm hover:bg-blue-900/60 disabled:opacity-50 transition"
                      title="Last Page"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBatch;