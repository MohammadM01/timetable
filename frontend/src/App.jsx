import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeacherSetup from './pages/TeacherSetup';
import ClassSetup from './pages/ClassSetup';
import SubjectSetup from './pages/SubjectSetup';
import PeriodSetup from './pages/PeriodSetup';
import GenerateTimetable from './pages/GenerateTimetable';
import SubjectAssignment from './pages/SubjectAssignment';
import TeacherTimetables from './pages/TeacherTimetables';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/login" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-amber-500">
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
                  <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    <div className="container mx-auto">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="teacher-setup" element={<TeacherSetup />} />
                        <Route path="class-setup" element={<ClassSetup />} />
                        <Route path="subject-setup" element={<SubjectSetup />} />
                        <Route path="period-setup" element={<PeriodSetup />} />
                        <Route path="subject-assignment" element={<SubjectAssignment />} />
                        <Route path="generate-timetable" element={<GenerateTimetable />} />
                        <Route path="teacher-timetables" element={<TeacherTimetables />} />
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