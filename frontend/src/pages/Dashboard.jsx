import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SchoolContext } from '../SchoolContext';

const DashboardCard = ({ to, icon, title, description, color }) => (
  <Link
    to={to}
    className="card group hover:border-l-4 hover:border-primary transition-all duration-200"
  >
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        <p className="text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </Link>
);

const StatCard = ({ title, value, icon, color }) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { teachers, classes, subjects } = useContext(SchoolContext);

  const stats = [
    {
      title: "Total Teachers",
      value: teachers.length || 0,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "bg-primary"
    },
    {
      title: "Total Classes",
      value: classes.length || 0,
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "bg-secondary"
    },
    {
      title: "Total Subjects",
      value: subjects.length || 0,
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      color: "bg-accent"
    }
  ];

  const quickActions = [
    {
      to: "/teacher-setup",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      title: "Teacher Setup",
      description: "Manage teachers and their teaching periods",
      color: "bg-primary"
    },
    {
      to: "/class-setup",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      title: "Class Setup",
      description: "Define classes and their divisions",
      color: "bg-secondary"
    },
    {
      to: "/subject-setup",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      title: "Subject Setup",
      description: "Manage subjects and their allocations",
      color: "bg-accent"
    },
    {
      to: "/period-setup",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Period Setup",
      description: "Configure daily periods and timings",
      color: "bg-primary"
    },
    {
      to: "/generate-timetable",
      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
      title: "Generate Timetable",
      description: "Create and manage school timetables",
      color: "bg-secondary"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, Principal!</h1>
        <p className="text-gray-600 mt-1">Here's what's happening in your school today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <DashboardCard key={index} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;