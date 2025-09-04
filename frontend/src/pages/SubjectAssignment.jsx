import React, { useState, useEffect, useContext } from 'react';
import { SchoolContext } from '../SchoolContext';

const SubjectAssignment = () => {
  const { teachers: existingTeachers } = useContext(SchoolContext);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    subject_id: '',
    class_id: ''
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch subjects
        const subjectsResponse = await fetch('http://localhost:5000/api/subjects');
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);

        // Fetch classes
        const classesResponse = await fetch('http://localhost:5000/api/classes');
        const classesData = await classesResponse.json();
        // Sort classes by standard and division
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
        const assignmentsResponse = await fetch('http://localhost:5000/api/teacher-subjects');
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData);

        // Use teachers directly from context
        if (existingTeachers && existingTeachers.length > 0) {
          setTeachers(existingTeachers);
        } else {
          setError('No teachers found. Please add teachers first.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [existingTeachers]);

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      // Validate form fields
      if (!selectedTeacher) {
        setError('Please select a teacher');
        return;
      }
      if (!newAssignment.subject_id) {
        setError('Please select a subject');
        return;
      }
      if (!newAssignment.class_id) {
        setError('Please select a class');
        return;
      }

      const teacher = teachers.find(t => t.id === selectedTeacher);
      if (!teacher) {
        setError('Selected teacher not found');
        return;
      }

      // Create the payload - backend expects teacherId and subjectId
      const payload = {
        teacherId: selectedTeacher, // Use teacherId (not teacher_id)
        subjectId: newAssignment.subject_id, // Use subjectId (not subject_id)
        preferredPeriods: [],
        avoidPeriods: [],
        consecutivePeriods: false
      };

      console.log('Sending payload:', payload);

      const response = await fetch('http://localhost:5000/api/teacher-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add assignment');
      }

      // Fetch updated assignments
      const assignmentsResponse = await fetch('http://localhost:5000/api/teacher-subjects');
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);

      setSuccess('Assignment added successfully!');
      setNewAssignment({
        subject_id: '',
        class_id: ''
      });
      setSelectedTeacher(null);
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

  const getTeacherAssignments = (teacherId) => {
    // Return empty array if no teacher is selected
    if (teacherId === null || teacherId === undefined) {
      return [];
    }

    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) {
      console.error('Teacher not found in getTeacherAssignments:', teacherId);
      return [];
    }

    return assignments.filter(a => 
      teacher.isPrincipal 
        ? a.principal_id === 1
        : a.teacher_id === teacherId
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Subject Assignment</h2>
      
      {/* Error and Success Messages */}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

      {/* Teacher Selection */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
          <select
            value={selectedTeacher === null ? '' : String(selectedTeacher)}
            onChange={(e) => {
              const value = e.target.value === '' ? null : Number(e.target.value);
              console.log('Selected teacher value:', { 
                raw: e.target.value, 
                parsed: value,
                type: typeof value,
                teachers: teachers.map(t => ({ id: t.id, type: typeof t.id }))
              });
              setSelectedTeacher(value);
              setShowAddForm(false);
              setError('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Select a Teacher</option>
            {teachers.map(teacher => (
              <option 
                key={teacher.isPrincipal ? `p_${teacher.id}` : `t_${teacher.id}`}
                value={String(teacher.id)}
                className={teacher.isPrincipal ? 'text-purple-600 font-semibold' : ''}
              >
                {teacher.isPrincipal ? `${teacher.name} (Principal)` : teacher.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Teacher's Assignments */}
      {selectedTeacher !== null && (
        <div className="space-y-6">
          {/* Add Assignment Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300"
            >
              {showAddForm ? 'Cancel' : 'Add New Assignment'}
            </button>
          </div>

          {/* Add Assignment Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h3 className="text-lg font-semibold mb-4">New Assignment</h3>
              <form onSubmit={handleAddAssignment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={newAssignment.subject_id}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, subject_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={`s_${subject.id}`} value={String(subject.id)}>
                          {subject.subject_name} ({subject.standard})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={newAssignment.class_id}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, class_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={`c_${cls.id}`} value={String(cls.id)}>{cls.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300"
                  >
                    Add Assignment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Assignments Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getTeacherAssignments(selectedTeacher).map(assignment => {
                  const subject = subjects.find(s => s.id === assignment.subject_id);
                  const cls = classes.find(c => c.id === assignment.class_id);
                  
                  return (
                    <tr key={`a_${assignment.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject?.subject_name} ({subject?.standard})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cls?.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {getTeacherAssignments(selectedTeacher).length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No assignments found for this teacher
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectAssignment; 