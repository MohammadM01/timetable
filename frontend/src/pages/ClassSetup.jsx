import React, { useState, useContext, useEffect } from 'react';
import { SchoolContext } from '../SchoolContext';
import { saveClasses, deleteClass, updateClass, uploadClasses, deleteAllClasses } from '../utils/api';
import { FaTrash, FaFileUpload, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ClassSetup = () => {
  const { addClasses, classes: existingClasses, fetchClasses } = useContext(SchoolContext);
  const [standards, setStandards] = useState([{ name: '', divisions: [''] }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleStandardChange = (index, value) => {
    const newStandards = [...standards];
    newStandards[index].name = value;
    setStandards(newStandards);
  };

  const handleDivisionChange = (stdIndex, divIndex, value) => {
    const newStandards = [...standards];
    newStandards[stdIndex].divisions[divIndex] = value;
    setStandards(newStandards);
  };

  const addDivision = (stdIndex) => {
    const newStandards = [...standards];
    newStandards[stdIndex].divisions.push('');
    setStandards(newStandards);
  };

  const addStandard = () => {
    setStandards([...standards, { name: '', divisions: [''] }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const classes = standards.flatMap((std) =>
        std.divisions
          .filter((div) => div.trim() && std.name.trim())
          .map((div) => ({
            standard: std.name.trim(),
            division: div.trim(),
            full_name: `${std.name.trim()}${div.trim()}`,
          }))
      );
      if (classes.length === 0) {
        throw new Error('No valid classes to save');
      }

      // Save to backend
      const response = await saveClasses(classes);
      
      // Update context with the returned classes
      if (response.classes) {
        addClasses(response.classes);
      }
      
      setSuccess(response.message || 'Classes saved successfully!');
      // Reset form
      setStandards([{ name: '', divisions: [''] }]);
      
      // Refresh the classes list
      await fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to save classes');
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      const response = await deleteClass(classId);
      setSuccess(response.message || 'Class deleted successfully!');
      
      // Update the classes list with the returned data
      if (response.classes) {
        addClasses(response.classes);
      } else {
        // If no classes returned, fetch the updated list
        await fetchClasses();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete class');
    }
  };

  const handleDeleteAllClasses = async () => {
    if (existingClasses.length === 0) {
      setError('No classes to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ALL ${existingClasses.length} classes? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const result = await deleteAllClasses();
      setSuccess(result.message || `Successfully deleted all ${result.deletedCount} classes`);
      
      // Clear the classes list
      addClasses([]);
    } catch (err) {
      setError(err.message || 'Failed to delete all classes');
    }
  };

  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await updateClass(editingClass.id, editingClass);
      setSuccess(response.message || 'Class updated successfully!');
      setShowEditModal(false);
      
      // Update the class list with the returned data
      if (response.class) {
        const updatedClasses = existingClasses.map(cls => 
          cls.id === response.class.id ? response.class : cls
        );
        addClasses(updatedClasses);
      } else {
        // If no class returned, fetch the updated list
        await fetchClasses();
      }
    } catch (err) {
      setError(err.message || 'Failed to update class');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: 1,
        standard: '1',
        division: 'A',
        full_name: '1-A'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Classes');
    XLSX.writeFile(wb, 'classes_template.xlsx');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError('');
      setSuccess('');

      const response = await uploadClasses(file);
      if (response.classes) {
        addClasses(response.classes);
      }
      setSuccess('Classes uploaded successfully!');
      
      // Reset form
      setStandards([{ name: '', divisions: [''] }]);
      event.target.value = null;
      
      // Refresh the classes list
      await fetchClasses();
    } catch (err) {
      setError(err.message || 'Failed to upload classes');
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight mb-6" style={{ color: '#334155' }}>Class Setup</h2>
      
      {/* Excel Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-blue-600">Bulk Upload Classes</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaDownload className="mr-2" />
            Download Template
          </button>
        </div>
        <div className="flex items-center">
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition duration-300 ease-in-out transform hover:scale-105">
            <FaFileUpload className="mr-2" />
            Upload Excel File
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
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
      
      {/* Add New Classes Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <h3 className="text-xl font-semibold text-blue-600 mb-4">Add New Classes</h3>
        {standards.map((standard, stdIndex) => (
          <div key={stdIndex} className="mb-6">
            <h3 className="text-xl font-semibold text-blue-600 mb-2">Standard {stdIndex + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Standard Name</label>
                <input
                  type="text"
                  value={standard.name}
                  onChange={(e) => handleStandardChange(stdIndex, e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm animate-pulse"
                  placeholder="e.g., V"
                  required
                />
              </div>
            </div>
            <h4 className="text-lg font-semibold text-green-600 mb-2">Divisions</h4>
            {standard.divisions.map((div, divIndex) => (
              <div key={divIndex} className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Division {divIndex + 1}</label>
                <input
                  type="text"
                  value={div}
                  onChange={(e) => handleDivisionChange(stdIndex, divIndex, e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., G1"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addDivision(stdIndex)}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              Add Division
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addStandard}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
        >
          Add Standard
        </button>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300 ease-in-out transform hover:scale-105 animate-bounce"
        >
          Save Classes
        </button>
      </form>

      {/* Display Existing Classes */}
      <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-600">Existing Classes</h3>
          {existingClasses.length > 0 && (
            <button
              onClick={handleDeleteAllClasses}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition duration-200"
            >
              Delete All ({existingClasses.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {existingClasses && existingClasses.map((cls, index) => (
                <tr key={cls.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.standard}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.division}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cls.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleEditClass(cls)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
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
              <h3 className="text-xl font-semibold text-blue-600">Edit Class</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingClass(null);
                }}
                className="text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                <input
                  type="text"
                  value={editingClass?.standard || ''}
                  onChange={(e) => setEditingClass({...editingClass, standard: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                <input
                  type="text"
                  value={editingClass?.division || ''}
                  onChange={(e) => setEditingClass({...editingClass, division: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingClass?.full_name || ''}
                  onChange={(e) => setEditingClass({...editingClass, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClass(null);
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

export default ClassSetup;