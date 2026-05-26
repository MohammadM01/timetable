import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
    { path: "/teacher-setup", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", label: "Teacher Setup" },
    { path: "/class-setup", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", label: "Class Setup" },
    { path: "/subject-setup", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Subject Setup" },
    { path: "/period-setup", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Period Setup" },
    { path: "/subject-assignment", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Subject Assignment" },
    { path: "/generate-timetable", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", label: "Generate Timetable" },
    { path: "/class-timetable", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", label: "Class Timetable" },
    { path: "/teacher-timetables", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", label: "Teacher Timetables" },
    { path: "/timetable-history", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Timetable History" },
  ];

  return (
    <aside 
      className={`relative z-20 border-r border-[#e6d5c3] bg-[#F5E9D9] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {!isCollapsed && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-cyan-700">Scholara</p>
              <h2 className="text-xl font-black gradient-title">Timetable</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all duration-200 hover:bg-cyan-50"
            aria-label="Toggle sidebar"
          >
            <svg
              className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mb-2 flex items-center rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <svg
                className={`w-5 h-5 ${isCollapsed ? "mx-auto" : "mr-3"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={item.icon}
                />
              </svg>
              {!isCollapsed && (
                <span>
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-200">
              P
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-black text-slate-800">Principal</p>
                <p className="text-xs font-bold text-slate-500">Constraint Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
