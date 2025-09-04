import React, { useState, useEffect, useContext } from 'react';
import { generateTimetable, getTimetable, getAvailableClasses, generateTimetableWithConfig } from '../utils/api';
import { exportToExcel } from '../utils/excelGenerator';
import { SchoolContext } from '../SchoolContext';

const GenerateTimetable = () => {
  const { teachers: existingTeachers } = useContext(SchoolContext);
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [generationType, setGenerationType] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('teacher'); // 'teacher' or 'class'
  const [config, setConfig] = useState({
    daysPerWeek: 5,
    periodsPerDay: 8,
    periodDuration: 45,
    startTime: '08:00'
  });

  // Define days and periods
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const maxPeriods = 9; // Maximum number of periods in a day

  // Load timetable and classes on component mount
  useEffect(() => {
    loadTimetable();
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const data = await getAvailableClasses();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch available classes');
    }
  };

  const loadTimetable = async () => {
    try {
      const data = await getTimetable();
      console.log('Loaded timetable data:', data);
      setTimetable(data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      setError('Failed to load timetable');
    }
  };

  const handleClassSelection = (classId, checked) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId]);
    } else {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    }
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map(c => c.id));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        config,
        selectedClasses,
        generationType,
        viewType: 'student'
      };

      const data = await generateTimetableWithConfig(payload);
      setMessage(`✅ ${data.message}`);
      // Reset selections
      setSelectedClasses([]);
      setGenerationType('all');
      // Reload timetable
      loadTimetable();
    } catch (err) {
      setError(err.message || 'Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportToExcel(timetable, existingTeachers);
  };

  // Function to organize timetable data by teacher
  const getTeacherTimetable = () => {
    console.log('Processing timetable data. Current timetable:', timetable);
    console.log('Existing teachers:', existingTeachers);
    
    const teacherMap = new Map();
    
    // First pass: Initialize all existing teachers with empty schedules
    existingTeachers.forEach(teacher => {
      teacherMap.set(teacher.name, {
        name: teacher.name,
        schedule: {}
      });
      console.log(`Initialized schedule for teacher: ${teacher.name}`);
    });

    // Second pass: Fill in the schedule
    timetable.forEach(entry => {
      console.log('Processing timetable entry:', entry);
      const teacher = teacherMap.get(entry.teacher);
      if (!teacher) {
        console.log(`Teacher not found for entry:`, entry);
        return;
      }
      
      if (!teacher.schedule[entry.day]) {
        teacher.schedule[entry.day] = {};
      }
      teacher.schedule[entry.day][entry.period] = {
        class: entry.class,
        subject: entry.subject
      };
      console.log(`Added period for ${entry.teacher} on ${entry.day}, period ${entry.period}:`, teacher.schedule[entry.day][entry.period]);
    });

    const result = existingTeachers.map(teacher => teacherMap.get(teacher.name)).filter(Boolean);
    console.log('Final processed timetable data:', result);
    return result;
  };

  // Function to get cell content
  const getCellContent = (teacherSchedule, day, period) => {
    if (!teacherSchedule?.schedule[day]) return '';
    const cell = teacherSchedule.schedule[day][period];
    if (!cell) return '';
    console.log(`Cell content for ${teacherSchedule.name} on ${day}, period ${period}:`, cell);
    return cell.class;
  };

  // Debug output
  console.log('Current timetable state:', timetable);
  const teacherSchedules = timetable.length > 0 ? getTeacherTimetable() : [];
  console.log('Teacher schedules:', teacherSchedules);

  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.standard]) {
      acc[cls.standard] = [];
    }
    acc[cls.standard].push(cls);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Generate Timetable</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        
        {/* Generation Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Generation Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                generationType === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGenerationType('all')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🏫</div>
                <h4 className="font-semibold">All Classes</h4>
                <p className="text-sm text-gray-600">Generate for all classes</p>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                generationType === 'selected' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGenerationType('selected')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📚</div>
                <h4 className="font-semibold">Selected Classes</h4>
                <p className="text-sm text-gray-600">Choose specific classes</p>
              </div>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                generationType === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setGenerationType('standard')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold">By Standard</h4>
                <p className="text-sm text-gray-600">Generate by grade level</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        {generationType === 'selected' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Select Classes</h3>
              <button 
                onClick={handleSelectAll}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
              >
                {selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {Object.entries(groupedClasses).map(([standard, standardClasses]) => (
                <div key={standard} className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">{standard}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {standardClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={cls.id}
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => handleClassSelection(cls.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={cls.id} className="text-sm text-gray-700">
                          {cls.division}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedClasses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {selectedClasses.length} class(es) selected
                </span>
              </div>
            )}
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">School Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Days per Week
              </label>
              <input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={config.daysPerWeek}
                onChange={(e) => setConfig({...config, daysPerWeek: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="periodsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                Periods per Day
              </label>
              <input
                id="periodsPerDay"
                type="number"
                min="1"
                max="12"
                value={config.periodsPerDay}
                onChange={(e) => setConfig({...config, periodsPerDay: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="periodDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Period Duration (min)
              </label>
              <input
                id="periodDuration"
                type="number"
                min="30"
                max="90"
                value={config.periodDuration}
                onChange={(e) => setConfig({...config, periodDuration: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={config.startTime}
                onChange={(e) => setConfig({...config, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
            disabled={loading || (generationType === 'selected' && selectedClasses.length === 0)}
          >
            {loading ? 'Generating...' : 'Generate Timetable'}
          </button>
          
          {timetable.length > 0 && (
            <button
              onClick={handleExport}
              className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-300"
            >
              Export to Excel
            </button>
          )}
        </div>
        
        {timetable.length === 0 ? (
          <p className="text-center text-gray-500">No timetable data available. Click "Generate Timetable" to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Teacher
                      </th>
                      {days.map(day => (
                        <th key={day} colSpan={maxPeriods} className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                          {day}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="px-3 py-2 sticky left-0 bg-gray-50 z-10"></th>
                      {days.map(day => (
                        Array.from({ length: maxPeriods }, (_, i) => (
                          <th key={`${day}-${i+1}`} className="text-center px-2 py-1 text-xs font-medium text-gray-500 border-l">
                            {i + 1}
                          </th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teacherSchedules.map((teacher, idx) => (
                      <tr key={teacher.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r">
                          {teacher.name}
                        </td>
                        {days.map(day => (
                          Array.from({ length: maxPeriods }, (_, i) => {
                            const content = getCellContent(teacher, day, i + 1);
                            return (
                              <td key={`${day}-${i+1}`} className="px-2 py-1 text-xs border whitespace-pre-line min-h-[40px]">
                                {content}
                              </td>
                            );
                          })
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateTimetable;  