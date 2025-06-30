import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const CreateFaculty = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [results, setResults] = useState({ success: [], errors: [] });
  const [showResults, setShowResults] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(true);
  const [showSingleFacultyForm, setShowSingleFacultyForm] = useState(false);
  const [animateSingleForm, setAnimateSingleForm] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation for @charusat.ac.in
    if (!formData.email.endsWith("@charusat.ac.in")) {
      toast.error("Email must end with @charusat.ac.in");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        "/admin/faculty/create-faculty",
        formData
      );

      if (response.data.success) {
        toast.success("Faculty created successfully!");
        // Reset form after successful submission
        setFormData({
          username: "",
          email: "",
        });
        // Hide the form with animation
        setAnimateSingleForm(false);
        setTimeout(() => {
          setShowSingleFacultyForm(false);
        }, 300);
      } else {
        toast.error(response.data.message || "Failed to create faculty");
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while creating faculty"
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show toast notification that file is being processed
    toast.loading("Processing Excel file...", { id: "excel-processing" });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setUploadLoading(true);

        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("No data found in the Excel file");
          toast.dismiss("excel-processing");
          setUploadLoading(false);
          return;
        }

        // Format data for display and processing
        const formattedFacultyList = jsonData.map((row, index) => ({
          id: index,
          username: row.Username || row.username || row.Name || row.name || "",
          email: row.Email || row.email || "",
          isValid: (row.Email || row.email || "").endsWith("@charusat.ac.in"),
        }));

        // Initialize all checkboxes as selected by default (only for valid entries)
        const initialSelectedState = {};
        formattedFacultyList.forEach((faculty) => {
          if (faculty.isValid) {
            initialSelectedState[faculty.id] = true;
          }
        });

        setFacultyList(formattedFacultyList);
        setSelectedFaculty(initialSelectedState);
        setSelectAll(true);

        // Hide the form if it's open
        if (showSingleFacultyForm) {
          setAnimateSingleForm(false);
          setTimeout(() => setShowSingleFacultyForm(false), 300);
        }

        toast.dismiss("excel-processing");
        toast.success(
          `${formattedFacultyList.length} records loaded. Invalid emails are highlighted.`
        );
      } catch (error) {
        console.error("Error processing Excel file:", error);
        toast.dismiss("excel-processing");
        toast.error("Error processing Excel file");
      } finally {
        setUploadLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Toggle individual checkbox
  const handleCheckboxChange = (id) => {
    setSelectedFaculty((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));

    // Update selectAll status based on new selection
    const willAllBeSelected = Object.values({
      ...selectedFaculty,
      [id]: !selectedFaculty[id],
    }).every((value) => value === true);

    setSelectAll(willAllBeSelected);
  };

  // Toggle select all checkbox
  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const newSelectedState = {};
    facultyList.forEach((faculty) => {
      if (faculty.isValid) {
        newSelectedState[faculty.id] = newSelectAll;
      }
    });

    setSelectedFaculty(newSelectedState);
  };

  // Filter faculty list based on search query
  const filteredFacultyList = facultyList.filter((faculty) => {
    const searchLowerCase = searchQuery.toLowerCase();
    return (
      faculty.username.toLowerCase().includes(searchLowerCase) ||
      faculty.email.toLowerCase().includes(searchLowerCase)
    );
  });

  // Handle registration of selected faculty
  const handleRegisterSelected = async () => {
    // Get selected faculty that are valid
    const selectedFacultyList = facultyList
      .filter((faculty) => faculty.isValid && selectedFaculty[faculty.id])
      .map((faculty) => ({
        username: faculty.username,
        email: faculty.email,
      }));

    if (selectedFacultyList.length === 0) {
      toast.error("No valid faculty selected for registration");
      return;
    }

    try {
      setRegisterLoading(true);
      const response = await axiosInstance.post("/admin/faculty/bulk-create-faculty", {
        facultyList: selectedFacultyList,
      });

      if (response.data.success) {
        setResults(response.data.results);
        setShowResults(true);
        toast.success(
          `Successfully registered ${response.data.results.success.length} faculty members`
        );

        // Clear faculty list after successful registration
        setFacultyList([]);
        setSelectedFaculty({});
      } else {
        toast.error(response.data.message || "Failed to register faculty");
      }
    } catch (error) {
      console.error("Error registering faculty:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while registering faculty"
      );
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h1 className="text-3xl font-bold tracking-tight">
                  Faculty Management
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
          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            {" "}
            <button
              onClick={() => {
                if (!showSingleFacultyForm) {
                  setShowSingleFacultyForm(true);
                  setTimeout(() => setAnimateSingleForm(true), 50);
                } else {
                  setAnimateSingleForm(false);
                  setTimeout(() => setShowSingleFacultyForm(false), 300);
                }
              }}
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
              {showSingleFacultyForm ? "Hide Form" : "Add Single Faculty"}
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
          </div>{" "}
          {/* Template Download Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={(e) => {
                e.preventDefault();
                // Create a simple Excel template
                const worksheet = XLSX.utils.json_to_sheet([
                  {
                    Username: "Example Name",
                    Email: "example.it@charusat.ac.in",
                  },
                ]);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");
                XLSX.writeFile(workbook, "faculty_template.xlsx");
                toast.success("Template downloaded successfully!");
              }}
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
          {/* Single Faculty Form - Shows only when button is clicked */}
          {showSingleFacultyForm && (
            <div
              className={`max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8 border border-gray-700 transition-all duration-300 transform ${
                animateSingleForm
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-8"
              }`}
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-3 px-4">
                <h2 className="text-xl font-semibold text-white">
                  Add Individual Faculty
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter faculty name"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., rutvikchauhan.it@charusat.ac.in"
                    required
                  />
                  <p className="text-gray-400 text-sm mt-1 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
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
                    Must end with @charusat.ac.in
                  </p>
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
                        Add Faculty
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Upload Status Indicator */}
          {uploadLoading && (
            <div className="flex justify-center items-center mb-8 bg-gray-800 py-6 px-8 rounded-lg shadow-lg border border-gray-700 max-w-md mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              <span className="ml-4 text-lg font-medium">
                Processing Excel File...
              </span>
            </div>
          )}
          {/* Faculty List Display */}
          {facultyList.length > 0 && (
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
                    Faculty Records
                  </h2>
                </div>
                {/* Search and Select All Controls */}{" "}
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
                          {facultyList.filter((f) => f.isValid).length}
                        </span>
                      </label>
                    </div>

                    <div className="relative w-full md:w-96">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
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
                {/* Faculty Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    {" "}
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
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-700"
                        >
                          Email
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
                      {filteredFacultyList.length > 0 ? (
                        filteredFacultyList.map((faculty, index) => (
                          <tr
                            key={faculty.id}
                            className={`${
                              !faculty.isValid
                                ? "opacity-75 bg-gray-950"
                                : "hover:bg-gray-800"
                            } transition-colors duration-200`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={
                                  (faculty.isValid &&
                                    selectedFaculty[faculty.id]) ||
                                  false
                                }
                                onChange={() =>
                                  handleCheckboxChange(faculty.id)
                                }
                                disabled={!faculty.isValid}
                                className="h-5 w-5 cursor-pointer accent-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                              {faculty.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                              {faculty.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {faculty.isValid ? (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Valid
                                </span>
                              ) : (
                                <span
                                  className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                                  title="Email must end with @charusat.ac.in"
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
                            colSpan="4"
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
                {/* Register Selected Button */}
                <div className="p-5 bg-gray-900 flex justify-between items-center">
                  <div className="text-gray-400 text-sm">
                    <span className="font-medium">{facultyList.length}</span>{" "}
                    total records,
                    <span className="font-medium ml-1 text-green-400">
                      {facultyList.filter((f) => f.isValid).length}
                    </span>{" "}
                    valid,
                    <span className="font-medium ml-1 text-red-400">
                      {facultyList.filter((f) => !f.isValid).length}
                    </span>{" "}
                    invalid
                  </div>

                  <button
                    onClick={handleRegisterSelected}
                    disabled={
                      registerLoading ||
                      facultyList.filter(
                        (f) => f.isValid && selectedFaculty[f.id]
                      ).length === 0
                    }
                    className={`py-3 px-6 rounded-lg font-semibold flex items-center ${
                      registerLoading ||
                      facultyList.filter(
                        (f) => f.isValid && selectedFaculty[f.id]
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
                          facultyList.filter(
                            (f) => f.isValid && selectedFaculty[f.id]
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
          {/* Results Display */}
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
                  {/* Success section */}
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
                                  Email
                                </th>
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
                                  Branch
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
                                    {item.email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {item.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    cspit-it
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Errors section */}
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
                                  Email
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
                                    {item.email}
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
          {/* Information Card */}
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
                      Faculty ID and Password:
                    </strong>{" "}
                    Both will be extracted from the email address (part before
                    @charusat.ac.in).
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
                    <strong className="text-emerald-400">Example:</strong> For
                    email "rutvikchauhan.it@charusat.ac.in", both ID and initial
                    password will be "rutvikchauhan.it".
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
                      Branch Assignment:
                    </strong>{" "}
                    All faculty will be automatically assigned to "CSPIT-IT"
                    branch.
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
                    Faculty members will be prompted to change their password
                    upon first login.
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
                    <strong className="text-emerald-400">Email Format:</strong>{" "}
                    Email addresses must end with "@charusat.ac.in" to be
                    considered valid.
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

export default CreateFaculty;