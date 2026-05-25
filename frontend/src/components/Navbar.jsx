import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <nav className="relative z-10 border-b border-white/70 bg-white/72 px-4 py-3 shadow-xl shadow-slate-100/60 backdrop-blur-2xl">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-black gradient-title">TimetableMaster</h1>
            <p className="hidden text-xs font-bold text-slate-500 md:block">No-free-period scheduling with strict teacher constraints</p>
          </div>
          <div className="hidden md:flex items-center space-x-4 ml-8">
            <button className="nav-link">Dashboard</button>
            <button className="nav-link">Schedule</button>
            <button className="nav-link">Reports</button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="relative rounded-2xl border border-white/80 bg-white/85 p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-50"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-white/80 bg-white/92 p-3 shadow-2xl shadow-slate-200/80 backdrop-blur-xl z-50">
                <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-bold text-cyan-900">All constraints ready for validation.</div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200/80"></div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-2xl px-3 py-2 text-sm font-black text-slate-700 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
