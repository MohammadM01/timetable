import React, { useState, useEffect } from 'react';
import { generateTimetableWithConfig, getAvailableClasses, getTimetable, getTeacherSubjects } from '../utils/api';

const GenerateTimetable = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [generationType, setGenerationType] = useState('selected'); // Default to selected instead of all
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [viewType, setViewType] = useState('class'); // 'class' or 'teacher'
  const [warnings, setWarnings] = useState([]); // Warnings from generation
  const [customPreferences, setCustomPreferences] = useState('');
  const [useCustomDayPeriods, setUseCustomDayPeriods] = useState(true); // Default to true so Friday half-day works out-of-the-box
  const [config, setConfig] = useState({
    daysPerWeek: 6, // Include Saturday
    periodsPerDay: 9, // Let's set default to 9 periods to match the screenshot!
    periodDuration: 45,
    startTime: '08:00',
    recessAfterPeriod: 5, // Recess after 5th period to match the screenshot!
    dayPeriods: {
      Monday: 9,
      Tuesday: 9,
      Wednesday: 9,
      Thursday: 9,
      Friday: 5, // Exactly 5 periods on Friday as requested!
      Saturday: 5 // Default Saturday to 5 periods as well
    }
  });

  // Load classes and latest timetable on component mount
  useEffect(() => {
    fetchAvailableClasses();
    loadTimetable(true);
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const data = await getAvailableClasses();
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch available classes');
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    setWarnings([]);

    try {
      // Check if we have teacher-subject assignments
      console.log('Checking teacher-subject assignments...');
      const teacherSubjects = await getTeacherSubjects();
      console.log('Teacher-subject assignments:', teacherSubjects);

      if (!teacherSubjects || teacherSubjects.length === 0) {
        setError('No teacher-subject assignments found. Please assign subjects to teachers first in the Subject Assignment page.');
        setLoading(false);
        return;
      }

      // Validate selected classes when generation type is 'selected'
      if (generationType === 'selected' && selectedClasses.length === 0) {
        setError('Please select at least one class to generate timetable for.');
        setLoading(false);
        return;
      }

      const payload = {
        config: useCustomDayPeriods ? config : { ...config, dayPeriods: null },
        selectedClasses: selectedClasses.map(id => id.toString()),
        generationType: generationType === 'selected' ? 'selected' : 'all',
        viewType: 'student',
        customPreferences
      };

      console.log('Generating timetable with payload:', payload);
      console.log('Selected classes:', selectedClasses);
      console.log('Available classes:', classes);

      const data = await generateTimetableWithConfig(payload);
      console.log('Generation response:', data);
      setMessage(`✅ ${data.message}`);

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      // Load the generated timetable
      await loadTimetable();

    } catch (err) {
      console.error('Failed to generate timetable:', err);
      setError(err.message || 'Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async (isMount = false) => {
    try {
      const data = await getTimetable();
      console.log('Loaded timetable data:', data);
      console.log('Timetable overview structure:', data.overview);
      console.log('Timetable direct structure:', data.timetable);

      if (data.config) {
        console.log('Pre-filling configuration from database:', data.config);
        setConfig(data.config);
        setUseCustomDayPeriods(!!data.config.dayPeriods);
      }

      if (data.overview) {
        console.log('Sample overview data:', Object.keys(data.overview));
        if (Object.keys(data.overview).length > 0) {
          const firstDay = Object.keys(data.overview)[0];
          console.log(`Sample data for ${firstDay}:`, data.overview[firstDay]);
        }
      }

      // If overview doesn't exist, try to use the direct timetable data
      if (!data.overview && data.timetable) {
        console.log('Using direct timetable data instead of overview');
        // Convert timetable format to overview format
        const overview = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        days.forEach((day, dayIndex) => {
          overview[day] = {};
          for (let period = 1; period <= config.periodsPerDay; period++) {
            overview[day][`Period ${period}`] = {};

            // Get all classes and their data for this period
            Object.keys(data.timetable).forEach(classId => {
              const classData = classes.find(c => c.id === classId);
              if (classData) {
                const slot = data.timetable[classId]?.[dayIndex + 1]?.[period];
                overview[day][`Period ${period}`][classData.full_name] = slot || {
                  subject: 'Free',
                  teacher: 'Free',
                  teacherId: null
                };
              }
            });
          }
        });

        data.overview = overview;
        console.log('Converted timetable to overview format:', overview);
      }

      setTimetable(data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
      if (!isMount) {
        setError('Failed to load timetable');
      }
    }
  };

  const handleGenerateAgain = async () => {
    setTimetable(null);
    setMessage('');
    setError('');
    setWarnings([]);
    // Generate a new timetable without page reload
    await handleGenerate();
  };

  const handleSaveTimetable = () => {
    // For now, just show a success message
    // In the future, this could save to a specific location or mark as saved
    setMessage('✅ Timetable saved successfully!');
  };

  const exportTimetable = () => {
    if (!timetable || !selectedClasses.length) return;

    const selectedClassTimetable = getSelectedClassTimetable();
    if (!selectedClassTimetable) return;

    // Create CSV content for selected class only
    let csvContent = `Timetable for ${selectedClassTimetable.class.full_name}\n`;
    csvContent += `Standard: ${selectedClassTimetable.class.standard} | Division: ${selectedClassTimetable.class.division}\n\n`;
    csvContent += 'Day,Period,Subject,Teacher\n';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    days.forEach(day => {
      for (let period = 1; period <= config.periodsPerDay; period++) {
        const slot = selectedClassTimetable.timetable[day][period];
        csvContent += `${day},${period},${slot?.subject || 'Free'},${slot?.teacher || 'Free'}\n`;
      }
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedClassTimetable.class.full_name}_Timetable.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleClassSelection = (classId, checked) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId]);
    } else {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    }
  };

  const handleSelectAll = () => {
    if (selectedClasses.length === classes.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(classes.map(c => c.id));
    }
  };

  // Function to get cell content for timetable display
  const getCellContent = (dayName, periodName, className) => {
    if (!timetable?.overview?.[dayName]?.[periodName]?.[className]) return 'Free';
    const slot = timetable.overview[dayName][periodName][className];
    return `${slot.subject}\n${slot.teacher}`;
  };

  // Function to get selected class timetable data
  const getSelectedClassTimetable = () => {
    if (!timetable || !selectedClasses.length) return null;

    const selectedClassData = classes.find(cls => selectedClasses.includes(cls.id));
    if (!selectedClassData) return null;

    console.log('Selected class data:', selectedClassData);
    console.log('Timetable overview:', timetable.overview);

    const classTimetable = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Extract timetable data for the selected class
    days.forEach(day => {
      classTimetable[day] = {};
      for (let period = 1; period <= config.periodsPerDay; period++) {
        const periodName = `Period ${period}`;
        const slot = timetable.overview?.[day]?.[periodName]?.[selectedClassData.full_name];
        console.log(`Slot for ${day} ${periodName} ${selectedClassData.full_name}:`, slot);
        classTimetable[day][period] = slot || { subject: 'Free', teacher: 'Free' };
      }
    });

    console.log('Processed class timetable:', classTimetable);
    return {
      class: selectedClassData,
      timetable: classTimetable
    };
  };

  // Function to get unique subjects for the selected class
  const getClassSubjects = () => {
    const classTimetable = getSelectedClassTimetable();
    if (!classTimetable) return [];

    const subjects = new Set();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    days.forEach(day => {
      for (let period = 1; period <= config.periodsPerDay; period++) {
        const slot = classTimetable.timetable[day][period];
        if (slot.subject !== 'Free') {
          subjects.add(slot.subject);
        }
      }
    });

    return Array.from(subjects).sort();
  };

  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.standard]) {
      acc[cls.standard] = [];
    }
    acc[cls.standard].push(cls);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6">Generate Timetable</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">

        {/* Generation Type Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Generation Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${generationType === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => setGenerationType('all')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🏫</div>
                <h4 className="font-semibold">All Classes</h4>
                <p className="text-sm text-gray-600">Generate for all classes</p>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${generationType === 'selected' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => setGenerationType('selected')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">📚</div>
                <h4 className="font-semibold">Selected Classes</h4>
                <p className="text-sm text-gray-600">Choose specific classes</p>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${generationType === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              onClick={() => setGenerationType('standard')}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold">By Standard</h4>
                <p className="text-sm text-gray-600">Generate by grade level</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        {generationType === 'selected' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Select Classes</h3>
              <button
                onClick={handleSelectAll}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
              >
                {selectedClasses.length === classes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {Object.entries(groupedClasses).map(([standard, standardClasses]) => (
                <div key={standard} className="mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">{standard}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {standardClasses.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={cls.id}
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => handleClassSelection(cls.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={cls.id} className="text-sm text-gray-700">
                          {cls.division}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedClasses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {selectedClasses.length} class(es) selected
                </span>
              </div>
            )}
          </div>
        )}

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">School Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Days per Week
              </label>
              <input
                id="daysPerWeek"
                type="number"
                min="1"
                max="7"
                value={config.daysPerWeek}
                onChange={(e) => setConfig({ ...config, daysPerWeek: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="recessAfterPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Recess After Period
              </label>
              <input
                id="recessAfterPeriod"
                type="number"
                min="1"
                max="8"
                value={config.recessAfterPeriod}
                onChange={(e) => setConfig({ ...config, recessAfterPeriod: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="periodsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                Periods per Day
              </label>
              <input
                id="periodsPerDay"
                type="number"
                min="1"
                max="12"
                value={config.periodsPerDay}
                onChange={(e) => setConfig({ ...config, periodsPerDay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="periodDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Period Duration (min)
              </label>
              <input
                id="periodDuration"
                type="number"
                min="30"
                max="90"
                value={config.periodDuration}
                onChange={(e) => setConfig({ ...config, periodDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                type="time"
                value={config.startTime}
                onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Day-wise Period Configuration */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-semibold text-gray-800">Custom Day-wise Periods</h4>
                <p className="text-xs text-gray-500">Configure a distinct number of periods for specific days (e.g., half-day Friday or Saturday)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomDayPeriods}
                  onChange={(e) => setUseCustomDayPeriods(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {useCustomDayPeriods && (
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].slice(0, config.daysPerWeek).map((day) => (
                  <div key={day}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">{day}</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={config.dayPeriods?.[day] ?? config.periodsPerDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || config.periodsPerDay;
                        setConfig({
                          ...config,
                          dayPeriods: {
                            ...(config.dayPeriods || {}),
                            [day]: val
                          }
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Custom Preferences (Optional)</h3>
          <p className="text-sm text-gray-600">
            Tell the AI how you want the timetable. Examples:<br />
            - "Add Algebra daily except Friday"<br />
            - "On Thursday make Algebra 2 periods back to back"<br />
            - "Ensure all periods are full"
          </p>
          <textarea
            value={customPreferences}
            onChange={(e) => setCustomPreferences(e.target.value)}
            placeholder="Type your preferences here..."
            className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center items-center mb-4">
          <button
            onClick={handleGenerate}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300 text-lg font-semibold"
            disabled={loading || (generationType === 'selected' && selectedClasses.length === 0)}
          >
            {loading ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
            {error}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (() => {
          const capacityWarnings = warnings.filter(w => w.toLowerCase().includes('needs') && w.toLowerCase().includes('available'));
          const otherWarnings = warnings.filter(w => !w.toLowerCase().includes('needs') || !w.toLowerCase().includes('available'));

          return (
            <div className="mt-6 space-y-4">
              {/* Premium Capacity Conflict Card */}
              {capacityWarnings.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg shadow-sm text-red-900">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">💡</span>
                    <div className="w-full">
                      <h4 className="font-bold text-lg text-red-800 mb-1">
                        Weekly Curriculum Capacity Conflict!
                      </h4>
                      <p className="text-sm mb-3">
                        Your subjects require more weekly periods than the current school configuration provides. 
                        The algorithm had to leave some periods unassigned because there are physically not enough hours in the school week.
                      </p>
                      
                      <div className="space-y-2 bg-white/70 p-3 rounded-lg border border-red-100 text-xs">
                        <span className="font-bold text-red-800 block mb-1">Standard-wise Deficit Analysis:</span>
                        {capacityWarnings.map((w, idx) => {
                          const match = w.match(/Warning:\s+(.+?)\s+needs\s+(\d+)\s+periods\s+but\s+only\s+(\d+)\s+available/i);
                          if (match) {
                            const [_, standard, needed, available] = match;
                            const deficit = Number(needed) - Number(available);
                            return (
                              <div key={idx} className="flex flex-col sm:flex-row sm:justify-between border-b border-red-200/40 pb-1 last:border-0 last:pb-0">
                                <span>Standard <strong className="text-red-700">{standard}</strong>:</span>
                                <span>Requires <strong>{needed} periods</strong> | Week has <strong>{available} slots</strong> (Deficit: <strong className="text-red-600">-{deficit}</strong>)</span>
                              </div>
                            );
                          }
                          return <div key={idx} className="border-b border-red-200/40 pb-1 last:border-0 last:pb-0">{w}</div>;
                        })}
                      </div>
                      
                      <div className="mt-4 text-xs text-red-700 space-y-1 bg-red-100/50 p-3 rounded-lg">
                        <span className="font-bold block text-red-800 mb-1">How to Resolve This:</span>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                          <li><strong>Option A: Reduce Weekly Periods</strong> for standard subjects in the <a href="/subject-setup" className="font-bold underline hover:text-red-900">Subject Setup</a> page.</li>
                          <li><strong>Option B: Increase School Hours</strong> by increasing <em>Periods per Day</em> or increasing periods on Friday/Saturday in the <em>School Configuration</em> panel above.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Allocation Warnings */}
              {otherWarnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg">
                  <div className="flex items-start">
                    <span className="text-xl mr-2">⚠️</span>
                    <div>
                      <h4 className="font-bold mb-1">Detailed Allocation Warnings:</h4>
                      <p className="text-xs text-yellow-700 mb-2">The following periods could not find free slots because the classes' daily schedules were already fully booked by other subjects:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {otherWarnings.slice(0, 5).map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                        {otherWarnings.length > 5 && (
                          <li className="italic text-gray-600">And {otherWarnings.length - 5} more allocation issues...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Action Buttons - Show when timetable is generated */}
        {timetable && (
          <div className="flex justify-center gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('class')}
                className={`px-4 py-2 rounded-lg transition duration-300 ${viewType === 'class'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Class Timetable
              </button>
              <button
                onClick={() => setViewType('teacher')}
                className={`px-4 py-2 rounded-lg transition duration-300 ${viewType === 'teacher'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Teacher Timetable
              </button>
            </div>
            <button
              onClick={handleGenerateAgain}
              className="bg-orange-600 text-white py-2 px-6 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 transition duration-300"
            >
              Generate Again
            </button>
            <button
              onClick={handleSaveTimetable}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-300"
            >
              Save Timetable
            </button>
            <button
              onClick={exportTimetable}
              className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300"
            >
              Export to CSV
            </button>
          </div>
        )}

        {/* Timetable Display */}
        {timetable && selectedClasses.length > 0 && (
          <div className="space-y-4">
            {(() => {
              const selectedClassTimetable = getSelectedClassTimetable();
              const classSubjects = getClassSubjects();

              if (!selectedClassTimetable) return null;

              return (
                <>
                  {/* Class Header */}
                  <div className="text-center bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <h3 className="text-2xl font-bold text-blue-800">
                      {selectedClassTimetable.class.full_name}
                    </h3>
                    <p className="text-blue-600 mt-1">
                      Standard: {selectedClassTimetable.class.standard} | Division: {selectedClassTimetable.class.division}
                    </p>
                  </div>

                  {/* Subject-wise Timetable */}
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                                Subject
                              </th>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                <th key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-l">
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {classSubjects.map((subject, idx) => (
                              <tr key={subject} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {subject}
                                </td>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                  // Find which period this subject is taught on this day
                                  let periodInfo = '';
                                  for (let period = 1; period <= config.periodsPerDay; period++) {
                                    const slot = selectedClassTimetable.timetable[day][period];
                                    if (slot.subject === subject) {
                                      periodInfo = viewType === 'class' ? `Period ${period}` : `Period ${period}\n${slot.teacher}`;
                                      break;
                                    }
                                  }

                                  return (
                                    <td key={`${day}-${subject}`} className="px-4 py-3 text-center text-sm border-l whitespace-pre-line">
                                      {periodInfo || '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Period-wise Timetable (Alternative view) */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      Period-wise Schedule
                    </h4>
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Period
                                </th>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                                  <th key={day} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
                                    {day}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {Array.from({ length: config.periodsPerDay }, (_, periodIndex) => {
                                const period = periodIndex + 1;
                                const showRecess = period === config.recessAfterPeriod;

                                const rows = [
                                  <tr key={period} className={periodIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {`Period ${period}`}
                                    </td>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                      const dayPeriodsCount = config.dayPeriods?.[day] ?? config.periodsPerDay;
                                      if (period > dayPeriodsCount) {
                                        return (
                                          <td key={`${day}-${period}`} className="px-2 py-1 text-xs border-l text-center bg-gray-100 text-gray-400 select-none">
                                            -
                                          </td>
                                        );
                                      }
                                      const slot = selectedClassTimetable.timetable[day][period];
                                      const content = slot && slot.subject !== 'Free'
                                        ? (viewType === 'class' ? slot.subject : `${slot.subject}\n${slot.teacher}`)
                                        : 'Free';
                                      return (
                                        <td key={`${day}-${period}`} className="px-2 py-1 text-xs border-l whitespace-pre-line text-center">
                                          {content}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ];

                                if (showRecess) {
                                  rows.push(
                                    <tr key="recess" className="bg-yellow-50">
                                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                        Recess
                                      </td>
                                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                        const dayPeriodsCount = config.dayPeriods?.[day] ?? config.periodsPerDay;
                                        if (config.recessAfterPeriod >= dayPeriodsCount) {
                                          return (
                                            <td key={`${day}-recess`} className="px-2 py-1 text-xs border-l text-center bg-gray-100 text-gray-400 select-none">
                                              -
                                            </td>
                                          );
                                        }
                                        return (
                                          <td key={`${day}-recess`} className="px-2 py-1 text-xs border-l text-center bg-yellow-100 font-semibold text-yellow-800">
                                            RECESS
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                }

                                return rows;
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateTimetable;  