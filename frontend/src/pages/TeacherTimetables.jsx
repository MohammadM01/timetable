import React, { useState, useEffect, useContext } from 'react';
import { SchoolContext } from '../SchoolContext';
import TeacherTimetable from '../components/TeacherTimetable';

const TeacherTimetables = () => {
  const { teachers } = useContext(SchoolContext);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTeacherSelect = (teacherId) => {
    setSelectedTeacher(teacherId);
    setError('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-purple-600">Teacher Timetables</h2>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Teacher Selection */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Select Teacher</h3>
        <div className="max-w-xs">
          <select
            value={selectedTeacher === null ? '' : selectedTeacher}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              handleTeacherSelect(val && !isNaN(numVal) ? numVal : null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select a Teacher</option>
            {teachers
              .filter(t => t.id !== 'principal')
              .map(teacher => (
                <option key={teacher.id} value={teacher.id || ''}>
                  {teacher.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Teacher Timetable Display */}
      {selectedTeacher && (
        <TeacherTimetable 
          teacherId={selectedTeacher}
          teacherName={teachers.find(t => t.id === selectedTeacher)?.name}
        />
      )}

      {/* Instructions */}
      {!selectedTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How Teacher Timetables Work</h3>
          <ul className="text-blue-700 space-y-2">
            <li>• Teacher timetables are automatically generated when you create class timetables</li>
            <li>• Each teacher's schedule is based on their subject assignments to classes</li>
            <li>• Free periods are shown when teachers are not assigned to any class</li>
            <li>• The system ensures no teacher has conflicting periods</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetables;
