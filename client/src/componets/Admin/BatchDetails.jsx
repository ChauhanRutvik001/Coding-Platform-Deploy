import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import ConfirmationModal from '../ConfirmationModal';
import {
  FaLayerGroup,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaUserPlus,
  FaChevronLeft,
  FaArrowAltCircleDown,
  FaArrowLeft,
} from "react-icons/fa";

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facultyId: '',
    subject: '',
    isActive: true
  });
  const [filterTerm, setFilterTerm] = useState('');
  const [studentsToAdd, setStudentsToAdd] = useState([]);

  useEffect(() => {
    fetchBatchDetails();
    fetchFaculty();
    fetchAllStudents();
    // eslint-disable-next-line
  }, [batchId]);

  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/batch/batches/${batchId}`);
      if (response.data.success) {
        const batchData = response.data.batch;
        setBatch(batchData);
        setFormData({
          name: batchData.name || '',
          description: batchData.description || '',
          facultyId: batchData.faculty?._id || '',
          subject: batchData.subject || '',
          isActive: batchData.isActive
        });
      }
    } catch (error) {
      toast.error('Failed to load batch details');
      navigate('/admin/batch/batches');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFaculty = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-faculty-by-admin', {
        page: 1,
        limit: 100
      });
      if (response.data.success) {
        setFacultyList(response.data.facultys);
      }
    } catch (error) {}
  };
  
  const fetchAllStudents = async () => {
    try {
      const response = await axiosInstance.post('/admin/faculty/get-students', {
        page: 1,
        limit: 1000
      });
      if (response.data.success) {
        setAllStudents(response.data.students);
      }
    } catch (error) {}
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  };
  
  const handleToggleEditMode = () => {
    if (editMode) {
      // Cancel edit - reset form data
      setFormData({
        name: batch.name || '',
        description: batch.description || '',
        facultyId: batch.faculty?._id || '',
        subject: batch.subject || '',
        isActive: batch.isActive
      });
      setStudentsToAdd([]);
    }
    setEditMode(!editMode);
  };

  const handleStudentSelection = (studentId) => {
    if (studentsToAdd.includes(studentId)) {
      setStudentsToAdd(studentsToAdd.filter(id => id !== studentId));
    } else {
      setStudentsToAdd([...studentsToAdd, studentId]);
    }
  };

  const handleRemoveStudent = (studentId) => {
    setStudentToRemove(studentId);
    setShowRemoveModal(true);
  };
  
  const confirmRemoveStudent = async () => {
    try {
      const response = await axiosInstance.delete(`/admin/batch/batches/${batchId}/students`, {
        data: { studentIds: [studentToRemove] }
      });
      if (response.data.success) {
        toast.success('Student removed from batch');
        fetchBatchDetails();
      }
    } catch (error) {
      toast.error('Failed to remove student');
    } finally {
      setShowRemoveModal(false);
      setStudentToRemove(null);
    }
  };
  
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Update batch details
      const updateResponse = await axiosInstance.put(`/admin/batch/batches/${batchId}`, formData);
      if (updateResponse.data.success) {
        // If there are students to add
        if (studentsToAdd.length > 0) {
          await axiosInstance.post(`/admin/batch/batches/${batchId}/students`, {
            studentIds: studentsToAdd
          });
        }
        toast.success('Batch updated successfully');
        setEditMode(false);
        fetchBatchDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update batch');
    } finally {
      setSaving(false);
    }
  };

  // Filter students that are not already in the batch
  const getAvailableStudents = () => {
    const batchStudentIds = batch?.students?.map(student => student._id) || [];
    return allStudents.filter(student => !batchStudentIds.includes(student._id));
  };

  const filteredAvailableStudents = getAvailableStudents().filter(student => {
    const searchTerm = filterTerm.toLowerCase();
    return (
      student.username.toLowerCase().includes(searchTerm) ||
      student.id.toLowerCase().includes(searchTerm) ||
      (student.batch && student.batch.toLowerCase().includes(searchTerm))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75"></div>
          <p className="mt-4 text-blue-400 text-lg font-semibold">
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold text-white">Batch not found</h2>
          <button
            onClick={() => navigate('/admin/batch/batches')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
      {/* Header Section - Styled like AdminRegister */}
      <div className="py-6 mb-8 border-b border-blue-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mt-14">
            <div className="flex items-center mb-4 md:mb-0">
              <FaLayerGroup className="h-8 w-8 mr-3 text-blue-300" />
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight truncate" title={`Batch Details: ${batch.name}`}>
                  Batch Details
                </h1>
              </div>
            </div>
            <button
              className="py-2.5 px-6 flex items-center bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-200 active:scale-95"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="mr-2" />
              Back to Batches
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="w-full">
          {/* Stats Section - Like in AdminRegister */}

          {/* Batch Information Card */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center">
                <span className="text-blue-300">Batch Information</span>
              </h2>
              <div className="flex space-x-2">
                {!editMode ? (
                  <button
                    onClick={handleToggleEditMode}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors"
                  >
                    <FaEdit className="mr-2" /> Edit Batch
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleToggleEditMode}
                      className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center transition-colors"
                    >
                      <FaTimes className="mr-2" /> Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center transition-colors disabled:opacity-50"
                    >
                      <FaSave className="mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Batch Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        required
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-white truncate" title={batch.name}>
                          {batch.name}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Subject
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="text-white truncate" title={batch.subject || 'Not specified'}>
                          {batch.subject || 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Faculty
                    </label>
                    {editMode ? (
                      <select
                        name="facultyId"
                        value={formData.facultyId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        required
                      >
                        <option value="">Select a faculty</option>
                        {facultyList.map(faculty => (
                          <option key={faculty._id} value={faculty._id}>
                            {faculty.username} ({faculty.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="min-w-0">
                        <p 
                          className="text-white truncate" 
                          title={batch.faculty ? `${batch.faculty.username} (${batch.faculty.email})` : 'Not assigned'}
                        >
                          {batch.faculty ? `${batch.faculty.username} (${batch.faculty.email})` : 'Not assigned'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Status
                    </label>
                    {editMode ? (
                      <button
                        type="button"
                        onClick={handleToggleActive}
                        className={`px-4 py-1 rounded-full text-sm font-medium ${
                          formData.isActive
                            ? 'bg-green-900/40 text-green-400 border border-green-500/30'
                            : 'bg-red-900/40 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {formData.isActive ? 'Active' : 'Inactive'} (Click to toggle)
                      </button>
                    ) : (
                      <span
                        className={`px-4 py-1 rounded-full text-xs font-medium ${
                          batch.isActive
                            ? 'bg-green-900/40 text-green-400 border border-green-500/30'
                            : 'bg-red-900/40 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  {editMode ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  ) : (
                    <div className="min-h-[3rem]">
                      <p className="text-white">{batch.description || 'No description'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Students Section - Improved table with horizontal scrolling */}
          <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold">Students in Batch</h2>
                <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30">
                  {batch.students?.length || 0} students
                </span>
              </div>
              
              {editMode && (
                <div className="relative w-full sm:w-auto max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students to add..."
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
            
            {/* Current Students List - With horizontal scrolling and long name handling */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-700/50 text-gray-200 text-sm uppercase">
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[5%]">
                      <span className="font-semibold">#</span>
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[40%]">
                      <span className="font-semibold">Username</span>
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-left w-[25%]">
                      <span className="font-semibold">ID</span>
                    </th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-[20%]">
                      <span className="font-semibold">Batch</span>
                    </th>
                    {editMode && (
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-[10%]">
                        <span className="font-semibold">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {batch.students && batch.students.length > 0 ? (
                    batch.students.map((student, index) => (
                      <tr
                        key={student._id}
                        className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-gray-300 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mr-2 sm:mr-3">
                              <span className="text-white text-xs sm:text-sm font-medium">
                                {student.username?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-[200px]">
                              <span 
                                className="font-semibold text-white truncate block"
                                title={student.username || ""}
                              >
                                {student.username || ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6">
                          <div className="min-w-0 max-w-[150px]">
                            <span 
                              className="text-gray-300 truncate block"
                              title={student.id?.toUpperCase() || ""}
                            >
                              {student.id?.toUpperCase() || ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                          <div className="flex justify-center">
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-500/30 truncate max-w-[120px]"
                              title={student.batch?.toUpperCase() || "N/A"}
                            >
                              {student.batch?.toUpperCase() || "N/A"}
                            </span>
                          </div>
                        </td>
                        {editMode && (
                          <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                            <button
                              onClick={() => handleRemoveStudent(student._id)}
                              className="px-3 py-1 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={editMode ? 5 : 4} className="py-8 px-6 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <FaSearch className="w-12 h-12 text-gray-600 mb-3" />
                          <p className="text-lg font-medium">No students in this batch</p>
                          <p className="text-sm text-gray-500">
                            {editMode ? "Add students using the search above" : "No students have been added yet"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Add Students Section - Only visible in edit mode */}
          {editMode && filteredAvailableStudents.length > 0 && (
            <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gray-700 px-6 py-4 border-b border-gray-600 flex justify-between items-center">
                <div className="flex items-center">
                  <FaUserPlus className="h-5 w-5 mr-2 text-blue-300" />
                  <h2 className="text-xl font-semibold">Add Students</h2>
                </div>
                {studentsToAdd.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-500/30">
                    {studentsToAdd.length} selected
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-700/50 text-gray-200 text-sm uppercase">
                      <th className="py-3 px-3 sm:px-6 text-left w-[5%]">
                        <span className="font-semibold">Select</span>
                      </th>
                      <th className="py-3 px-3 sm:px-6 text-left w-[40%]">
                        <span className="font-semibold">Username</span>
                      </th>
                      <th className="py-3 px-3 sm:px-6 text-left w-[25%]">
                        <span className="font-semibold">ID</span>
                      </th>
                      <th className="py-3 px-3 sm:px-6 text-center w-[30%]">
                        <span className="font-semibold">Current Batch</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailableStudents.map((student, index) => (
                      <tr
                        key={student._id}
                        className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 px-3 sm:px-6 text-gray-300">
                          <input
                            type="checkbox"
                            id={`add-student-${student._id}`}
                            checked={studentsToAdd.includes(student._id)}
                            onChange={() => handleStudentSelection(student._id)}
                            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 focus:ring-opacity-50 bg-gray-700 border-gray-600"
                          />
                        </td>
                        <td className="py-3 px-3 sm:px-6">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-medium">
                                {student.username?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-[200px]">
                              <label 
                                htmlFor={`add-student-${student._id}`}
                                className="font-semibold text-white cursor-pointer truncate block"
                                title={student.username || ""}
                              >
                                {student.username || ""}
                              </label>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-6">
                          <div className="min-w-0 max-w-[150px]">
                            <span 
                              className="text-gray-300 truncate block"
                              title={student.id?.toUpperCase() || ""}
                            >
                              {student.id?.toUpperCase() || ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-6 text-center">
                          <div className="flex justify-center">
                            <span 
                              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-700/80 text-gray-300 border border-gray-600 truncate max-w-[150px]"
                              title={student.batch?.toUpperCase() || "None"}
                            >
                              {student.batch?.toUpperCase() || "None"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Batch information footer - Like AdminRegister's pagination info */}
          <div className="text-center mt-6 text-gray-400 text-sm">
            Batch ID: <span className="text-blue-300">{batch._id}</span>
            {batch.createdAt && (
              <span className="ml-2">
                Created on: {new Date(batch.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {/* Confirmation Modal for removing student */}
          {showRemoveModal && (
            <ConfirmationModal
              title="Remove Student"
              message="Are you sure you want to remove this student from the batch?"
              confirmButtonText="Remove"
              cancelButtonText="Cancel"
              onConfirm={confirmRemoveStudent}
              onCancel={() => {
                setShowRemoveModal(false);
                setStudentToRemove(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default BatchDetails;