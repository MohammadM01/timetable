import React, { useState, useContext, useEffect } from 'react';
import { SchoolContext } from '../SchoolContext';
import { saveSubjects, fetchSubjects, deleteSubject, updateSubject, deleteAllSubjects } from '../utils/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SubjectSetup = () => {
  const { addSubjects } = useContext(SchoolContext);
  const [newSubject, setNewSubject] = useState({
    standard: '',
    name: '',
    weeklyPeriods: 0,
    consecutivePeriods: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingSubjects, setExistingSubjects] = useState([]);
  const [editingSubject, setEditingSubject] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const subjects = await fetchSubjects();
      setExistingSubjects(subjects);
    } catch (err) {
      setError('Failed to load subjects');
    }
  };

  const handleNewSubjectChange = (field, value) => {
    setNewSubject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const subjectData = {
        standard: newSubject.standard.trim(),
        subject_name: newSubject.name.trim(),
        weekly_periods: newSubject.weeklyPeriods,
        consecutive_periods: newSubject.consecutivePeriods,
      };

      if (!subjectData.standard || !subjectData.subject_name) {
        throw new Error('Please fill in all required fields');
      }
      
      // Save to backend
      await saveSubjects([subjectData]);
      
      // Refresh the subjects list
      await loadSubjects();
      
      setSuccess('Subject saved successfully!');
      // Reset form
      setNewSubject({
        standard: '',
        name: '',
        weeklyPeriods: 0,
        consecutivePeriods: false
      });
    } catch (err) {
      setError(err.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await deleteSubject(id);
      setExistingSubjects(response.subjects);
      setSuccess('Subject deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete subject');
    }
  };

  const handleDeleteAll = async () => {
    if (existingSubjects.length === 0) {
      setError('No subjects to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${existingSubjects.length} subjects? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const result = await deleteAllSubjects();
      setExistingSubjects([]);
      setSuccess(result.message || `Successfully deleted all ${result.deletedCount} subjects`);
    } catch (err) {
      setError(err.message || 'Failed to delete all subjects');
    }
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const response = await updateSubject(editingSubject.id, editingSubject);
      
      // Update the subjects list with the updated subject
      setExistingSubjects(prevSubjects => 
        prevSubjects.map(sub => 
          sub.id === response.subject.id ? response.subject : sub
        )
      );
      
      setSuccess('Subject updated successfully');
      setShowEditModal(false);
      setEditingSubject(null);
    } catch (err) {
      setError(err.message || 'Failed to update subject');
    }
  };

  const handleEditChange = (field, value) => {
    setEditingSubject(prev => ({
      ...prev,
      [field]: field === 'consecutive_periods' ? value : value
    }));
  };

  const handleCleanupDuplicates = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch('http://localhost:5000/api/subjects/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clean up duplicates');
      }

      const data = await response.json();
      setExistingSubjects(data.subjects);
      setSuccess('Duplicates cleaned up successfully');
    } catch (err) {
      setError(err.message || 'Failed to clean up duplicates');
    }
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = existingSubjects.map(subject => ({
        Standard: subject.standard,
        'Subject Name': subject.subject_name,
        'Weekly Periods': subject.weekly_periods,
        'Consecutive Periods': subject.consecutive_periods ? 'Yes' : 'No'
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(data, 'subjects.xlsx');
      setSuccess('Subjects exported successfully');
    } catch (err) {
      setError('Failed to export subjects: ' + err.message);
    }
  };

  const handleImportExcel = async (event) => {
    try {
      setError('');
      setSuccess('');
      setImportError('');
      
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and transform data
          const subjects = jsonData.map(row => ({
            standard: row.Standard || row.standard,
            subject_name: row['Subject Name'] || row.subject_name,
            weekly_periods: parseInt(row['Weekly Periods'] || row.weekly_periods) || 0,
            consecutive_periods: (row['Consecutive Periods'] || row.consecutive_periods || '').toString().toLowerCase() === 'yes'
          }));

          // Validate required fields
          const invalidRows = subjects.filter(s => !s.standard || !s.subject_name);
          if (invalidRows.length > 0) {
            setImportError('Some rows are missing required fields (Standard or Subject Name)');
            return;
          }

          // Send to backend
          const response = await fetch('http://localhost:5000/api/subjects/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subjects })
          });

          if (!response.ok) {
            throw new Error('Failed to import subjects');
          }

          const result = await response.json();
          setExistingSubjects(result.subjects);
          setSuccess('Subjects imported successfully');
          event.target.value = ''; // Reset file input
        } catch (err) {
          setError('Failed to import subjects: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError('Failed to read Excel file: ' + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      // Create template data with example row
      const templateData = [
        {
          Standard: 'V',
          'Subject Name': 'English',
          'Weekly Periods': '6',
          'Consecutive Periods': 'Yes'
        }
      ];

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Subjects Template');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(data, 'subjects_template.xlsx');
      setSuccess('Template downloaded successfully');
    } catch (err) {
      setError('Failed to download template: ' + err.message);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Main Heading */}
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Subject Setup</h2>

      {/* Bulk Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-[#3b82f6] font-medium">Bulk Upload Subjects</h2>
          <button
            onClick={handleDownloadTemplate}
            className="bg-[#3b82f6] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>
        </div>

        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
            id="excel-import"
          />
          <label
            htmlFor="excel-import"
            className="bg-[#22c55e] text-white px-4 py-2 rounded inline-flex items-center gap-2 cursor-pointer hover:bg-green-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Excel File
          </label>
        </div>
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
      {importError && (
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded">
          {importError}
        </div>
      )}

      {/* Add New Subject Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl text-[#3b82f6] font-medium mb-6">Add New Subject</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
              <input
                type="text"
                value={newSubject.standard}
                onChange={(e) => handleNewSubjectChange('standard', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., V"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
              <input
                type="text"
                value={newSubject.name}
                onChange={(e) => handleNewSubjectChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., English"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Periods</label>
              <input
                type="number"
                value={newSubject.weeklyPeriods}
                onChange={(e) => handleNewSubjectChange('weeklyPeriods', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 6"
                min="0"
                required
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSubject.consecutivePeriods}
                  onChange={(e) => handleNewSubjectChange('consecutivePeriods', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Consecutive Periods</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Add Subject
          </button>
        </form>
      </div>

      {/* Display Existing Subjects */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-[#3b82f6] font-medium">Existing Subjects</h2>
          {existingSubjects.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition duration-200"
            >
              Delete All ({existingSubjects.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Periods</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consecutive Periods</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {existingSubjects.map((subject, index) => (
                <tr key={subject.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.standard}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.weekly_periods}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subject.consecutive_periods ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-blue-600">Edit Subject</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSubject(null);
                }}
                className="text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                <input
                  type="text"
                  value={editingSubject.standard}
                  onChange={(e) => handleEditChange('standard', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                  value={editingSubject.subject_name}
                  onChange={(e) => handleEditChange('subject_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Periods</label>
                  <input
                    type="number"
                  value={editingSubject.weekly_periods}
                  onChange={(e) => handleEditChange('weekly_periods', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingSubject.consecutive_periods}
                    onChange={(e) => handleEditChange('consecutive_periods', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Consecutive Periods</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSubject(null);
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
    </div>
  );
};

export default SubjectSetup;