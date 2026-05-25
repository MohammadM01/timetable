import React, { useState, useEffect, useContext } from 'react';
import { SchoolContext } from '../SchoolContext';
import * as api from '../utils/api';

const SubjectAssignment = () => {
  console.log('SubjectAssignment component rendering...');
  const { teachers: existingTeachers } = useContext(SchoolContext);
  console.log('Teachers from context:', existingTeachers);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStandard, setFilterStandard] = useState('');
  const [viewMode, setViewMode] = useState('teacher'); // 'teacher' or 'subject' or 'standard'

  // Assignment form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Upload states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const romanToVal = (roman) => {
    const map = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    return map[String(roman).trim().toUpperCase()] || 0;
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Starting to fetch data...');

        // Fetch teachers directly
        console.log('Fetching teachers...');
        const teachersResponse = await fetch(`http://localhost:5000/api/teachers?t=${Date.now()}`);
        if (!teachersResponse.ok) {
          throw new Error(`Failed to fetch teachers: ${teachersResponse.status}`);
        }
        const teachersData = await teachersResponse.json();
        console.log('Teachers fetched:', teachersData);
        setTeachers(teachersData);

        // Fetch subjects
        console.log('Fetching subjects...');
        const subjectsResponse = await fetch(`http://localhost:5000/api/subjects?t=${Date.now()}`);
        if (!subjectsResponse.ok) {
          throw new Error(`Failed to fetch subjects: ${subjectsResponse.status}`);
        }
        const subjectsData = await subjectsResponse.json();
        console.log('Subjects fetched:', subjectsData);
        
        // Sort subjects in ascending order V -> VI -> VII -> VIII -> IX -> X
        const sortedSubjects = subjectsData.sort((a, b) => {
          const valA = romanToVal(a.standard);
          const valB = romanToVal(b.standard);
          if (valA !== valB) {
            return valA - valB;
          }
          return (a.subject_name || '').localeCompare(b.subject_name || '');
        });
        setSubjects(sortedSubjects);

        // Fetch classes
        console.log('Fetching classes...');
        const classesResponse = await fetch(`http://localhost:5000/api/classes?t=${Date.now()}`);
        if (!classesResponse.ok) {
          throw new Error(`Failed to fetch classes: ${classesResponse.status}`);
        }
        const classesData = await classesResponse.json();
        console.log('Classes fetched:', classesData);
        
        // Sort classes in ascending order by Roman numeral grade and then division
        const sortedClasses = classesData.sort((a, b) => {
          const valA = romanToVal(a.standard);
          const valB = romanToVal(b.standard);
          if (valA !== valB) {
            return valA - valB;
          }
          return (a.division || '').localeCompare(b.division || '');
        });
        setClasses(sortedClasses);

        // Fetch existing assignments
        console.log('Fetching assignments...');
        const assignmentsResponse = await fetch(`http://localhost:5000/api/teacher-subjects?t=${Date.now()}`);
        if (!assignmentsResponse.ok) {
          throw new Error(`Failed to fetch assignments: ${assignmentsResponse.status}`);
        }
        const assignmentsData = await assignmentsResponse.json();
        console.log('Assignments fetched:', assignmentsData);
        console.log('Number of assignments:', assignmentsData.length);
        setAssignments(assignmentsData);

        console.log('Data fetch completed successfully');
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredClassesForSelectedSubject = () => {
    if (!selectedSubject) return [];
    const subjectObj = subjects.find(s => s.id === selectedSubject);
    if (!subjectObj) return [];
    return classes.filter(cls => cls.standard === subjectObj.standard);
  };

  // Filter assignments based on current filters
  const getFilteredAssignments = () => {
    let filtered = assignments;
    console.log('Initial assignments for filtering:', assignments);

    if (filterTeacher) {
      filtered = filtered.filter(a => 
        filterTeacher === 'principal' 
          ? a.teacherId === 'principal' 
          : a.teacherId === parseInt(filterTeacher)
      );
      console.log('After teacher filter:', filtered);
    }

    if (filterSubject) {
      filtered = filtered.filter(a => a.subjectId === filterSubject);
      console.log('After subject filter:', filtered);
    }

    if (filterStandard) {
      const subjectIds = subjects
        .filter(s => s.standard === filterStandard)
        .map(s => s.id);
      filtered = filtered.filter(a => subjectIds.includes(a.subjectId));
      console.log('After standard filter:', filtered);
    }

    console.log('Final filtered assignments:', filtered);
    return filtered;
  };

  // Group assignments by teacher
  const getAssignmentsByTeacher = () => {
    const filtered = getFilteredAssignments();
    const grouped = {};

    filtered.forEach(assignment => {
      const teacher = teachers.find(t => t.id === assignment.teacherId);
      if (teacher) {
        if (!grouped[teacher.id]) {
          grouped[teacher.id] = {
            teacher,
            assignments: []
          };
        }
        grouped[teacher.id].assignments.push(assignment);
      }
    });

    return Object.values(grouped);
  };

  // Group assignments by subject
  const getAssignmentsBySubject = () => {
    const filtered = getFilteredAssignments();
    const grouped = {};

    filtered.forEach(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      if (subject) {
        if (!grouped[subject.id]) {
          grouped[subject.id] = {
            subject,
            assignments: []
          };
        }
        grouped[subject.id].assignments.push(assignment);
      }
    });

    return Object.values(grouped);
  };

  // Group assignments by standard
  const getAssignmentsByStandard = () => {
    const filtered = getFilteredAssignments();
    const grouped = {};

    filtered.forEach(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      if (subject) {
        if (!grouped[subject.standard]) {
          grouped[subject.standard] = {
            standard: subject.standard,
            assignments: []
          };
        }
        grouped[subject.standard].assignments.push(assignment);
      }
    });

    return Object.values(grouped);
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!selectedTeacher || !selectedSubject) {
        setError('Please fill in all fields');
        return;
      }

      const payload = {
        teacherId: selectedTeacher === 'principal' ? 'principal' : parseInt(selectedTeacher),
        subjectId: selectedSubject,
        classId: selectedClass || null,
        preferredPeriods: [],
        avoidPeriods: [],
        consecutivePeriods: false
      };

      console.log('Creating assignment with payload:', payload);

      const response = await fetch('http://localhost:5000/api/teacher-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Assignment creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assignment creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to add assignment');
      }

      const createdAssignment = await response.json();
      console.log('Assignment created successfully:', createdAssignment);

      // Refresh assignments
      console.log('Refreshing assignments list...');
      const assignmentsResponse = await fetch('http://localhost:5000/api/teacher-subjects');
      const assignmentsData = await assignmentsResponse.json();
      console.log('Updated assignments list:', assignmentsData);
      setAssignments(assignmentsData);

      setSuccess('Assignment added successfully!');
      setSelectedTeacher('');
      setSelectedSubject('');
      setSelectedClass('');
      setShowAddForm(false);

    } catch (error) {
      console.error('Error in handleAddAssignment:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teacher-subjects/${assignmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
      setSuccess('Assignment deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const handleDeleteAllAssignments = async () => {
    if (assignments.length === 0) {
      setError('No assignments to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${assignments.length} teacher-subject assignments? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const result = await api.deleteAllTeacherSubjects();
      setAssignments([]);
      setSuccess(result.message || `Successfully deleted all ${result.deletedCount} assignments`);
    } catch (err) {
      setError(err.message || 'Failed to delete all assignments');
    }
  };

  const handleAutoAssign = async () => {
    const confirmMessage = "Are you sure you want to randomly assign subjects to teachers? This will clear all current assignments and allocate subjects based on teachers' capacities and standards.";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await api.autoAssignTeacherSubjects();
      
      // Refresh assignments
      const assignmentsResponse = await fetch(`http://localhost:5000/api/teacher-subjects?t=${Date.now()}`);
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);

      setSuccess(result.message || `Successfully randomly assigned ${result.addedCount} subjects!`);
      setLoading(false);
    } catch (err) {
      console.error('Error auto-assigning subjects:', err);
      setError(err.message || 'Failed to auto-assign subjects');
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await fetch('http://localhost:5000/api/teacher-subjects/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();

      // Refresh assignments
      const assignmentsResponse = await fetch('http://localhost:5000/api/teacher-subjects');
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);

      setSuccess(`Successfully uploaded ${result.addedCount} assignments!`);
      setUploadFile(null);
      setShowUploadForm(false);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    }
  };


  const getUniqueStandards = () => {
    return [...new Set(subjects.map(s => s.standard))].sort((a, b) => romanToVal(a) - romanToVal(b));
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-purple-600 mb-6">Subject Assignment Management</h2>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Subject Assignment Management</h2>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
        <strong>Debug Info:</strong> Teachers: {teachers.length}, Subjects: {subjects.length}, Classes: {classes.length}, Assignments: {assignments.length}
      </div>

      {/* Error and Success Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Action Buttons */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-200"
            >
              {showAddForm ? 'Cancel' : '+ Add Assignment'}
            </button>

            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-200"
            >
              {showUploadForm ? 'Cancel' : '📁 Upload Sheet'}
            </button>

            <button
              onClick={handleAutoAssign}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-200"
            >
              🪄 Random Auto-Assign
            </button>
          </div>

          {assignments.length > 0 && (
            <button
              onClick={handleDeleteAllAssignments}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition duration-200"
            >
              🗑️ Delete All ({assignments.length})
            </button>
          )}
        </div>
      </div>

      {/* Add Assignment Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Assignment</h3>
          <form onSubmit={handleAddAssignment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Choose teacher...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.isPrincipal ? `👑 ${teacher.name} (Principal)` : `👨‍🏫 ${teacher.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Choose subject...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name} - Grade {subject.standard}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class/Division Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class / Division
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                  disabled={!selectedSubject}
                >
                  <option value="">{selectedSubject ? "Choose class..." : "Select subject first"}</option>
                  {getFilteredClassesForSelectedSubject().map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedTeacher || !selectedSubject || (getFilteredClassesForSelectedSubject().length > 0 && !selectedClass)}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                Add Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Upload Assignments from Excel</h3>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                File should contain columns: Teacher ID, Subject ID
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!uploadFile}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
              >
                Upload File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Teacher Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Teacher
            </label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.isPrincipal ? `👑 ${teacher.name}` : `👨‍🏫 ${teacher.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>

          {/* Standard Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Standard
            </label>
            <select
              value={filterStandard}
              onChange={(e) => setFilterStandard(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Standards</option>
              {getUniqueStandards().map(standard => (
                <option key={standard} value={standard}>
                  Grade {standard}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Mode
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="teacher">By Teacher</option>
              <option value="subject">By Subject</option>
              <option value="standard">By Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Display */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">
            Assignments Overview
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({getFilteredAssignments().length} assignments)
            </span>
          </h4>
        </div>

        {getFilteredAssignments().length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No assignments found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add new assignments</p>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === 'teacher' && (
              <div className="space-y-6">
                {getAssignmentsByTeacher().map(({ teacher, assignments }) => (
                  <div key={teacher.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {teacher.isPrincipal ? '👑' : '👨‍🏫'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-lg font-semibold text-gray-900">{teacher.name}</h5>
                        <p className="text-sm text-gray-600">
                          {teacher.isPrincipal ? 'Principal' : 'Teacher'} • {assignments.length} assignments
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignments.map(assignment => {
                        const subject = subjects.find(s => s.id === assignment.subjectId);
                        return (
                          <div key={assignment.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{subject?.subject_name}</p>
                              <p className="text-sm text-gray-600">Class: {assignment.className || `Grade ${assignment.standard}`}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(assignment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'subject' && (
              <div className="space-y-6">
                {getAssignmentsBySubject().map(({ subject, assignments }) => (
                  <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">
                          {subject.subject_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-lg font-semibold text-gray-900">{subject.subject_name}</h5>
                        <p className="text-sm text-gray-600">
                          Grade {subject.standard} • {assignments.length} assignments
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignments.map(assignment => {
                        const teacher = teachers.find(t => t.id === assignment.teacherId);
                        return (
                          <div key={assignment.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{teacher?.name}</p>
                              <p className="text-sm text-gray-600">Class: {assignment.className || `Grade ${assignment.standard}`}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(assignment.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'standard' && (
              <div className="space-y-6">
                {getAssignmentsByStandard()
                  .sort((a, b) => romanToVal(a.standard) - romanToVal(b.standard))
                  .map(({ standard, assignments: stdAssignments }) => {
                  // Group assignments by subject within each standard
                  const subjectGrouped = {};
                  stdAssignments.forEach(assignment => {
                    const subject = subjects.find(s => s.id === assignment.subjectId);
                    if (subject) {
                      const key = subject.subject_name;
                      if (!subjectGrouped[key]) {
                        subjectGrouped[key] = {
                          subject,
                          entries: []
                        };
                      }
                      subjectGrouped[key].entries.push(assignment);
                    }
                  });

                  return (
                    <div key={standard} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-green-700">
                            {standard}
                          </span>
                        </div>
                        <div className="ml-3">
                          <h5 className="text-lg font-semibold text-gray-900">Standard {standard}</h5>
                          <p className="text-sm text-gray-600">
                            {Object.keys(subjectGrouped).length} subjects • {stdAssignments.length} assignments
                          </p>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject Name</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Weekly Periods</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Consecutive</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Teacher</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Class</th>
                              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(subjectGrouped)
                              .sort((a, b) => a.subject.subject_name.localeCompare(b.subject.subject_name))
                              .map(({ subject, entries }) =>
                              entries.map((assignment, idx) => {
                                const teacher = teachers.find(t => t.id === assignment.teacherId);
                                return (
                                  <tr key={assignment.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx > 0 ? 'bg-gray-50/30' : ''}`}>
                                    {idx === 0 ? (
                                      <>
                                        <td className="px-4 py-3 font-medium text-gray-900" rowSpan={entries.length}>
                                          {subject.subject_name}
                                        </td>
                                        <td className="px-4 py-3 text-center" rowSpan={entries.length}>
                                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold text-xs">
                                            {subject.weekly_periods}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center" rowSpan={entries.length}>
                                          {subject.consecutive_periods ? (
                                            <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">✓ Yes</span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">No</span>
                                          )}
                                        </td>
                                      </>
                                    ) : null}
                                    <td className="px-4 py-3 text-gray-800">
                                      {teacher?.isPrincipal ? '👑 ' : '👨‍🏫 '}{teacher?.name || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {assignment.className || `Grade ${assignment.standard}`}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <button
                                        onClick={() => handleDelete(assignment.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                        title="Delete assignment"
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectAssignment;