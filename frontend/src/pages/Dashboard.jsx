import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SchoolContext } from '../SchoolContext';

const icons = {
  teachers: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  classes: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  subjects: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  time: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  grid: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z'
};

const Icon = ({ path }) => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={path} />
  </svg>
);

const StatCard = ({ title, value, icon, tone }) => (
  <div className="glass-panel group overflow-hidden">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      </div>
      <div className={`rounded-3xl p-4 text-white shadow-xl ${tone}`}>
        <Icon path={icon} />
      </div>
    </div>
  </div>
);

const ActionCard = ({ to, icon, title, description, tone }) => (
  <Link to={to} className="glass-panel group block overflow-hidden">
    <div className="flex items-start gap-4">
      <div className={`rounded-3xl p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 ${tone}`}>
        <Icon path={icon} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-950 transition-colors group-hover:text-cyan-700">{title}</h3>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { teachers, classes, subjects } = useContext(SchoolContext);

  const stats = [
    { title: 'Teachers', value: teachers.length || 0, icon: icons.teachers, tone: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-200' },
    { title: 'Classes', value: classes.length || 0, icon: icons.classes, tone: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200' },
    { title: 'Subjects', value: subjects.length || 0, icon: icons.subjects, tone: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200' }
  ];

  const quickActions = [
    { to: '/teacher-setup', icon: icons.teachers, title: 'Teacher Setup', description: 'Import weekly and daily limits from teacher_periods.xlsx.', tone: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { to: '/subject-setup', icon: icons.subjects, title: 'Subject Setup', description: 'Manage weekly periods and consecutive-period subject flags.', tone: 'bg-gradient-to-br from-amber-400 to-orange-500' },
    { to: '/class-setup', icon: icons.classes, title: 'Class Setup', description: 'Maintain class standards, divisions, and full class names.', tone: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { to: '/subject-assignment', icon: icons.shield, title: 'Subject Assignment', description: 'Connect teachers to the subjects and classes they can cover.', tone: 'bg-gradient-to-br from-rose-400 to-pink-600' },
    { to: '/generate-timetable', icon: icons.grid, title: 'Generate Timetable', description: 'Run the constraint-aware generator with custom day periods.', tone: 'bg-gradient-to-br from-indigo-500 to-blue-600' },
    { to: '/class-timetable', icon: icons.time, title: 'Class Timetable', description: 'Review colorful no-free-period schedules and manual coverage.', tone: 'bg-gradient-to-br from-fuchsia-500 to-purple-600' }
  ];

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="kicker">2026 constraint studio</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Build beautiful timetables with <span className="gradient-title">zero free class periods.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
              Your Excel rules drive the engine: weekly totals, daily teacher caps, block periods, recess resets, and no double booking.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="constraint-chip">Max 2 consecutive</span>
              <span className="constraint-chip" data-tone="green">No double booking</span>
              <span className="constraint-chip" data-tone="amber">Custom day periods</span>
              <span className="constraint-chip" data-tone="rose">No free classes</span>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-2xl shadow-cyan-100/70">
            <p className="text-sm font-black text-slate-700">Constraint health</p>
            <div className="mt-4 space-y-3">
              {['Teacher limits', 'Subject weekly totals', 'Consecutive blocks', 'Recess break reset'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-700">
                  <span>{item}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">Ready</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Workflow</p>
            <h2 className="section-title mb-0">Quick Actions</h2>
          </div>
          <Link to="/generate-timetable" className="btn-primary hidden md:inline-flex">Generate now</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <ActionCard key={action.to} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
