import React, { useState, useContext } from 'react';
import { SchoolContext } from '../contexts/SchoolContext';
import { deleteClass, uploadClasses } from '../utils/api';
import { FaTrash, FaFileUpload, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ClassSetup = () => {
  const { classes, setClasses, addNewClass } = useContext(SchoolContext);
  const [standard, setStandard] = useState('');
  const [division, setDivision] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ... existing handleSubmit and handleDelete functions ...

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
      setClasses(response.classes);
      setSuccess('Classes uploaded successfully!');
      
      // Reset form
      setStandard('');
      setDivision('');
      event.target.value = null;
    } catch (err) {
      setError(err.message || 'Failed to upload classes');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Class Setup</h2>
      
      {/* File Upload Section */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bulk Upload Classes</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaDownload className="mr-2" />
            Download Template
          </button>
        </div>
        <div className="flex items-center">
          <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
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
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* ... rest of the existing JSX ... */}
    </div>
  );
};

export default ClassSetup; 