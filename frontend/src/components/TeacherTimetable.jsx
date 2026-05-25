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
    { wrap: 'from-sky-100 via-cyan-50 to-blue-100 border-sky-200 text-sky-950', chip: 'bg-sky-600/10 text-sky-800', dot: 'bg-sky-500' },
    { wrap: 'from-emerald-100 via-teal-50 to-green-100 border-emerald-200 text-emerald-950', chip: 'bg-emerald-600/10 text-emerald-800', dot: 'bg-emerald-500' },
    { wrap: 'from-amber-100 via-orange-50 to-yellow-100 border-amber-200 text-amber-950', chip: 'bg-amber-600/10 text-amber-800', dot: 'bg-amber-500' },
    { wrap: 'from-rose-100 via-pink-50 to-red-100 border-rose-200 text-rose-950', chip: 'bg-rose-600/10 text-rose-800', dot: 'bg-rose-500' },
    { wrap: 'from-indigo-100 via-blue-50 to-violet-100 border-indigo-200 text-indigo-950', chip: 'bg-indigo-600/10 text-indigo-800', dot: 'bg-indigo-500' },
    { wrap: 'from-fuchsia-100 via-purple-50 to-pink-100 border-fuchsia-200 text-fuchsia-950', chip: 'bg-fuchsia-600/10 text-fuchsia-800', dot: 'bg-fuchsia-500' },
    { wrap: 'from-lime-100 via-green-50 to-emerald-100 border-lime-200 text-lime-950', chip: 'bg-lime-600/10 text-lime-800', dot: 'bg-lime-500' },
    { wrap: 'from-teal-100 via-cyan-50 to-sky-100 border-teal-200 text-teal-950', chip: 'bg-teal-600/10 text-teal-800', dot: 'bg-teal-500' }
  ];

  const getSubjectTheme = (subject = 'Coverage') => {
    const hash = subject.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return subjectThemes[hash % subjectThemes.length];
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-purple-100/60 backdrop-blur">
      <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 px-6 py-4 border-b border-purple-100">
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {teacherName || timetable.teacher.name}'s Timetable
        </h3>
        <p className="text-purple-600/80 text-sm font-semibold mt-1">
          Weekly Workload: {timetable.teacher.weeklyPeriods} Periods | Daily Max Cap: {timetable.teacher.dailyPeriods}
        </p>
      </div>
      
      <div className="p-4 md:p-6 overflow-x-auto">
        <table className="w-full min-w-[800px] border-separate border-spacing-2">
          <thead>
            <tr className="text-slate-800 text-sm font-black text-center">
              <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                Day / Period
              </th>
              {periods.map(period => (
                <th key={period} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                  Period {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-center">
            {days.map(day => (
              <tr key={day}>
                <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
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
                      <td key={period} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-bold select-none text-center align-middle">
                        <div className="py-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">Free</div>
                      </td>
                    );
                  }

                  const theme = getSubjectTheme(periodData.subject);
                  return (
                    <td key={period} className={`relative rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap}`}>
                      <div className="space-y-1 py-1">
                        <div className="font-extrabold text-sm text-slate-800 tracking-tight">
                          {periodData.class}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 rounded px-1.5 py-0.5 inline-block">
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
