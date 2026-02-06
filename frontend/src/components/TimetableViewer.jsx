import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Users, BookOpen, Eye, Download } from 'lucide-react';

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
    const { schedule, config } = timetableData;
    const dayNames = Object.keys(schedule);
    const periodNames = Object.keys(schedule[dayNames[0]] || {});

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 font-semibold">Day/Period</th>
              {periodNames.map(period => (
                <th key={period} className="border border-gray-300 p-2 font-semibold text-center">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dayNames.map(day => (
              <tr key={day}>
                <td className="border border-gray-300 p-2 font-semibold bg-gray-50">
                  {day}
                </td>
                {periodNames.map(period => {
                  const slot = schedule[day][period];
                  const isFree = !slot || slot.subject === 'Free';
                  
                  return (
                    <td key={period} className={`border border-gray-300 p-2 text-center ${
                      isFree ? 'bg-gray-100' : 'bg-white'
                    }`}>
                      {isFree ? (
                        <span className="text-gray-500">Free</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{slot.subject}</div>
                          <div className="text-xs text-gray-600">{slot.teacher || slot.className}</div>
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
    );
  };

  const renderSchoolTimetable = () => {
    const { overview, config } = timetableData;
    const dayNames = Object.keys(overview);
    const periodNames = Object.keys(overview[dayNames[0]] || {});
    const classNames = Object.keys(overview[dayNames[0]][periodNames[0]] || {});

    return (
      <div className="space-y-4">
        {dayNames.map(day => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 font-semibold">Class/Period</th>
                      {periodNames.map(period => (
                        <th key={period} className="border border-gray-300 p-2 font-semibold text-center">
                          {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classNames.map(className => (
                      <tr key={className}>
                        <td className="border border-gray-300 p-2 font-semibold bg-gray-50">
                          {className}
                        </td>
                        {periodNames.map(period => {
                          const slot = overview[day][period][className];
                          const isFree = !slot || slot.subject === 'Free';
                          
                          return (
                            <td key={period} className={`border border-gray-300 p-2 text-center ${
                              isFree ? 'bg-gray-100' : 'bg-white'
                            }`}>
                              {isFree ? (
                                <span className="text-gray-500">Free</span>
                              ) : (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">{slot.subject}</div>
                                  <div className="text-xs text-gray-600">{slot.teacher}</div>
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
            </CardContent>
          </Card>
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
            <Label className="text-lg font-semibold">View Type</Label>
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
              <Label className="text-lg font-semibold">Select Class</Label>
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
              <Label className="text-lg font-semibold">Select Teacher</Label>
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















