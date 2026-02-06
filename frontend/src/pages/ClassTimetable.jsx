import React, { useState, useEffect } from 'react';
import { getClassTimetable, getAvailableClasses } from '../utils/api';

const ClassTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define days and periods
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const maxPeriods = 9;

  useEffect(() => {
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

  const loadClassTimetable = async (classId) => {
    if (!classId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await getClassTimetable(classId);
      console.log('Loaded class timetable:', data);
      setTimetable(data);
    } catch (err) {
      console.error('Failed to load class timetable:', err);
      setError('Failed to load class timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    loadClassTimetable(classId);
  };

  const getCellContent = (dayName, periodName) => {
    if (!timetable?.schedule[dayName]?.[periodName]) return 'Free';
    const slot = timetable.schedule[dayName][periodName];
    return `${slot.subject}\n${slot.teacher}`;
  };

  const exportClassTimetable = () => {
    if (!timetable) return;
    
    // Create CSV content
    let csvContent = `Class Timetable - ${timetable.class.full_name}\n\n`;
    csvContent += 'Day,Period,Subject,Teacher\n';
    
    days.forEach(day => {
      for (let period = 1; period <= maxPeriods; period++) {
        const periodName = `Period ${period}`;
        const slot = timetable.schedule[day]?.[periodName];
        csvContent += `${day},${period},${slot?.subject || 'Free'},${slot?.teacher || 'Free'}\n`;
      }
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timetable.class.full_name}_Timetable.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Class Timetable</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        {/* Class Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Select Class</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div 
                key={cls.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedClass === cls.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleClassChange(cls.id)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📚</div>
                  <h4 className="font-semibold">{cls.full_name}</h4>
                  <p className="text-sm text-gray-600">{cls.standard}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading timetable...</p>
          </div>
        )}

        {/* Timetable Display */}
        {timetable && !loading && (
          <div className="space-y-4">
            {/* Header with Export Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Timetable for {timetable.class.full_name}
              </h3>
              <button
                onClick={exportClassTimetable}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-300"
              >
                Export to CSV
              </button>
            </div>

            {/* Timetable Table */}
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                          Period
                        </th>
                        {days.map(day => (
                          <th key={day} className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.from({ length: maxPeriods }, (_, periodIndex) => {
                        const period = periodIndex + 1;
                        return (
                          <tr key={period} className={periodIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r">
                              Period {period}
                            </td>
                            {days.map(day => {
                              const content = getCellContent(day, `Period ${period}`);
                              return (
                                <td key={`${day}-${period}`} className="px-2 py-1 text-xs border whitespace-pre-line min-h-[40px] text-center">
                                  {content}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Selection Message */}
        {!selectedClass && !loading && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Class</h3>
            <p className="text-gray-500">Choose a class from above to view its timetable</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassTimetable;