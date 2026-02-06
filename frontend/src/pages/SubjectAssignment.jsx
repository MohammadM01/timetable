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
  
  // Upload states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Starting to fetch data...');

        // Fetch subjects
        console.log('Fetching subjects...');
        const subjectsResponse = await fetch('http://localhost:5000/api/subjects');
        if (!subjectsResponse.ok) {
          throw new Error(`Failed to fetch subjects: ${subjectsResponse.status}`);
        }
        const subjectsData = await subjectsResponse.json();
        console.log('Subjects fetched:', subjectsData);
        setSubjects(subjectsData);

        // Fetch classes
        console.log('Fetching classes...');
        const classesResponse = await fetch('http://localhost:5000/api/classes');
        if (!classesResponse.ok) {
          throw new Error(`Failed to fetch classes: ${classesResponse.status}`);
        }
        const classesData = await classesResponse.json();
        console.log('Classes fetched:', classesData);
        const sortedClasses = classesData.sort((a, b) => {
          const standardA = a.standard.toLowerCase();
          const standardB = b.standard.toLowerCase();
          const divisionA = a.division.toLowerCase();
          const divisionB = b.division.toLowerCase();
          
          if (standardA !== standardB) {
            return standardA.localeCompare(standardB);
          }
          return divisionA.localeCompare(divisionB);
        });
        setClasses(sortedClasses);

        // Fetch existing assignments
        console.log('Fetching assignments...');
        const assignmentsResponse = await fetch('http://localhost:5000/api/teacher-subjects');
        if (!assignmentsResponse.ok) {
          throw new Error(`Failed to fetch assignments: ${assignmentsResponse.status}`);
        }
        const assignmentsData = await assignmentsResponse.json();
        console.log('Assignments fetched:', assignmentsData);
        console.log('Number of assignments:', assignmentsData.length);
        setAssignments(assignmentsData);

        // Use teachers directly from context
        console.log('Using teachers from context:', existingTeachers);
        if (existingTeachers && existingTeachers.length > 0) {
          setTeachers(existingTeachers);
        } else {
          console.warn('No teachers found in context');
          setError('No teachers found. Please add teachers first.');
        }
        
        console.log('Data fetch completed successfully');
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(`Failed to load data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [existingTeachers]);

  // Filter assignments based on current filters
  const getFilteredAssignments = () => {
    let filtered = assignments;
    console.log('Initial assignments for filtering:', assignments);

    if (filterTeacher) {
      filtered = filtered.filter(a => a.teacherId === parseInt(filterTeacher));
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
        teacherId: parseInt(selectedTeacher),
        subjectId: selectedSubject,
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
    return [...new Set(subjects.map(s => s.standard))].sort();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!selectedTeacher || !selectedSubject}
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
                              <p className="text-sm text-gray-600">Grade {assignment.standard}</p>
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
                              <p className="text-sm text-gray-600">Grade {assignment.standard}</p>
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
                {getAssignmentsByStandard().map(({ standard, assignments }) => (
                  <div key={standard} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-green-600">
                          {standard}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-lg font-semibold text-gray-900">Grade {standard}</h5>
                        <p className="text-sm text-gray-600">{assignments.length} assignments</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignments.map(assignment => {
                        const teacher = teachers.find(t => t.id === assignment.teacherId);
                        const subject = subjects.find(s => s.id === assignment.subjectId);
                        return (
                          <div key={assignment.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{teacher?.name}</p>
                              <p className="text-sm text-gray-600">{subject?.subject_name}</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectAssignment;