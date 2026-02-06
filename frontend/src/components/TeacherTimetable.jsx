import React, { useState, useEffect } from 'react';

const TeacherTimetable = ({ teacherId, teacherName }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teacherId) {
      fetchTeacherTimetable();
    }
  }, [teacherId]);

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching timetable for teacher ID:', teacherId);
      const response = await fetch(`http://localhost:5000/api/timetable/teacher/${teacherId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Teacher timetable fetch error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch teacher timetable');
      }
      
      const data = await response.json();
      console.log('Teacher timetable data received:', data);
      setTimetable(data);
    } catch (err) {
      console.error('Error fetching teacher timetable:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading teacher timetable...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        No timetable found for this teacher.
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = Array.from({ length: timetable.config.periodsPerDay }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-purple-600 text-white px-6 py-4">
        <h3 className="text-xl font-semibold">
          {teacherName || timetable.teacher.name}'s Timetable
        </h3>
        <p className="text-purple-200 text-sm">
          Weekly Periods: {timetable.teacher.weeklyPeriods} | Daily Max: {timetable.teacher.dailyPeriods}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day/Period
              </th>
              {periods.map(period => (
                <th key={period} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P{period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {days.map(day => (
              <tr key={day}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                  {day}
                </td>
                {periods.map(period => {
                  const periodData = timetable.schedule[day]?.find(p => p.period === period);
                  const isFree = !periodData || periodData.isFree;
                  
                  return (
                    <td key={period} className="px-4 py-4 text-center text-sm">
                      {isFree ? (
                        <span className="text-gray-400 italic">Free</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">
                            {periodData.class}
                          </div>
                          <div className="text-xs text-gray-600">
                            {periodData.subject}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherTimetable;
