import React from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  MessageSquare,
  ExternalLink,
  Clock
} from "lucide-react";

const Support = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Main Content */}
      <div className="flex-1 bg-gray-900 mt-8">
        {/* Header Section */}
        <div className="from-gray-900 mb-8 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="mt-16"></div>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-blue-400">
                  Support Center
                </h1>
                <p className="text-gray-400 mt-2">
                  We're here to help with any questions or issues
                </p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-full">
                <HelpCircle size={28} className="text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* Contact Information */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-blue-400 mb-4">Contact Us</h2>
                  <p className="text-gray-300 mb-6">
                    Feel free to reach out with your questions, feedback, or concerns. 
                    Our team is dedicated to providing you with the best support possible.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail size={20} className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Email</p>
                        <a href="mailto:22it015@charusat.edu.in" className="text-blue-400 hover:text-blue-300 transition-colors">
                          22it015@charusat.edu.in, 22it111@charusat.edu.in
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin size={20} className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Address</p>
                        <p className="text-gray-400">
                          Charotar University of Science and Technology, 
                          <br />CHARUSAT Campus, Off. Nadiad-Petlad Highway, 
                          <br />Changa-388421
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock size={20} className="text-blue-400 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Support Hours</p>
                        <p className="text-gray-400">Monday - Saturday : 9:10 AM - 4:20 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-blue-400 mb-4">Additional Resources</h2>
                  
                  <div className="bg-gray-700/50 rounded-lg p-6 mb-6 border border-gray-600">
                    <div className="flex items-center mb-4">
                      <MessageSquare size={24} className="text-blue-400 mr-3" />
                      <h3 className="text-lg font-medium text-white">FAQs</h3>
                    </div>
                    <p className="text-gray-300 mb-3">
                      Find answers to commonly asked questions about our platform, 
                      submission process, and contest rules.
                    </p>
                    <button 
                      onClick={() => navigate("/browse")}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center"
                    >
                      Browse FAQs <ExternalLink size={14} className="ml-1" />
                    </button>
                  </div>
                  
                  <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center mb-4">
                      <Phone size={24} className="text-blue-400 mr-3" />
                      <h3 className="text-lg font-medium text-white">Technical Support</h3>
                    </div>
                    <p className="text-gray-300 mb-3">
                      Need technical assistance? Our support team is available to help
                      with any platform-related issues.
                    </p>
                    <button 
                      onClick={() => window.open("tel:+919876543210")}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center"
                    >
                      Contact Support <ExternalLink size={14} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* College Logo & Info */}
            <div className="bg-gray-800/50 px-6 py-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <img
                  className="w-16 h-16 rounded-lg object-contain bg-white p-1"
                  src="/collageLogo.jpg"
                  alt="College Logo"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Charotar University</h3>
                  <p className="text-sm text-gray-400">Developing Coding Excellence</p>
                </div>
              </div>
              <button
                onClick={() => window.open("https://charusat.ac.in", "_blank")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg"
              >
                Visit University Website
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;