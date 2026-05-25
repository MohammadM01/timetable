import React, { useState, useContext, useEffect } from 'react';
import { SchoolContext } from '../SchoolContext';
import { 
  saveTeachers, 
  savePrincipal, 
  deletePrincipal, 
  fetchTeachers, 
  deleteTeacher, 
  updateTeacher,
  uploadTeachers,
  updatePrincipalPeriods,
  deleteAllTeachersIncludingPrincipal
} from '../utils/api';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { FaFileUpload, FaDownload } from 'react-icons/fa';

const TeacherSetup = () => {
  const { teachers: existingTeachers, addTeachers, addPrincipal } = useContext(SchoolContext);
  const [numTeachers, setNumTeachers] = useState(0);
  const [teachers, setTeachers] = useState([]);
  const [principal, setPrincipal] = useState({ name: 'Principal', weeklyPeriods: 0, dailyPeriods: 5 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrincipal, setEditingPrincipal] = useState(null);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    weeklyPeriods: 20,
    dailyPeriods: 5
  });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showTeacherEditModal, setShowTeacherEditModal] = useState(false);
  const [showPrincipalSelectModal, setShowPrincipalSelectModal] = useState(false);
  const [importedTeachers, setImportedTeachers] = useState([]);

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        setError(''); // Clear previous errors
        setSuccess('Uploading file...');
        
        console.log('Uploading file:', file.name);
        
        // Upload the Excel file for teachers
        const uploadResult = await uploadTeachers(file);
        console.log('Upload result:', uploadResult);
        
        // Check if the upload result has the expected data
        if (!uploadResult || !Array.isArray(uploadResult)) {
          throw new Error('Invalid response from server. Expected array of teachers.');
        }
        
        // Check if any teachers have weekly periods
        const teachersWithPeriods = uploadResult.filter(t => t.weeklyPeriods > 0);
        const teachersWithoutPeriods = uploadResult.filter(t => t.weeklyPeriods === 0 || t.weeklyPeriods === undefined);
        
        console.log('Teachers with periods:', teachersWithPeriods);
        console.log('Teachers without periods:', teachersWithoutPeriods);
        
        if (teachersWithoutPeriods.length > 0) {
          setError(`Warning: ${teachersWithoutPeriods.length} teachers have no weekly periods. Check your Excel file format.`);
        }
        
        // Fetch updated data
        const teachersData = await fetchTeachers();
        console.log('Fetched teachers data:', teachersData);
        
        // Store imported teachers and show principal selection modal
        setImportedTeachers(teachersData);
        setShowPrincipalSelectModal(true);
        
        setSuccess(`Teachers imported successfully! ${uploadResult.length} teachers processed. Please select a principal.`);
      } catch (err) {
        console.error('Error uploading file:', err);
        setError(`Upload failed: ${err.message || 'Failed to upload file'}`);
        setSuccess('');
      }
    }
  };

  const handlePrincipalSelect = async (selectedTeacher) => {
    try {
      // Format principal data
      const formattedPrincipal = {
        name: selectedTeacher.name,
        weeklyPeriods: selectedTeacher.weeklyPeriods || 20,
        dailyPeriods: selectedTeacher.dailyPeriods || 5
      };
      
      // Save principal
      const result = await savePrincipal(formattedPrincipal);
      
      // Update context
      addPrincipal(formattedPrincipal);
      
      setSuccess(result.message || 'Principal selected successfully!');
      setError('');
      setShowPrincipalSelectModal(false);
      
      // Reload to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error saving principal:', err);
      setError(err.message || 'Failed to save principal');
      setSuccess('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const template = [
      {
        Name: 'John Doe',
        'Weekly Periods': 20,
        'Daily Periods': 5
      },
      {
        Name: 'Jane Smith',
        'Weekly Periods': 18,
        'Daily Periods': 4
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
    XLSX.writeFile(wb, 'teachers_template.xlsx');
  };

  // Find principal in existing teachers
  useEffect(() => {
    const principalTeacher = existingTeachers.find(t => t.id === 'principal');
    if (principalTeacher) {
      setPrincipal(principalTeacher);
    }
  }, [existingTeachers]);

  const handleDeletePrincipal = async () => {
    if (window.confirm('Are you sure you want to delete the principal? This action cannot be undone.')) {
      try {
        await deletePrincipal();
        window.location.reload();
      } catch (error) {
        setError('Failed to delete principal');
      }
    }
  };

  const handleNumTeachersChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setNumTeachers(count);
    setTeachers(
      Array.from({ length: count }, (_, i) => ({
        name: '',
        id: i + 1,
        weeklyPeriods: 20,
        dailyPeriods: 5,
      }))
    );
  };

  const handleTeacherChange = (index, field, value) => {
    const newTeachers = [...teachers];
    newTeachers[index][field] = value;
    setTeachers(newTeachers);
  };

  const handlePrincipalChange = (field, value) => {
    setPrincipal((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewTeacherChange = (field, value) => {
    setNewTeacher((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!principal.name || principal.weeklyPeriods === undefined || principal.dailyPeriods === undefined) {
        setError('Please fill in all principal fields');
        return;
      }

      // Validate numeric values
      const weeklyPeriods = Number(principal.weeklyPeriods);
      const dailyPeriods = Number(principal.dailyPeriods);
      
      if (isNaN(weeklyPeriods) || isNaN(dailyPeriods)) {
        setError('Weekly periods and daily periods must be valid numbers');
        return;
      }

      if (weeklyPeriods < 0 || dailyPeriods < 0) {
        setError('Weekly periods and daily periods cannot be negative');
        return;
      }

      // Format principal data
      const formattedPrincipal = {
        name: principal.name.trim(),
        weeklyPeriods: weeklyPeriods,
        dailyPeriods: dailyPeriods
      };
      
      console.log('Saving principal with formatted data:', formattedPrincipal);
      
      // Check if this name exists as a teacher
      const teacherWithSameName = existingTeachers.find(
        t => t.name.toLowerCase() === formattedPrincipal.name.toLowerCase() && t.id !== 'principal'
      );

      if (teacherWithSameName) {
        const confirmConvert = window.confirm(
          `"${formattedPrincipal.name}" is currently a teacher. Would you like to convert them to principal? This will remove them from the teachers list.`
        );
        if (!confirmConvert) {
          setError('Operation cancelled');
          return;
        }
      }
      
      // Save principal
      const result = await savePrincipal(formattedPrincipal);
      console.log('Save principal result:', result);
      
      // Update context
      addPrincipal(formattedPrincipal);
      
      setSuccess(result.message || 'Principal saved successfully!');
      setError('');
      
      // Reload to refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error saving principal:', err);
      setError(err.message || 'Failed to save principal');
      setSuccess('');
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.name || !newTeacher.weeklyPeriods || !newTeacher.dailyPeriods) {
      setError('Please fill in all fields');
      return;
    }

    // Check if the new teacher's name matches the principal's name
    if (newTeacher.name.toLowerCase() === principal.name.toLowerCase()) {
      setError('This teacher is already registered as the principal');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/teachers/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTeacher),
      });

      if (!response.ok) {
        throw new Error('Failed to add teacher');
      }

      setShowModal(false);
      setNewTeacher({
        name: '',
        weeklyPeriods: 20,
        dailyPeriods: 5
      });
      window.location.reload();
    } catch (error) {
      setError('Failed to add teacher');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teachers/${teacherId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete teacher');
      // Refresh the page to update the list
      window.location.reload();
    } catch (error) {
      setError('Failed to delete teacher');
    }
  };

  const handleEditPrincipal = () => {
    setEditingPrincipal({
      ...principal,
      weeklyPeriods: Number(principal.weeklyPeriods),
      dailyPeriods: Number(principal.dailyPeriods)
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await savePrincipal(editingPrincipal);
      setPrincipal(editingPrincipal);
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      setError('Failed to update principal');
    }
  };

  const handleEditTeacher = (teacher) => {
    // Ensure we have a valid teacher object
    if (!teacher || !teacher.id) {
      setError('Invalid teacher data');
      return;
    }

    // Convert ID to number if it's a string
    const teacherId = typeof teacher.id === 'string' ? parseInt(teacher.id, 10) : teacher.id;

    // Validate the ID
    if (isNaN(teacherId)) {
      setError('Invalid teacher ID');
      return;
    }

    setEditingTeacher({
      id: teacherId,
      name: teacher.name,
      weeklyPeriods: Number(teacher.weeklyPeriods),
      dailyPeriods: Number(teacher.dailyPeriods)
    });
    setShowTeacherEditModal(true);
  };

  const handleSaveTeacherEdit = async () => {
    try {
      // Ensure we have a valid ID
      if (!editingTeacher.id || isNaN(editingTeacher.id)) {
        setError('Invalid teacher ID');
        return;
      }

      console.log('Updating teacher:', editingTeacher);

      const response = await fetch(`http://localhost:5000/api/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingTeacher.name,
          weeklyPeriods: Number(editingTeacher.weeklyPeriods),
          dailyPeriods: Number(editingTeacher.dailyPeriods)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update teacher');
      }

      console.log('Update successful:', data);
      setSuccess('Teacher updated successfully');
      setError('');
      setShowTeacherEditModal(false);
      
      // Fetch updated data
      const teachersResponse = await fetch('http://localhost:5000/api/teachers');
      if (!teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        throw new Error(teachersData.error || 'Failed to fetch updated teachers');
      }
      const teachersData = await teachersResponse.json();
      
      // Update the context
      addTeachers(teachersData.filter(t => t.id !== 'principal'));
      
      // Update principal data if needed
      const principalData = teachersData.find(t => t.id === 'principal');
      if (principalData) {
        setPrincipal(principalData);
        addPrincipal(principalData);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      setError(error.message || 'Failed to update teacher');
      // Keep the modal open when there's an error
    }
  };


  const handleDeleteAllIncludingPrincipal = async () => {
    const totalCount = existingTeachers.length;
    
    if (totalCount === 0) {
      setError('No teachers or principal to delete');
      return;
    }

    const confirmMessage = `⚠️ WARNING: This will delete ALL ${totalCount} teachers AND the principal!\n\nThis action cannot be undone and will completely clear all teacher data.\n\nAre you absolutely sure you want to continue?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const result = await deleteAllTeachersIncludingPrincipal();
      setSuccess(result.message || `Successfully deleted all ${result.deletedCount} teachers and principal`);
      
      // Clear all data
      addTeachers([]);
      setPrincipal({ name: 'Principal', weeklyPeriods: 0, dailyPeriods: 5 });
      
      // Fetch updated data to ensure consistency
      const teachersResponse = await fetch('http://localhost:5000/api/teachers');
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        addTeachers(teachersData.filter(t => t.id !== 'principal'));
        
        // Update principal data if it exists
        const principalData = teachersData.find(t => t.id === 'principal');
        if (principalData) {
          setPrincipal(principalData);
          addPrincipal(principalData);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete all teachers and principal');
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: '#334155' }}>Teacher Setup</h2>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          {success}
        </div>
      )}

      {/* Debug Section - Show raw data */}
      {existingTeachers.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-yellow-800">Debug Info - Teacher Data:</h3>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:5000/api/teachers/test');
                    const data = await response.json();
                    console.log('Test API Response:', data);
                    setSuccess('Check console for test API response');
                  } catch (err) {
                    setError('Test API failed: ' + err.message);
                  }
                }}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
              >
                Test API
              </button>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls';
                  input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch('http://localhost:5000/api/teachers/test-parse', {
                          method: 'POST',
                          body: formData
                        });
                        const data = await response.json();
                        console.log('Test Parse Response:', data);
                        setSuccess('Check console for test parse response');
                      } catch (err) {
                        setError('Test parse failed: ' + err.message);
                      }
                    }
                  };
                  input.click();
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Test Parse
              </button>
            </div>
          </div>
          <div className="text-sm text-yellow-700 max-h-40 overflow-y-auto">
            {existingTeachers.slice(0, 3).map((teacher, index) => (
              <div key={index} className="mb-2 p-2 bg-yellow-100 rounded">
                <strong>Teacher {index + 1}:</strong><br/>
                Name: {teacher.name}<br/>
                Weekly Periods: {teacher.weeklyPeriods} (type: {typeof teacher.weeklyPeriods})<br/>
                Daily Periods: {teacher.dailyPeriods} (type: {typeof teacher.dailyPeriods})<br/>
                ID: {teacher.id} (type: {typeof teacher.id})
              </div>
            ))}
            {existingTeachers.length > 3 && (
              <div className="text-xs text-yellow-600">
                ... and {existingTeachers.length - 3} more teachers
              </div>
            )}
          </div>
        </div>
      )}

      {/* Excel Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-600">Bulk Upload Teachers</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaDownload className="mr-2" />
            Download Template
          </button>
        </div>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Required Excel Format:</h4>
          <div className="text-sm text-blue-700">
            <p><strong>Column 1:</strong> Name (or Teacher Name)</p>
            <p><strong>Column 2:</strong> Weekly Periods (or Weekly)</p>
            <p><strong>Column 3:</strong> Daily Periods (or Daily)</p>
            <p className="mt-2 text-blue-600">Download the template above to see the exact format!</p>
          </div>
        </div>
        <div className="flex items-center">
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition duration-300 ease-in-out transform hover:scale-105">
            <FaFileUpload className="mr-2" />
            Upload Excel File
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onDrop(e.target.files);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add New Teacher Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-blue-600 mb-4">Add New Teacher</h3>
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
              value={newTeacher.name}
              onChange={(e) => handleNewTeacherChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Periods</label>
              <input
                type="number"
              value={newTeacher.weeklyPeriods}
              onChange={(e) => handleNewTeacherChange('weeklyPeriods', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Periods</label>
            <input
              type="number"
              value={newTeacher.dailyPeriods}
              onChange={(e) => handleNewTeacherChange('dailyPeriods', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              min="0"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Add Teacher
          </button>
        </form>
      </div>

      {/* Display Existing Teachers */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-600">Existing Teachers</h3>
          {existingTeachers.length > 0 && (
            <button
              onClick={handleDeleteAllIncludingPrincipal}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition duration-200"
              title="Delete ALL teachers AND principal (complete reset)"
            >
              Delete All ({existingTeachers.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Periods</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Periods</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Principal Row - Always First */}
              {principal && (
                <tr className="bg-purple-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-700">1</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-700">{principal.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{principal.weeklyPeriods}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{principal.dailyPeriods}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={handleEditPrincipal}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePrincipal}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )}
              {/* Regular Teachers */}
              {existingTeachers
                .filter(t => t.id !== 'principal')
                .map((teacher, index) => (
                  <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 2}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.weeklyPeriods}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.dailyPeriods}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditTeacher(teacher)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Principal Modal */}
      {showEditModal && editingPrincipal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-blue-600">Edit Principal</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPrincipal(null);
                }}
                className="text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingPrincipal.name}
                  onChange={(e) => setEditingPrincipal({...editingPrincipal, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Periods</label>
                <input
                  type="number"
                  value={editingPrincipal.weeklyPeriods}
                  onChange={(e) => setEditingPrincipal({...editingPrincipal, weeklyPeriods: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Periods</label>
                <input
                  type="number"
                  value={editingPrincipal.dailyPeriods}
                  onChange={(e) => setEditingPrincipal({...editingPrincipal, dailyPeriods: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPrincipal(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showTeacherEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-blue-600">Edit Teacher</h3>
              <button
                onClick={() => {
                  setShowTeacherEditModal(false);
                  setEditingTeacher(null);
                }}
                className="text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveTeacherEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Periods</label>
                <input
                  type="number"
                  value={editingTeacher.weeklyPeriods}
                  onChange={(e) => setEditingTeacher({...editingTeacher, weeklyPeriods: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Periods</label>
                <input
                  type="number"
                  value={editingTeacher.dailyPeriods}
                  onChange={(e) => setEditingTeacher({...editingTeacher, dailyPeriods: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  required
                />
        </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherEditModal(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
        <button
          type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
                  Save Changes
        </button>
              </div>
      </form>
          </div>
        </div>
      )}

      {/* Principal Selection Modal */}
      {showPrincipalSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Select Principal</h2>
            <p className="mb-4">Please select a teacher to be the principal:</p>
            <div className="max-h-60 overflow-y-auto">
              {importedTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handlePrincipalSelect(teacher)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded mb-2"
                >
                  {teacher.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPrincipalSelectModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSetup;