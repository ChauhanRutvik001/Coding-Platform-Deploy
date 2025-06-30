import React, { useState, useEffect } from "react";
import {
  Save,
  User,
  Mail,
  Github,
  Linkedin,
  FileText,
  MapPin,
  Cake,
  BookOpen,
  Code,
  Loader2,
  Key,
} from "lucide-react";
import ApiKeyManagement from "./ApiKeyManagement";

const ProfileRight = ({ formData, handleInputChange, handleSubmit, user, initialTab = "profile" }) => {
  const [isFormTouched, setIsFormTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // "profile" or "apikeys"
  // Enable smooth transition on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Track form changes to enable/disable submit button
  useEffect(() => {
    const isChanged = Object.keys(formData).some(key => {
      if (key === 'birthday' && user.profile?.birthday) {
        return formData[key] !== user.profile.birthday.slice(0, 10);
      }
      if (key === 'email') {
        return false; // Email is read-only
      }
      if (user.profile && key in user.profile) {
        return formData[key] !== user.profile[key];
      }
      return formData[key] !== user[key];
    });
    
    setIsFormTouched(isChanged);
  }, [formData, user]);

  // Enhanced submit handler with loading state
  const onSubmit = async (e) => {
    setIsSubmitting(true);
    await handleSubmit(e);
    setIsSubmitting(false);
  };

  const handleInputFieldChange = (e) => {
    handleInputChange(e);
  };

  // Prepare form field animations
  const getFieldAnimation = (index) => {
    return {
      animationDelay: `${index * 50}ms`,
      animationName: 'slide-up',
      animationDuration: '400ms',
      animationFillMode: 'both',
      animationTimingFunction: 'ease-out',
    };
  };
  return (
    <div 
      className={`flex flex-col space-y-4 transition-opacity duration-500 ease-in-out ${
        contentReady ? "opacity-100" : "opacity-0"
      }`}
    >      {/* Tab Navigation */}
      <div className="flex flex-wrap sm:flex-nowrap space-x-0 sm:space-x-1 space-y-1 sm:space-y-0 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
            activeTab === "profile"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-900"
          }`}
        >
          <User size={16} className="mr-1 sm:mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("apikeys")}
          className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors text-sm sm:text-base ${
            activeTab === "apikeys"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-900"
          }`}
        >
          <Key size={16} className="mr-1 sm:mr-2" />
          API Keys
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="bg-gray-900 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 border border-blue-900/30">
          <div className="mb-4 sm:mb-8 text-center">
            <h2 className="text-xl sm:text-3xl font-bold text-blue-400">
              Profile Information
            </h2>
            <div className="mt-2 h-1 w-24 mx-auto bg-blue-500 rounded-full"></div>
          </div>

          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
          >
            {/* Full Name */}
            <div className="col-span-2" style={getFieldAnimation(1)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <User size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Full Name
              </label>
              <div className="relative group">                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="col-span-2" style={getFieldAnimation(2)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <User size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Username
              </label>
              <div className="relative group">                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="col-span-2" style={getFieldAnimation(3)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <Mail size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-700 border-2 border-gray-600 rounded-lg shadow-lg
                           text-gray-300 cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-semibold text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-600">
                  Read only
                </div>
              </div>
            </div>            {/* Github */}
            <div className="col-span-2 sm:col-span-1" style={getFieldAnimation(4)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <Github size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Github
              </label>
              <div className="relative group">                <input
                  name="github"
                  value={formData.github}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your GitHub profile name"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* LinkedIn */}
            <div className="col-span-2 sm:col-span-1" style={getFieldAnimation(5)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <Linkedin size={16} className="mr-2 sm:mr-3 text-blue-400" />
                LinkedIn
              </label>
              <div className="relative group">                <input
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your LinkedIn profile URL"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="col-span-2" style={getFieldAnimation(6)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <FileText size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Bio
              </label>
              <div className="relative group">                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 resize-none text-sm sm:text-base"
                  placeholder="Tell us about yourself..."
                  rows={4}
                ></textarea>
                <div className="absolute top-4 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>            {/* Gender */}
            <div className="col-span-2 sm:col-span-1" style={getFieldAnimation(7)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <User size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Gender
              </label>
              <div className="relative group">                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 appearance-none text-sm sm:text-base"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Birthday */}
            <div className="col-span-2 sm:col-span-1" style={getFieldAnimation(8)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <Cake size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Birthday
              </label>
              <div className="relative group">
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="col-span-2" style={getFieldAnimation(9)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <MapPin size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Location
              </label>
              <div className="relative group">
                <textarea
                  name="location"
                  value={formData.location}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 resize-none text-sm sm:text-base"
                  placeholder="Enter your location details"
                  rows={3}
                ></textarea>
                <div className="absolute top-4 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="col-span-2" style={getFieldAnimation(10)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <Code size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Skills
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your skills (e.g., JavaScript, React, Node.js)"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="col-span-2" style={getFieldAnimation(11)}>
              <label className="flex items-center text-white mb-2 sm:mb-3 text-xs sm:text-sm font-medium">
                <BookOpen size={16} className="mr-2 sm:mr-3 text-blue-400" />
                Education
              </label>
              <div className="relative group">
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleInputFieldChange}
                  className="w-full p-3 sm:p-4 pl-3 sm:pl-5 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           transition-all duration-300 group-hover:border-gray-600 text-sm sm:text-base"
                  placeholder="Enter your education details"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="col-span-2 mt-4 sm:mt-6" style={getFieldAnimation(12)}>            <button
                type="submit"
                disabled={isSubmitting || !isFormTouched}
                className={`w-full p-3 sm:p-4 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 transform ${
                  isFormTouched && !isSubmitting ? 'hover:scale-[1.02]' : ''
                } 
                         bg-blue-600 ${
                           isFormTouched && !isSubmitting ? 'hover:bg-blue-700' : 'opacity-70'
                         }
                         text-white shadow-xl flex items-center justify-center space-x-2 sm:space-x-3 border border-blue-600`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "apikeys" && <ApiKeyManagement />}
    </div>
  );
};

export default ProfileRight;