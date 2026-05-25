import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeacherSetup from './pages/TeacherSetup';
import ClassSetup from './pages/ClassSetup';
import SubjectSetup from './pages/SubjectSetup';
import PeriodSetup from './pages/PeriodSetup';
import GenerateTimetable from './pages/GenerateTimetable';
import ClassTimetable from './pages/ClassTimetable';
import SubjectAssignment from './pages/SubjectAssignment';
import TeacherTimetables from './pages/TeacherTimetables';
import TimetableHistory from './pages/TimetableHistory';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/login" element={
              <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.45),transparent_32rem),radial-gradient(circle_at_80%_0%,rgba(251,146,60,0.35),transparent_30rem),linear-gradient(135deg,#f8fafc,#ecfeff_48%,#fff7ed)]">
                <Login />
              </div>
          } />
          <Route
            path="/*"
            element={
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Navbar />
                  <main className="app-main-surface">
                    <div className="mx-auto max-w-[1500px]">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="teacher-setup" element={<TeacherSetup />} />
                        <Route path="class-setup" element={<ClassSetup />} />
                        <Route path="subject-setup" element={<SubjectSetup />} />
                        <Route path="period-setup" element={<PeriodSetup />} />
                        <Route path="subject-assignment" element={<SubjectAssignment />} />
                        <Route path="generate-timetable" element={<GenerateTimetable />} />
                        <Route path="class-timetable" element={<ClassTimetable />} />
                        <Route path="teacher-timetables" element={<TeacherTimetables />} />
                        <Route path="timetable-history" element={<TimetableHistory />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
