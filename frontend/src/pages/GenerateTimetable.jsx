import React, { useState, useEffect, useContext } from 'react';
import { generateTimetable, getTimetable } from '../utils/api';
import { exportToExcel } from '../utils/excelGenerator';
import { SchoolContext } from '../SchoolContext';

const GenerateTimetable = () => {
  const { teachers: existingTeachers } = useContext(SchoolContext);
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('teacher'); // 'teacher' or 'class'

  // Define days and periods
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const maxPeriods = 9; // Maximum number of periods in a day

  // Load timetable on component mount and after generation
  useEffect(() => {
    loadTimetable();
  }, []);

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

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await generateTimetable();
      console.log('Timetable generated successfully');
      const data = await getTimetable();
      console.log('Fetched new timetable data:', data);
      setTimetable(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to generate timetable:', err);
      setError('Failed to generate timetable');
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

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Generate Timetable</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
            disabled={loading}
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

        {error && <p className="text-red-600 text-center">{error}</p>}
        
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