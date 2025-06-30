import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserPlus,
  FaLayerGroup,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const sidebarLinks = [
  { name: "Dashboard", icon: <FaHome />, to: "/pending-requests" },
  { name: "Manage Users", icon: <FaUsers />, to: "/admin/users" },
  { name: "Student Registration", icon: <FaUserPlus />, to: "/registerStudents" },
  { name: "Teacher Registration", icon: <FaChalkboardTeacher />, to: "/create-faculty" },
  { name: "Batch Creation", icon: <FaLayerGroup />, to: "/admin/batch/batches/create" },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger for small screens */}
      <button
        className="md:hidden fixed top-14 left-0 z-50 p-2 rounded-full bg-gray-800 text-white shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <FaBars size={22} />
      </button>

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-60 h-screen fixed top-0 left-0 bg-gray-800 border-r border-gray-700 shadow-lg py-8 px-4 z-40">
        <div className="mb-8 mt-16">
          <ul className="space-y-2">
            {sidebarLinks.map((link) => (
              <li key={link.name}>
                <button
                  onClick={() => navigate(link.to)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 text-blue-100 font-medium transition"
                >
                  {link.icon}
                  {link.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Sidebar Drawer for small screens */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-60 bg-gray-900 border-r border-gray-700 shadow-2xl py-8 px-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-8 flex justify-between items-center">
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
                aria-label="Close sidebar"
              >
                <FaTimes />
              </button>
            </div>
            <ul className="space-y-2">
              {sidebarLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => {
                      navigate(link.to);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700/80 text-blue-100 font-medium transition"
                  >
                    {link.icon}
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;