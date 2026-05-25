import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Users, BookOpen, Eye, Download } from 'lucide-react';

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

const TimetableViewer = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [viewType, setViewType] = useState('student');
  const [timetableData, setTimetableData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/timetable/available-classes');
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      setError('Failed to fetch teachers');
    }
  };

  const fetchTimetable = async () => {
    if (!selectedClass && !selectedTeacher) return;
    
    setLoading(true);
    setError('');
    setTimetableData(null);

    try {
      let url = '';
      if (viewType === 'student' && selectedClass) {
        url = `/api/timetable/class/${selectedClass}`;
      } else if (viewType === 'teacher' && selectedTeacher) {
        url = `/api/timetable/teacher/${selectedTeacher}`;
      } else if (viewType === 'school') {
        url = '/api/timetable/school';
      }

      if (url) {
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          setTimetableData(data);
        } else {
          setError(data.error || 'Failed to fetch timetable');
        }
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((viewType === 'student' && selectedClass) || 
        (viewType === 'teacher' && selectedTeacher) || 
        viewType === 'school') {
      fetchTimetable();
    }
  }, [viewType, selectedClass, selectedTeacher]);

  const renderTimetable = () => {
    if (!timetableData) return null;

    if (viewType === 'school') {
      return renderSchoolTimetable();
    } else {
      return renderClassOrTeacherTimetable();
    }
  };

  const renderClassOrTeacherTimetable = () => {
    let { schedule, config } = timetableData;
    
    // Normalize teacher schedule if it's in array format
    if (viewType === 'teacher') {
      const normalizedSchedule = {};
      Object.keys(schedule).forEach(day => {
        normalizedSchedule[day] = {};
        const daySchedule = schedule[day];
        if (Array.isArray(daySchedule)) {
          daySchedule.forEach(p => {
            normalizedSchedule[day][`Period ${p.period}`] = {
              subject: p.isFree ? 'Free' : p.subject,
              className: p.isFree ? 'Free' : p.class,
              classId: p.classId,
              isFree: p.isFree
            };
          });
        }
      });
      schedule = normalizedSchedule;
    }
    
    const dayNames = Object.keys(schedule);
    const periodNames = Object.keys(schedule[dayNames[0]] || {});

    return (
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-slate-100/60 backdrop-blur">
        <div className="p-4 md:p-6 overflow-x-auto">
          <table className="w-full min-w-[800px] border-separate border-spacing-2">
            <thead>
              <tr className="text-slate-800 text-sm font-black text-center">
                <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                  Day / Period
                </th>
                {periodNames.map(period => (
                  <th key={period} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                    {period}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-center">
              {dayNames.map(day => (
                <tr key={day}>
                  <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
                    {day}
                  </td>
                  {periodNames.map(period => {
                    const slot = schedule[day][period];
                    const isFree = !slot || slot.subject === 'Free' || slot.isFree;
                    
                    if (isFree) {
                      return (
                        <td key={period} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-bold select-none text-center align-middle">
                          <div className="py-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">Free</div>
                        </td>
                      );
                    }

                    const isCoverage = slot.subject === 'Supervised Study' || slot.teacher === 'Admin Coverage';
                    const theme = getSubjectTheme(slot.subject);

                    return (
                      <td key={period} className={`relative rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap}`}>
                        <div className="space-y-1 py-1">
                          <div className="font-extrabold text-sm text-slate-800 tracking-tight">{slot.subject}</div>
                          {isCoverage && (
                            <div className="text-[10px] font-black uppercase tracking-wide text-slate-600">Admin coverage</div>
                          )}
                          <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 rounded px-1.5 py-0.5 inline-block">
                            {slot.teacher || slot.className}
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

  const renderSchoolTimetable = () => {
    const { overview, config } = timetableData;
    const dayNames = Object.keys(overview);
    const periodNames = Object.keys(overview[dayNames[0]] || {});
    const classNames = Object.keys(overview[dayNames[0]][periodNames[0]] || {});

    return (
      <div className="space-y-6">
        {dayNames.map(day => (
          <div key={day} className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-purple-100/40 backdrop-blur">
            <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 px-6 py-4 border-b border-purple-100">
              <h3 className="text-lg font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>📅</span> {day} Schedule
              </h3>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto">
              <table className="w-full min-w-[800px] border-separate border-spacing-2">
                <thead>
                  <tr className="text-slate-800 text-sm font-black text-center">
                    <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                      Class / Period
                    </th>
                    {periodNames.map(period => (
                      <th key={period} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                        {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-center">
                  {classNames.map(className => (
                    <tr key={className}>
                      <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
                        {className}
                      </td>
                      {periodNames.map(period => {
                        const slot = overview[day][period][className];
                        const isFree = !slot || slot.subject === 'Free';
                        
                        if (isFree) {
                          return (
                            <td key={period} className="p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-slate-400 font-bold select-none text-center align-middle">
                              <div className="py-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">Free</div>
                            </td>
                          );
                        }

                        const isCoverage = slot.subject === 'Supervised Study' || slot.teacher === 'Admin Coverage';
                        const theme = getSubjectTheme(slot.subject);

                        return (
                          <td key={period} className={`relative rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap}`}>
                            <div className="space-y-1 py-1">
                              <div className="font-extrabold text-sm text-slate-800 tracking-tight">{slot.subject}</div>
                              {isCoverage && (
                                <div className="text-[10px] font-black uppercase tracking-wide text-slate-600">Admin coverage</div>
                              )}
                              <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 rounded px-1.5 py-0.5 inline-block">
                                {slot.teacher}
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
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Timetable Viewer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* View Type Selection */}
          <div className="space-y-4">
            <label className="block text-lg font-extrabold text-slate-700">View Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer transition-colors ${
                  viewType === 'student' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setViewType('student')}
              >
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Student View</h3>
                  <p className="text-sm text-gray-600">Class-wise timetable</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${
                  viewType === 'teacher' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setViewType('teacher')}
              >
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Teacher View</h3>
                  <p className="text-sm text-gray-600">Teacher schedule</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-colors ${
                  viewType === 'school' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setViewType('school')}
              >
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">School View</h3>
                  <p className="text-sm text-gray-600">Complete overview</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Selection Controls */}
          {viewType === 'student' && (
            <div className="space-y-4">
              <label className="block text-lg font-extrabold text-slate-700">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewType === 'teacher' && (
            <div className="space-y-4">
              <label className="block text-lg font-extrabold text-slate-700">Select Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading timetable...</span>
            </div>
          )}

          {/* Timetable Display */}
          {timetableData && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {viewType === 'student' && `Timetable for ${classes.find(c => c.id === selectedClass)?.full_name}`}
                    {viewType === 'teacher' && `Schedule for ${teachers.find(t => t.id.toString() === selectedTeacher)?.name}`}
                    {viewType === 'school' && 'School Timetable Overview'}
                  </h3>
                  {timetableData.config && (
                    <p className="text-sm text-gray-600">
                      {timetableData.config.daysPerWeek} days/week, {timetableData.config.periodsPerDay} periods/day
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              {renderTimetable()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableViewer;















