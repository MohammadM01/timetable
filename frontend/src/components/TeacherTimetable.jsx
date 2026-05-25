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

  const subjectThemes = [
    { wrap: 'bg-[#E0F2FE] border border-sky-300/40 text-[#0369A1] rounded-3xl hover:scale-[1.03] hover:rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#0369A1]/10 text-[#0369A1]' },
    { wrap: 'bg-[#DCFCE7] border border-emerald-300/40 text-[#15803D] rounded-3xl hover:scale-[1.03] hover:-rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#15803D]/10 text-[#15803D]' },
    { wrap: 'bg-[#FFEDD5] border border-amber-300/40 text-[#C2410C] rounded-3xl hover:scale-[1.03] hover:rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#C2410C]/10 text-[#C2410C]' },
    { wrap: 'bg-[#FFE4E6] border border-rose-300/40 text-[#BE123C] rounded-3xl hover:scale-[1.03] hover:-rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#BE123C]/10 text-[#BE123C]' },
    { wrap: 'bg-[#EEF2FF] border border-indigo-300/40 text-[#4338CA] rounded-3xl hover:scale-[1.03] hover:rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#4338CA]/10 text-[#4338CA]' },
    { wrap: 'bg-[#F5F3FF] border border-purple-300/40 text-[#6D28D9] rounded-3xl hover:scale-[1.03] hover:-rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#6D28D9]/10 text-[#6D28D9]' },
    { wrap: 'bg-[#FEF9C3] border border-yellow-300/40 text-[#713F12] rounded-3xl hover:scale-[1.03] hover:rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#713F12]/10 text-[#713F12]' },
    { wrap: 'bg-[#F0FDF4] border border-teal-300/40 text-[#115E59] rounded-3xl hover:scale-[1.03] hover:-rotate-1 hover:shadow-md transition-all duration-300', chip: 'bg-[#115E59]/10 text-[#115E59]' }
  ];

  const getSubjectTheme = (subject = 'Coverage') => {
    const hash = subject.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return subjectThemes[hash % subjectThemes.length];
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-xl shadow-purple-100/20 backdrop-blur">
      <div className="bg-purple-50/50 px-6 py-4 border-b border-purple-100/50">
        <h3 className="text-lg font-semibold text-purple-700">
          {teacherName || timetable.teacher.name}'s Timetable
        </h3>
        <p className="text-purple-600/70 text-xs font-semibold mt-1">
          Weekly Workload: {timetable.teacher.weeklyPeriods} Periods | Daily Max Cap: {timetable.teacher.dailyPeriods}
        </p>
      </div>
      
      <div className="p-4 md:p-6 overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-2">
          <thead>
            <tr className="text-slate-700 text-sm font-semibold text-center">
              <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-700 text-white shadow-sm font-semibold">
                Day / Period
              </th>
              {periods.map(period => (
                <th key={period} className="p-3 text-center rounded-2xl bg-slate-100 font-semibold shadow-sm text-slate-700">
                  Period {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {days.map(day => (
              <tr key={day}>
                <td className="p-3 whitespace-nowrap text-sm font-semibold text-slate-600 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
                  {day}
                </td>
                {periods.map(period => {
                  const dayPeriodsCount = timetable.config?.dayPeriods?.[day] ?? timetable.config.periodsPerDay;
                  if (period > dayPeriodsCount) {
                    return (
                      <td key={period} className="p-3 rounded-2xl bg-slate-100 text-slate-400 select-none cursor-not-allowed align-middle text-center">
                        -
                      </td>
                    );
                  }

                  const periodData = timetable.schedule[day]?.find(p => p.period === period);
                  const isFree = !periodData || periodData.isFree;
                  
                  if (isFree) {
                    return (
                      <td key={period} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-medium select-none text-center align-middle">
                        <div className="py-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">Free</div>
                      </td>
                    );
                  }

                  const theme = getSubjectTheme(periodData.subject);
                  return (
                    <td key={period} className={`relative rounded-3xl p-3 align-middle transition-all duration-300 hover:-rotate-1 hover:scale-105 ${theme.wrap}`}>
                      <div className="space-y-1 py-1">
                        <div className="font-semibold text-sm text-current tracking-tight">
                          {periodData.class}
                        </div>
                        <div className={`text-xs font-medium rounded px-1.5 py-0.5 inline-block ${theme.chip || 'bg-slate-100 text-slate-600'}`}>
                          {periodData.subject}
                        </div>
                      </div>
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
