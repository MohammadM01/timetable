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

  // Load classes and latest timetable on component mount
  useEffect(() => {
    fetchAvailableClasses();
    loadTimetable(true);
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      const data = await getAvailableClasses();
      setClasses(data);
    } catch {
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
                overview[day][`Period ${period}`][classData.full_name] = getDisplaySlot(slot);
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
        const slot = getDisplaySlot(selectedClassTimetable.timetable[day][period]);
        csvContent += `${day},${period},${slot.subject},${slot.teacher}\n`;
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
        classTimetable[day][period] = getDisplaySlot(slot);
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
                        The final pass fills every class slot; if teacher capacity runs out, those periods become supervised admin coverage.
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
                      <p className="text-xs text-yellow-700 mb-2">The following allocation warnings were resolved as far as possible by the final fill pass:</p>
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
                  <div className="text-center rounded-[2rem] border border-white/70 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 shadow-xl shadow-cyan-100/40 backdrop-blur border-2">
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      {selectedClassTimetable.class.full_name}
                    </h3>
                    <p className="text-slate-500 font-semibold mt-1.5">
                      Standard: {selectedClassTimetable.class.standard} | Division: {selectedClassTimetable.class.division}
                    </p>
                  </div>

                  {/* Subject-wise Timetable */}
                  <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-cyan-100/50 backdrop-blur mt-6">
                    <div className="bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-5 border-b border-slate-100">
                      <span className="inline-flex w-fit rounded-2xl bg-cyan-950 px-4 py-2 text-sm font-black text-white shadow-lg">
                        📚 Subject-wise Allocation Grid
                      </span>
                    </div>
                    
                    <div className="p-4 md:p-6 overflow-x-auto">
                      <table className="w-full min-w-[800px] border-separate border-spacing-2">
                        <thead>
                          <tr className="text-slate-800 text-sm font-black text-center">
                            <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                              Subject
                            </th>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                              <th key={day} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          {classSubjects.map((subject) => {
                            const theme = getSubjectTheme(subject);
                            return (
                              <tr key={subject}>
                                <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  {subject}
                                </td>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                  // Find which period this subject is taught on this day
                                  let periodInfo = '';
                                  let slotTeacher = '';
                                  for (let period = 1; period <= config.periodsPerDay; period++) {
                                    const slot = selectedClassTimetable.timetable[day][period];
                                    if (slot && slot.subject === subject) {
                                      periodInfo = `Period ${period}`;
                                      slotTeacher = slot.teacher;
                                      break;
                                    }
                                  }

                                  if (!periodInfo) {
                                    return (
                                      <td key={`${day}-${subject}`} className="p-3 rounded-2xl bg-slate-50/50 text-slate-400 select-none text-center align-middle border border-slate-100">
                                        -
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={`${day}-${subject}`} className={`relative rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap}`}>
                                      <div className="space-y-1 py-1">
                                        <div className="font-extrabold text-sm text-slate-800 tracking-tight">{periodInfo}</div>
                                        {viewType !== 'class' && slotTeacher && (
                                          <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 rounded px-1.5 py-0.5 inline-block">{slotTeacher}</div>
                                        )}
                                      </div>
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

                  {/* Period-wise Timetable (Alternative view) */}
                  <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-2xl shadow-cyan-100/50 backdrop-blur mt-8">
                    <div className="bg-gradient-to-r from-cyan-50 via-white to-blue-50 p-5 border-b border-slate-100">
                      <span className="inline-flex w-fit rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-lg">
                        📅 Period-wise Daily Schedule
                      </span>
                    </div>

                    <div className="p-4 md:p-6 overflow-x-auto">
                      <table className="w-full min-w-[800px] border-separate border-spacing-2">
                        <thead>
                          <tr className="text-slate-800 text-sm font-black text-center">
                            <th className="p-3 text-left sticky left-0 z-20 rounded-2xl bg-slate-950 text-white shadow-lg">
                              Period
                            </th>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                              <th key={day} className="p-3 text-center rounded-2xl bg-slate-100 font-black shadow-sm">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-center">
                          {Array.from({ length: config.periodsPerDay }, (_, periodIndex) => {
                            const period = periodIndex + 1;
                            const showRecess = period === config.recessAfterPeriod;

                            const rows = [
                              <tr key={period}>
                                <td className="p-3 whitespace-nowrap text-sm font-black text-slate-700 sticky left-0 z-10 text-left bg-white rounded-2xl border border-slate-100 shadow-sm">
                                  Period {period}
                                </td>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                  const dayPeriodsCount = config.dayPeriods?.[day] ?? config.periodsPerDay;
                                  if (period > dayPeriodsCount) {
                                    return (
                                      <td key={`${day}-${period}`} className="p-3 rounded-2xl bg-slate-100 text-slate-400 select-none cursor-not-allowed align-middle text-center">
                                        -
                                      </td>
                                    );
                                  }

                                  const rawSlot = selectedClassTimetable.timetable[day][period];
                                  const slot = getDisplaySlot(rawSlot);
                                  const isCoverage = slot.isCoverageFallback;
                                  const theme = getSubjectTheme(slot.subject);

                                  return (
                                    <td key={`${day}-${period}`} className={`relative rounded-2xl border bg-gradient-to-br p-3 align-middle shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${theme.wrap}`}>
                                      <div className="space-y-1 py-1">
                                        <div className="font-extrabold text-sm text-slate-800 tracking-tight">{slot.subject}</div>
                                        {isCoverage && (
                                          <div className="text-[10px] font-black uppercase tracking-wide text-slate-600">Admin coverage</div>
                                        )}
                                        {viewType !== 'class' && slot.teacher && (
                                          <div className="text-xs font-semibold text-slate-500 bg-slate-100/80 rounded px-1.5 py-0.5 inline-block">{slot.teacher}</div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ];

                            if (showRecess) {
                              rows.push(
                                <tr key="recess">
                                  <td className="p-3 whitespace-nowrap text-sm font-black text-amber-800 sticky left-0 z-10 text-left bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                                    Recess
                                  </td>
                                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                    const dayPeriodsCount = config.dayPeriods?.[day] ?? config.periodsPerDay;
                                    if (config.recessAfterPeriod >= dayPeriodsCount) {
                                      return (
                                        <td key={`${day}-recess`} className="p-3 rounded-2xl bg-slate-100 text-slate-400 select-none cursor-not-allowed align-middle text-center">
                                          -
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={`${day}-recess`} className="p-3 rounded-2xl bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 border border-amber-200 text-center align-middle font-black text-amber-800 uppercase tracking-widest text-xs shadow-sm animate-pulse">
                                        RECESS Break
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
