import React, { useState, useEffect } from 'react';
import { 
  getClassTimetable, 
  getAvailableClasses, 
  fetchSubjects, 
  fetchTeachers, 
  validateTimetableCell, 
  updateTimetableCell 
} from '../utils/api';

const ClassTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editor states
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [activeCell, setActiveCell] = useState(null); // { day, periodNum }
  const [editorAction, setEditorAction] = useState('edit'); // 'edit', 'swap', 'clear'
  const [editSubject, setEditSubject] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [swapDay, setSwapDay] = useState(1);
  const [swapPeriod, setSwapPeriod] = useState(1);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [checkingValidation, setCheckingValidation] = useState(false);
  const [savingCell, setSavingCell] = useState(false);

  // Define default days and periods (updated dynamically from config if available)
  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxPeriods = 9;
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

  const getDisplaySlot = (slot) => {
    if (!slot || slot.subject === 'Free') {
      return {
        subject: 'Supervised Study',
        teacher: 'Admin Coverage',
        teacherId: null,
        isCoverageFallback: true
      };
    }
    return slot;
  };

  useEffect(() => {
    fetchAvailableClasses();
    loadSubjectsAndTeachers();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const data = await getAvailableClasses();
      setClasses(data);
    } catch {
      setError('Failed to fetch available classes');
    }
  };

  const loadSubjectsAndTeachers = async () => {
    try {
      const [subjectsData, teachersData] = await Promise.all([
        fetchSubjects(),
        fetchTeachers()
      ]);
      setAllSubjects(subjectsData);
      setAllTeachers(teachersData);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const loadClassTimetable = async (classId) => {
    if (!classId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await getClassTimetable(classId);
      console.log('Loaded class timetable:', data);
      setTimetable(data);
    } catch (err) {
      console.error('Failed to load class timetable:', err);
      setError('Failed to load class timetable. Please generate a timetable first.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    loadClassTimetable(classId);
  };

  // Run live validation whenever form fields change
  useEffect(() => {
    if (!activeCell || editorAction !== 'edit' || !editSubject || !editTeacherId) {
      setValidationWarnings([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(() => {
      runLiveValidation();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [editSubject, editTeacherId, editorAction]);

  const runLiveValidation = async () => {
    if (!activeCell || !editTeacherId || !editSubject) return;
    
    setCheckingValidation(true);
    try {
      const dayIndex = daysList.indexOf(activeCell.day) + 1;
      const periodNum = activeCell.periodNum;
      
      const teacher = allTeachers.find(t => t.id.toString() === editTeacherId.toString());

      const result = await validateTimetableCell({
        timetableId: timetable?.id,
        classId: selectedClass,
        day: dayIndex,
        period: periodNum,
        subjectName: editSubject,
        teacherId: editTeacherId,
        teacherName: teacher?.name || ''
      });

      setValidationWarnings(result.warnings || []);
    } catch (err) {
      console.error('Validation check failed:', err);
    } finally {
      setCheckingValidation(false);
    }
  };

  const handleOpenEditor = (day, periodNum) => {
    const slot = getDisplaySlot(timetable?.schedule[day]?.[`Period ${periodNum}`]);
    
    setActiveCell({ day, periodNum });
    setEditorAction('edit');
    setValidationWarnings([]);

    if (slot && slot.subject !== 'Free' && !slot.isCoverageFallback) {
      setEditSubject(slot.subject);
      setEditTeacherId(slot.teacherId ? slot.teacherId.toString() : '');
    } else {
      setEditSubject('');
      setEditTeacherId('');
    }

    setSwapDay(daysList.indexOf(day) + 1);
    setSwapPeriod(periodNum === maxPeriods ? 1 : periodNum + 1);

    // Open DaisyUI modal
    document.getElementById('cell-editor-modal').showModal();
  };

  const handleSaveCell = async () => {
    if (!activeCell) return;
    
    setSavingCell(true);
    setError('');
    setSuccessMsg('');

    try {
      const dayIndex = daysList.indexOf(activeCell.day) + 1;
      const periodNum = activeCell.periodNum;
      const selectedTeacher = allTeachers.find(t => t.id.toString() === editTeacherId.toString());

      const payload = {
        timetableId: timetable?.id,
        classId: selectedClass,
        day: dayIndex,
        period: periodNum,
        action: editorAction,
        subjectName: editSubject,
        teacherId: editTeacherId ? Number(editTeacherId) : null,
        teacherName: selectedTeacher?.name || 'Admin Coverage',
        swapWithDay: swapDay,
        swapWithPeriod: swapPeriod
      };

      console.log('Updating cell with payload:', payload);
      await updateTimetableCell(payload);
      
      setSuccessMsg('✨ Timetable updated successfully!');
      
      // Close modal
      document.getElementById('cell-editor-modal').close();
      setActiveCell(null);

      // Reload timetable
      await loadClassTimetable(selectedClass);

      // Auto-clear success toast after 3s
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err) {
      console.error('Failed to update slot:', err);
      setError(err.message || 'Failed to save period changes.');
    } finally {
      setSavingCell(false);
    }
  };

  // Helper to filter subjects by the selected class standard
  const getSubjectsForCurrentStandard = () => {
    if (!timetable?.class?.standard) return [];
    return allSubjects.filter(sub => sub.standard === timetable.class.standard);
  };

  const exportClassTimetable = () => {
    if (!timetable) return;
    
    let csvContent = `Class Timetable - ${timetable.class.full_name}\n\n`;
    csvContent += 'Day,Period,Subject,Teacher\n';
    
    const activeDays = timetable.config?.daysPerWeek === 6 ? daysList : daysList.slice(0, 5);
    const totalPeriods = timetable.config?.periodsPerDay || maxPeriods;

    activeDays.forEach(day => {
      for (let period = 1; period <= totalPeriods; period++) {
        const periodName = `Period ${period}`;
        const slot = getDisplaySlot(timetable.schedule[day]?.[periodName]);
        csvContent += `${day},${period},${slot.subject},${slot.teacher}\n`;
      }
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timetable.class.full_name}_Timetable.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Render elements
  const activeDays = timetable?.config?.daysPerWeek === 6 ? daysList : daysList.slice(0, 5);
  const totalPeriods = timetable?.config?.periodsPerDay || maxPeriods;

  return (
    <div className="relative p-4 md:p-6 max-w-7xl mx-auto space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#bae6fd,transparent_34%),radial-gradient(circle_at_top_right,#fed7aa,transparent_30%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#fff7ed_100%)]"></div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-sky-100/60 backdrop-blur">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">Full-day class coverage</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-cyan-800 to-orange-600 bg-clip-text text-transparent">
            Interactive Class Timetable
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Every class period is kept occupied. Color cards highlight subjects, admin coverage, overrides, and conflicts at a glance.
          </p>
        </div>
        {timetable && (
          <button
            onClick={exportClassTimetable}
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            📥 Export to CSV
          </button>
        )}
      </div>

      {/* Toast Alert */}
      {successMsg && (
        <div className="alert alert-success shadow-lg animate-bounce text-white font-medium bg-green-500">
          <div>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg text-white font-medium bg-red-500">
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Class Selector Grid */}
      <div className="rounded-[2rem] border border-white/70 bg-white/85 shadow-xl shadow-cyan-100/50 backdrop-blur">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏫</span> Select Class to View/Edit
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {classes.map((cls) => (
              <div 
                key={cls.id}
                className={`p-4 border-2 rounded-2xl cursor-pointer text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                  selectedClass === cls.id 
                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-orange-50 ring-4 ring-cyan-500/10' 
                    : 'border-slate-200 hover:border-cyan-200 bg-white/80'
                }`}
                onClick={() => handleClassChange(cls.id)}
              >
                <div className="text-2xl mb-1">📚</div>
                <h4 className="font-bold text-slate-800">{cls.full_name}</h4>
                <p className="text-xs text-slate-500 font-medium">Standard {cls.standard}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-slate-500 font-medium animate-pulse">Loading class timetable and rules...</p>
        </div>
      )}

      {/* Interactive Grid Card */}
      {timetable && !loading && (
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-cyan-100/60 backdrop-blur">
          <div className="bg-gradient-to-r from-cyan-50 via-white to-orange-50 p-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="inline-flex w-fit rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg shadow-slate-200">
              Standard {timetable.class.standard} — Division {timetable.class.division}
            </span>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Manual Override
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Conflict Highlight
              </span>
            </div>
          </div>
          
          <div className="p-4 md:p-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-2">
              <thead>
                <tr className="text-slate-800 text-sm font-black text-center">
                  <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                    Period
                  </th>
                  {activeDays.map(day => (
                    <th key={day} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-center">
                {Array.from({ length: totalPeriods }, (_, periodIndex) => {
                  const periodNum = periodIndex + 1;
                  
                  // Render regular period row
                  return (
                    <tr key={periodNum}>
                      <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left">
                        <span className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                          Period {periodNum}
                        </span>
                      </td>
                      {activeDays.map(day => {
                        const dayPeriodsCount = timetable.config?.dayPeriods?.[day] ?? totalPeriods;
                        if (periodNum > dayPeriodsCount) {
                          return (
                            <td 
                              key={`${day}-${periodNum}`} 
                              className="p-3 rounded-2xl bg-slate-100 text-slate-400 select-none cursor-not-allowed align-middle"
                              title="No period scheduled for this day"
                            >
                              -
                            </td>
                          );
                        }
                        const slot = getDisplaySlot(timetable.schedule[day]?.[`Period ${periodNum}`]);
                        const isCoverage = slot.isCoverageFallback;
                        const isFree = false;
                        const isManual = slot?.isManualOverride;
                        const hasConflict = slot?.hasConflict;
                        const theme = getSubjectTheme(slot.subject);

                        return (
                          <td 
                            key={`${day}-${periodNum}`} 
                            onClick={() => handleOpenEditor(day, periodNum)}
                            className={`relative cursor-pointer rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap} ${
                              hasConflict 
                                ? 'bg-red-50 ring-2 ring-red-400' 
                                : isManual 
                                  ? 'bg-orange-50 ring-2 ring-orange-300'
                                  : 'bg-transparent'
                            }`}
                            title={hasConflict ? slot.conflictDescription : "Click to edit this slot"}
                          >
                            {/* Manual dot indicator */}
                            {isManual && (
                              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                              </span>
                            )}

                            {/* Cell Content */}
                            {isFree ? (
                              <div className="py-2 text-slate-400 text-xs font-semibold tracking-wide uppercase">Free</div>
                            ) : (
                              <div className="space-y-1 py-1">
                                <div className="font-extrabold text-sm text-slate-800 tracking-tight">{slot.subject}</div>
                                {isCoverage && (
                                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-600">Admin coverage</div>
                                )}
                                <div className="text-xs font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 inline-block">{slot.teacher}</div>
                                {hasConflict && (
                                  <div className="text-[10px] text-red-600 font-bold bg-red-100 rounded px-1 py-0.5 mt-1 border border-red-200 shadow-sm animate-pulse">
                                    ⚠️ Conflict
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Legend */}
      {timetable && !loading && (
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-4 text-xs font-bold text-slate-600 shadow-lg shadow-cyan-100/40 backdrop-blur">
          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-cyan-300 bg-cyan-100 inline-block"></span> Subject Card
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-teal-300 bg-teal-100 inline-block"></span> Admin Coverage
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-orange-300 bg-orange-50/40 relative inline-block">
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              </span> Manual override
            </span>
            <span className="flex items-center gap-2 text-red-700 font-bold">
              <span className="w-4 h-4 rounded border-2 border-dashed border-red-500 bg-red-50 inline-block"></span> Conflict warning cell
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedClass && !loading && (
        <div className="text-center py-20 card bg-white border border-slate-100 shadow-lg">
          <div className="text-7xl mb-4 animate-bounce">📅</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">Select a Class Standard</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Choose standard division from the class selector grid above to preview, edit, or swap timetable schedules.
          </p>
        </div>
      )}

      {/* DaisyUI Cell Editor Modal */}
      <dialog id="cell-editor-modal" className="modal">
        <div className="modal-box max-w-lg p-6 rounded-2xl bg-white border border-slate-100 shadow-2xl">
          <h3 className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            <span>✏️</span> Adjust Schedule Slot
          </h3>
          
          {activeCell && (
            <p className="text-sm text-slate-500 font-semibold border-b pb-3 mb-4">
              Class {timetable?.class?.full_name} | {activeCell.day} Period {activeCell.periodNum}
            </p>
          )}

          {/* Action Choice Tabs */}
          <div className="tabs tabs-boxed mb-5 flex justify-center bg-slate-100 p-1 rounded-xl">
            <button 
              className={`tab font-bold text-xs ${editorAction === 'edit' ? 'tab-active bg-white text-violet-600 shadow-sm rounded-lg' : 'text-slate-500'}`}
              onClick={() => setEditorAction('edit')}
            >
              📝 Reassign Slot
            </button>
            <button 
              className={`tab font-bold text-xs ${editorAction === 'swap' ? 'tab-active bg-white text-violet-600 shadow-sm rounded-lg' : 'text-slate-500'}`}
              onClick={() => setEditorAction('swap')}
            >
              🔄 Swap Slots
            </button>
            <button 
              className={`tab font-bold text-xs ${editorAction === 'clear' ? 'tab-active bg-white text-red-600 shadow-sm rounded-lg' : 'text-slate-500'}`}
              onClick={() => setEditorAction('clear')}
            >
              Coverage Slot
            </button>
          </div>

          {/* Editor Mode: EDIT */}
          {editorAction === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="label font-bold text-xs text-slate-600">Select Subject</label>
                <select 
                  value={editSubject} 
                  onChange={(e) => {
                    setEditSubject(e.target.value);
                    setEditTeacherId('');
                  }}
                  className="select select-bordered w-full rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                >
                  <option value="">-- Choose Subject --</option>
                  {getSubjectsForCurrentStandard().map(sub => (
                    <option key={sub.id} value={sub.subject_name}>
                      {sub.subject_name} ({sub.weekly_periods} periods/wk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label font-bold text-xs text-slate-600">Select Qualified Teacher</label>
                <select 
                  value={editTeacherId} 
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="select select-bordered w-full rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                  disabled={!editSubject}
                >
                  <option value="">-- Select Teacher --</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max {t.dailyPeriods} periods/day)
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation Warning Overlay */}
              {checkingValidation && (
                <div className="text-center py-2 flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-xs text-amber-500"></span>
                  <span className="text-xs text-amber-600 font-semibold animate-pulse">Running live constraint checks...</span>
                </div>
              )}

              {validationWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl text-xs space-y-1 shadow-sm">
                  <p className="font-extrabold flex items-center gap-1">⚠️ Scheduling Alerts:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {validationWarnings.map((w, idx) => (
                      <li key={idx} className="font-semibold">{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Editor Mode: SWAP */}
          {editorAction === 'swap' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Swap this current slot's values with another slot in the same class schedule.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label font-bold text-xs text-slate-600">Target Day</label>
                  <select 
                    value={swapDay} 
                    onChange={(e) => setSwapDay(Number(e.target.value))}
                    className="select select-bordered w-full rounded-xl"
                  >
                    {activeDays.map((d, index) => (
                      <option key={d} value={index + 1}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label font-bold text-xs text-slate-600">Target Period</label>
                  <select 
                    value={swapPeriod} 
                    onChange={(e) => setSwapPeriod(Number(e.target.value))}
                    className="select select-bordered w-full rounded-xl"
                  >
                    {Array.from({ length: totalPeriods }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Period {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Editor Mode: CLEAR */}
          {editorAction === 'clear' && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex flex-col items-center text-center space-y-2">
              <span className="text-3xl animate-pulse">🗑️</span>
              <p className="font-extrabold">Move this period to admin coverage?</p>
              <p className="font-semibold">The class will still be occupied, and the current teacher will be released from this slot.</p>
            </div>
          )}

          {/* Actions Footer */}
          <div className="modal-action flex justify-end gap-2 mt-6 border-t pt-4">
            <button 
              type="button" 
              className="btn btn-ghost hover:bg-slate-100 rounded-xl"
              onClick={() => {
                document.getElementById('cell-editor-modal').close();
                setActiveCell(null);
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveCell}
              className={`btn rounded-xl text-white ${editorAction === 'clear' ? 'btn-error bg-red-500' : 'btn-primary bg-violet-600 hover:bg-violet-700'}`}
              disabled={savingCell || (editorAction === 'edit' && (!editSubject || !editTeacherId))}
            >
              {savingCell ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default ClassTimetable;
