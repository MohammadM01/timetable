import React, { useContext, useState } from 'react';
import { SchoolContext } from '../SchoolContext';
import TeacherTimetable from '../components/TeacherTimetable';

const TeacherTimetables = () => {
  const { teachers } = useContext(SchoolContext);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState('');

  const handleTeacherSelect = (teacherId) => {
    setSelectedTeacher(teacherId);
    setError('');
  };

  const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <p className="kicker">Teacher load view</p>
        <h2 className="relative z-10 mt-3 text-4xl font-black md:text-5xl">
          Teacher Timetables
        </h2>
        <p className="relative z-10 mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          Inspect each teacher's weekly schedule, free teacher periods, daily load, and no-double-booking coverage.
        </p>
        <div className="relative z-10 mt-5 flex flex-wrap gap-2">
          <span className="constraint-chip">Max 2 consecutive teaching periods</span>
          <span className="constraint-chip" data-tone="green">1-period break after 2</span>
          <span className="constraint-chip" data-tone="amber">Daily and weekly caps</span>
        </div>
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="glass-panel">
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <p className="kicker">Select teacher</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">Review individual workload</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Teacher limits come from the weekly_periods and daily_max_periods columns in the Excel file.
            </p>
          </div>
          <select
            value={selectedTeacher === null ? '' : selectedTeacher}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              handleTeacherSelect(val && !Number.isNaN(numVal) ? numVal : null);
            }}
            className="px-4 py-3"
          >
            <option value="">Select a Teacher</option>
            {teachers
              .filter(t => t.id !== 'principal')
              .map(teacher => (
                <option key={teacher.id} value={teacher.id || ''}>
                  {teacher.name}
                </option>
              ))}
          </select>
        </div>
      </section>

      {selectedTeacher && (
        <TeacherTimetable
          teacherId={selectedTeacher}
          teacherName={selectedTeacherData?.name}
        />
      )}

      {!selectedTeacher && (
        <section className="glass-panel border-cyan-100 bg-cyan-50/70">
          <h3 className="text-lg font-black text-cyan-950">How Teacher Timetables Work</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              'Generated automatically from class schedules',
              'Shows free periods only for teacher availability',
              'Prevents teacher double booking at the same time',
              'Highlights class and subject coverage per period'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/75 px-4 py-3 text-sm font-bold text-cyan-900">
                {item}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeacherTimetables;
