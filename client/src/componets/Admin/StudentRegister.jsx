import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminStudentRegister = () => {
  const [students, setStudents] = useState([]); // Holds parsed Excel data
  const [selectedStudents, setSelectedStudents] = useState({}); // Tracks selected students for registration
  const [errorMessages, setErrorMessages] = useState([]); // Holds error messages from the backend
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [newStudent, setNewStudent] = useState({
    id: "",
    username: "",
    batch: "",
    semester: "",
  });
  const [showSingleStudentForm, setShowSingleStudentForm] = useState(false);
  const [animateSingleForm, setAnimateSingleForm] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ success: [], errors: [] });
  
  const user = useSelector((store) => store.app.user);
  const navigate = useNavigate();

  // Valid batch and semester values for validation
  const validBatches = ['a1', 'b1', 'c1', 'd1', 'a2', 'b2', 'c2', 'd2'];
  const validSemesters = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Effect to animate the single student form
  useEffect(() => {
    if (showSingleStudentForm) {
      setTimeout(() => {
        setAnimateSingleForm(true);
      }, 50);
    } else {
      setAnimateSingleForm(false);
    }
  }, [showSingleStudentForm]);

  // Filter students based on search query
  const filteredStudentList = students.filter(student => 
    student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to generate and download a sample Excel file
  const generateSampleExcel = (e) => {
    e.preventDefault();
    // Sample data structure
    const sampleData = [
      { ID: '21it001', Username: 'John Doe', Batch: 'a1', Semester: '1' },
      { ID: '21it002', Username: 'Jane Smith', Batch: 'b1', Semester: '2' },
      { ID: '21ce003', Username: 'Alex Johnson', Batch: 'c1', Semester: '1' },
      { ID: '21cse004', Username: 'Sara Williams', Batch: 'd2', Semester: '3' },
    ];

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert sample data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the buffer
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_registration_template.xlsx';
    a.click();
    
    // Release the URL object
    URL.revokeObjectURL(url);
    
    toast.success('Sample Excel file downloaded');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Set loading state
    setUploadLoading(true);

    // Create a FileReader to read the file
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result); // Read the file as ArrayBuffer
        const workbook = XLSX.read(data, { type: "array" }); // Parse the Excel data into a workbook
        const sheet = workbook.Sheets[workbook.SheetNames[0]]; // Get the first sheet
        const parsedData = XLSX.utils.sheet_to_json(sheet); // Parse the sheet into JSON data

        // Track errors in data format
        const dataErrors = [];
        
        // Transform parsed data to expected format with validation
        const transformedData = parsedData.map((row, index) => {
          const id = row.ID?.toLowerCase() || "";
          const username = row.Username || "";
          const batch = row.Batch?.toLowerCase() || "";
          const semester = String(row.Semester || "");
          
          // Validate batch and semester
          if (batch && !validBatches.includes(batch)) {
            dataErrors.push(`Row ${index + 1}: Invalid batch "${batch}". Must be one of: ${validBatches.join(', ')}`);
          }
          
          if (semester && !validSemesters.includes(semester)) {
            dataErrors.push(`Row ${index + 1}: Invalid semester "${semester}". Must be between 1-8`);
          }
          
          return {
            id,
            username,
            batch,
            semester,
            index,
            isValid: validBatches.includes(batch) && validSemesters.includes(semester) && id && username
          };
        });

        // Display any validation errors
        if (dataErrors.length > 0) {
          setErrorMessages(dataErrors);
          toast.error("Some data in the Excel file is invalid. See error messages below.");
        }

        setStudents(transformedData);
        setSelectedStudents({});
        toast.success(`Excel file processed with ${transformedData.length} records`);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast.error("Failed to process Excel file. Please check the format.");
      }
      
      // End loading state
      setUploadLoading(false);
    };

    reader.onerror = () => {
      toast.error("Error reading file");
      setUploadLoading(false);
    };

    reader.readAsArrayBuffer(file); // Start reading the file
  };

  // Handle form submit for a single student
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if form values are valid
    if (!newStudent.id || !newStudent.username || !newStudent.batch || !newStudent.semester) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate batch value
    if (!validBatches.includes(newStudent.batch.toLowerCase())) {
      toast.error(`Invalid batch. Must be one of: ${validBatches.join(', ')}`);
      return;
    }
    
    // Validate semester value
    if (!validSemesters.includes(String(newStudent.semester))) {
      toast.error("Invalid semester. Must be between 1-8");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axiosInstance.post("/admin/faculty/student-register", {
        id: newStudent.id.toLowerCase(),
        username: newStudent.username,
        batch: newStudent.batch.toLowerCase(),
        semester: newStudent.semester
      });
      
      toast.success("Student registered successfully!");
      setNewStudent({ id: "", username: "", batch: "", semester: "" });
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle select all checkbox change
  const handleSelectAllChange = () => {
    if (selectAll) {
      setSelectedStudents({});
    } else {
      const newSelectedStudents = {};
      filteredStudentList.forEach(student => {
        if (student.isValid) {
          newSelectedStudents[student.index] = true;
        }
      });
      setSelectedStudents(newSelectedStudents);
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleCheckboxChange = (index) => {
    setSelectedStudents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Handle registering selected students
  const handleRegisterSelected = async () => {
    // Filter valid selected students only
    const selectedData = students.filter(
      (student) => selectedStudents[student.index] && student.isValid
    );

    if (selectedData.length === 0) {
      toast.error("No valid students selected for registration.");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await axiosInstance.post("/admin/faculty/bulk-student-register", {
        students: selectedData
      });

      // Process and display results
      const registrationResults = response.data.results || { success: [], errors: [] };
      
      setResults(registrationResults);
      setShowResults(true);
      
      // Display toast notifications
      if (registrationResults.success && registrationResults.success.length > 0) {
        toast.success(`${registrationResults.success.length} students registered successfully.`);
      }
      
      if (registrationResults.errors && registrationResults.errors.length > 0) {
        toast.error(`${registrationResults.errors.length} students failed to register.`);
      }

      // Reset selections after registration
      setSelectedStudents({});
      setSelectAll(false);
      
      // Remove successfully registered students from the list
      const successIds = new Set(registrationResults.success.map(student => student.id));
      setStudents(prev => prev.filter(student => !successIds.has(student.id)));
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Error registering students. Please try again.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen bg-gray-900 text-white p-0 md:p-4">
        {/* Header Section */}
        <div className="py-6 mb-8 border-b border-blue-900">
          <div className="mt-14"></div>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mr-3 text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h1 className="text-3xl font-bold tracking-tight">
                  Student Management
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

        <div className="container mx-auto px-4">
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <button
              onClick={() => setShowSingleStudentForm(!showSingleStudentForm)}
              className="flex-1 max-w-xs mx-auto py-4 px-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all transform hover:-translate-y-1 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              {showSingleStudentForm ? "Hide Form" : "Add Single Student"}
            </button>
            <label className="flex-1 max-w-xs mx-auto cursor-pointer">
              <div className="py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:-translate-y-1 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Upload Excel File
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadLoading}
              />
            </label>
          </div>

          {/* Template Download Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={generateSampleExcel}
              className="flex items-center text-blue-400 hover:text-blue-300 bg-gray-800 py-2 px-4 rounded-lg shadow-lg border border-gray-700 hover:bg-gray-700 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Excel Template
            </button>
          </div>

          {/* Single Student Form */}
          {showSingleStudentForm && (
            <div
              className={`max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-700 transition-all duration-300 transform ${
                animateSingleForm
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-8"
              }`}
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-3 px-4">
                <h2 className="text-xl font-semibold text-white">
                  Add Individual Student
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Student ID
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={newStudent.id}
                    onChange={(e) => setNewStudent({...newStudent, id: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 22it015"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Batch
                  </label>
                  <select
                    name="batch"
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({...newStudent, batch: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Batch</option>
                    {validBatches.map((batch) => (
                      <option key={batch} value={batch}>{batch?.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent({...newStudent, semester: e.target.value})}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Semester</option>
                    {validSemesters.map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`py-2 px-6 rounded-md font-semibold flex items-center ${
                      isLoading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-95"
                    } transition-all duration-200`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        Add Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading Indicator */}
          {uploadLoading && (
            <div className="flex justify-center items-center mb-8 bg-gray-800 py-6 px-8 rounded-lg shadow-lg border border-gray-700 max-w-md mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              <span className="ml-4 text-lg font-medium">
                Processing Excel File...
              </span>
            </div>
          )}

          {/* Student Records Table */}
          {students.length > 0 && (
            <div className="container mx-auto my-8">
              <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    Student Records
                  </h2>
                </div>

                <div className="bg-gray-900 p-4 border-b border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center bg-gray-800 px-4 py-2.5 rounded-lg border border-gray-700">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                        className="h-5 w-5 mr-3 cursor-pointer accent-blue-500"
                      />
                      <label className="text-gray-300 font-medium flex items-center">
                        <span>Select All Valid</span>
                        <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {students.filter((s) => s.isValid).length}
                        </span>
                      </label>
                    </div>

                    <div className="relative w-full md:w-96">
                      <input
                        type="text"
                        placeholder="Search by ID or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 absolute left-3 top-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-12 border-b border-gray-700"
                        ></th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                        >
                          ID
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                        >
                          Batch
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                        >
                          Semester
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-24 border-b border-gray-700"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                      {filteredStudentList.length > 0 ? (
                        filteredStudentList.map((student) => (
                          <tr
                            key={student.index}
                            className={`${
                              !student.isValid
                                ? "opacity-75 bg-gray-950"
                                : "hover:bg-gray-800"
                            } transition-colors duration-200`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={
                                  (student.isValid &&
                                    selectedStudents[student.index]) ||
                                  false
                                }
                                onChange={() =>
                                  handleCheckboxChange(student.index)
                                }
                                disabled={!student.isValid}
                                className="h-5 w-5 cursor-pointer accent-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                              {student.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {student.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {student.batch?.toUpperCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {student.semester}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {student.isValid ? (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Valid
                                </span>
                              ) : (
                                <span
                                  className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                                  title="Invalid student data"
                                >
                                  Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-6 py-8 text-center text-gray-400 bg-gray-950"
                          >
                            <div className="flex flex-col items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 mb-3 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <p className="text-base">No results found</p>
                              <p className="text-sm mt-1">
                                for search: "{searchQuery}"
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 bg-gray-900 flex justify-between items-center">
                  <div className="text-gray-400 text-sm">
                    <span className="font-medium">{students.length}</span>{" "}
                    total records,
                    <span className="font-medium ml-1 text-green-400">
                      {students.filter((s) => s.isValid).length}
                    </span>{" "}
                    valid,
                    <span className="font-medium ml-1 text-red-400">
                      {students.filter((s) => !s.isValid).length}
                    </span>{" "}
                    invalid
                  </div>

                  <button
                    onClick={handleRegisterSelected}
                    disabled={
                      registerLoading ||
                      students.filter(
                        (s) => s.isValid && selectedStudents[s.index]
                      ).length === 0
                    }
                    className={`py-3 px-6 rounded-lg font-semibold flex items-center ${
                      registerLoading ||
                      students.filter(
                        (s) => s.isValid && selectedStudents[s.index]
                      ).length === 0
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 active:scale-95"
                    } transition-all duration-200 shadow-lg`}
                  >
                    {registerLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Register Selected (
                        {
                          students.filter(
                            (s) => s.isValid && selectedStudents[s.index]
                          ).length
                        }
                        )
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Registration Results Modal */}
          {showResults && (
            <div className="container mx-auto my-8">
              <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-4 px-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Registration Results
                  </h2>
                </div>

                <div className="p-6">
                  {results.success.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-green-400 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Successfully Created ({results.success.length})
                      </h3>
                      <div className="bg-gray-900 rounded-md overflow-hidden border border-gray-700">
                        <div className="overflow-x-auto max-h-60">
                          <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  ID
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  Name
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  Batch
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  Semester
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                              {results.success.map((item, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-800 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.batch?.toUpperCase()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.semester}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {results.errors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-red-400 mb-3 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Errors ({results.errors.length})
                      </h3>
                      <div className="bg-gray-900 rounded-md overflow-hidden border border-gray-700">
                        <div className="overflow-x-auto max-h-60">
                          <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-800">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  ID
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                >
                                  Error
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-gray-900 divide-y divide-gray-800">
                              {results.errors.map((item, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-800 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">
                                    {item.message}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowResults(false)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-6 rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-95 shadow-lg flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Information Section */}
          <div className="max-w-4xl mx-auto mt-8 mb-12 bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 py-3 px-6">
              <h2 className="text-lg font-medium text-white flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Important Information
              </h2>
            </div>
            <div className="p-6">
              <ul className="text-gray-300 space-y-4">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong className="text-emerald-400">
                      Student ID Format:
                    </strong>{" "}
                    Should include the enrollment year and department code (e.g., 22it015).
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong className="text-emerald-400">
                      Password Generation:
                    </strong>{" "}
                    Initial password will be same as the Student ID.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong className="text-emerald-400">
                      Batch Notation:
                    </strong>{" "}
                    Valid batch codes are {validBatches.join(', ')}.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong className="text-emerald-400">Semester:</strong>{" "}
                    Valid semester values are 1 through 8.
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong className="text-emerald-400">First Login:</strong>{" "}
                    Students will be prompted to change their password upon first login.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminStudentRegister;