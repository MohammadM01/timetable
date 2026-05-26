import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SchoolContext } from '../SchoolContext';

import { Users, BookOpen, Layers, ShieldCheck, LayoutGrid, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="glass-panel group overflow-hidden">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
      </div>
      <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 ${tone}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  </div>
);

const ActionCard = ({ to, icon: Icon, title, description, tone }) => (
  <Link to={to} className="glass-panel group block overflow-hidden">
    <div className="flex items-start gap-4">
      <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 transition-transform duration-300 group-hover:scale-110 ${tone}`}>
        <Icon className="w-6 h-6" />
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
    { title: 'Teachers', value: teachers.length || 0, icon: Users, tone: 'text-cyan-600' },
    { title: 'Classes', value: classes.length || 0, icon: Layers, tone: 'text-emerald-600' },
    { title: 'Subjects', value: subjects.length || 0, icon: BookOpen, tone: 'text-amber-600' }
  ];

  const quickActions = [
    { to: '/teacher-setup', icon: Users, title: 'Teacher Setup', description: 'Import weekly and daily limits from teacher_periods.xlsx.', tone: 'text-cyan-600' },
    { to: '/subject-setup', icon: BookOpen, title: 'Subject Setup', description: 'Manage weekly periods and consecutive-period subject flags.', tone: 'text-amber-600' },
    { to: '/class-setup', icon: Layers, title: 'Class Setup', description: 'Maintain class standards, divisions, and full class names.', tone: 'text-emerald-600' },
    { to: '/subject-assignment', icon: ShieldCheck, title: 'Subject Assignment', description: 'Connect teachers to the subjects and classes they can cover.', tone: 'text-rose-600' },
    { to: '/generate-timetable', icon: LayoutGrid, title: 'Generate Timetable', description: 'Run the constraint-aware generator with custom day periods.', tone: 'text-indigo-600' },
    { to: '/class-timetable', icon: Clock, title: 'Class Timetable', description: 'Review colorful no-free-period schedules and manual coverage.', tone: 'text-fuchsia-600' }
  ];

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="kicker">2026 constraint studio</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight leading-tight md:text-4xl">
              Build beautiful timetables with <span className="gradient-title">zero free class periods.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
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
