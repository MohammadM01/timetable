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

  useEffect(() => {
    fetchAvailableClasses();
    loadSubjectsAndTeachers();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const data = await getAvailableClasses();
      setClasses(data);
    } catch (err) {
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
    const slot = timetable?.schedule[day]?.[`Period ${periodNum}`];
    
    setActiveCell({ day, periodNum });
    setEditorAction('edit');
    setValidationWarnings([]);

    if (slot && slot.subject !== 'Free') {
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
        teacherName: selectedTeacher?.name || 'Free',
        swapWithDay: swapDay,
        swapWithPeriod: swapPeriod
      };

      console.log('Updating cell with payload:', payload);
      const result = await updateTimetableCell(payload);
      
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
        const slot = timetable.schedule[day]?.[periodName];
        csvContent += `${day},${period},${slot?.subject || 'Free'},${slot?.teacher || 'Free'}\n`;
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Interactive Class Timetable
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            View, swap, and manually edit timetable schedules. Click any cell to make overrides.
          </p>
        </div>
        {timetable && (
          <button
            onClick={exportClassTimetable}
            className="btn btn-success text-white shadow-md transition-all hover:-translate-y-0.5"
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
      <div className="card bg-white shadow-xl border border-slate-100">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏫</span> Select Class to View/Edit
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {classes.map((cls) => (
              <div 
                key={cls.id}
                className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all duration-300 transform hover:scale-102 hover:shadow-md ${
                  selectedClass === cls.id 
                    ? 'border-violet-600 bg-violet-50/50 ring-2 ring-violet-500/20' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
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
        <div className="card bg-white shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="badge badge-primary font-bold px-3 py-3">
              Standard {timetable.class.standard} — Division {timetable.class.division}
            </span>
            <div className="flex gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Manual Override
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Conflict Highlight
              </span>
            </div>
          </div>
          
          <div className="p-6 overflow-x-auto">
            <table className="table table-zebra w-full border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100/80 text-slate-800 border-b border-slate-200 text-sm font-bold text-center">
                  <th className="p-3 text-left sticky left-0 bg-slate-100 font-extrabold border-r border-slate-200">
                    Period
                  </th>
                  {activeDays.map(day => (
                    <th key={day} className="p-3 text-center border-r border-slate-200 font-extrabold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-center">
                {Array.from({ length: totalPeriods }, (_, periodIndex) => {
                  const periodNum = periodIndex + 1;
                  
                  // Render regular period row
                  return (
                    <tr key={periodNum} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 whitespace-nowrap text-sm font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-200 shadow-sm z-10 text-left">
                        Period {periodNum}
                      </td>
                      {activeDays.map(day => {
                        const dayPeriodsCount = timetable.config?.dayPeriods?.[day] ?? totalPeriods;
                        if (periodNum > dayPeriodsCount) {
                          return (
                            <td 
                              key={`${day}-${periodNum}`} 
                              className="p-3 border-r border-slate-200 bg-slate-100 text-slate-400 select-none cursor-not-allowed align-middle"
                              title="No period scheduled for this day"
                            >
                              -
                            </td>
                          );
                        }
                        const slot = timetable.schedule[day]?.[`Period ${periodNum}`];
                        const isFree = !slot || slot.subject === 'Free';
                        const isManual = slot?.isManualOverride;
                        const hasConflict = slot?.hasConflict;

                        return (
                          <td 
                            key={`${day}-${periodNum}`} 
                            onClick={() => handleOpenEditor(day, periodNum)}
                            className={`p-3 border-r border-slate-200 cursor-pointer transition-all duration-200 relative align-middle ${
                              hasConflict 
                                ? 'bg-red-50 hover:bg-red-100/80 border-2 border-dashed border-red-500 ring-2 ring-red-400/20' 
                                : isFree 
                                  ? 'bg-slate-50/60 hover:bg-slate-100 text-slate-400 italic' 
                                  : isManual 
                                    ? 'bg-orange-50/20 hover:bg-slate-100/50 border-orange-200'
                                    : 'bg-white hover:bg-slate-50'
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
        <div className="card bg-slate-100 p-4 border border-slate-200 text-xs text-slate-600 font-medium">
          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-slate-300 bg-white inline-block"></span> Standard Cell
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-slate-300 bg-slate-50/60 inline-block"></span> Free Period
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
              ❌ Clear Slot
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
              <p className="font-extrabold">Are you sure you want to clear this period?</p>
              <p className="font-semibold">This slot will be marked as a "Free" period, releasing the scheduled teacher.</p>
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