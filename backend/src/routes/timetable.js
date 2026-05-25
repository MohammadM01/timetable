import { Router } from 'express';
import Timetable from '../models/Timetable.js';
import TimetableGenerator from '../utils/timetableGenerator.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import { escapeRegex } from '../utils/helpers.js';

const coverageSlot = (subject = 'Supervised Study') => ({
	subject,
	teacher: 'Admin Coverage',
	teacherId: null,
	isCoverageFallback: true
});

const getPeriodsForDayFromConfig = (config, dayNum) => {
	const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const dayName = dayNames[dayNum - 1] || `Day ${dayNum}`;
	
	if (config.dayPeriods && typeof config.dayPeriods === 'object') {
		if (config.dayPeriods[dayName] !== undefined && config.dayPeriods[dayName] !== null) {
			return Number(config.dayPeriods[dayName]);
		}
	}
	
	return config.periodsPerDay || 8;
};

const router = Router();

// Generate new timetable
router.post('/generate', async (req, res) => {
	try {
		const { config = {}, selectedClasses = [], generationType = 'all' } = req.body;

		// Check if we have required data
		const [teachers, subjects, classes, teacherSubjects] = await Promise.all([
			Teacher.find({}).lean(),
			Subject.find({}).lean(),
			Class.find({}).lean(),
			TeacherSubject.find({}).lean()
		]);

		if (teachers.length === 0) {
			return res.status(400).json({ error: 'No teachers found. Please add teachers first.' });
		}
		if (subjects.length === 0) {
			return res.status(400).json({ error: 'No subjects found. Please add subjects first.' });
		}
		if (classes.length === 0) {
			return res.status(400).json({ error: 'No classes found. Please add classes first.' });
		}
		if (teacherSubjects.length === 0) {
			return res.status(400).json({ error: 'No teacher-subject mappings found. Please assign subjects to teachers first.' });
		}

		// Filter classes based on selection
		let targetClasses = classes;
		if (generationType === 'selected' && selectedClasses.length > 0) {
			targetClasses = classes.filter(cls => selectedClasses.includes(cls._id.toString()));
			if (targetClasses.length === 0) {
				return res.status(400).json({ error: 'No valid classes selected for generation.' });
			}
		}

		// Create and run generator
		const generator = new TimetableGenerator({ ...config, targetClasses });
		const timetable = await generator.generate();

		// Extract warnings from log
		const warnings = timetable.generationLog.filter(log =>
			log.toLowerCase().includes('warning') ||
			log.toLowerCase().includes('not enough')
		);

		return res.json({
			success: true,
			message: `Timetable generated successfully for ${targetClasses.length} class(es)`,
			warnings,
			timetableId: timetable._id,
			stats: timetable.stats,
			generatedFor: targetClasses.map(c => ({ id: c._id, name: c.full_name }))
		});

	} catch (error) {
		console.error('Timetable generation error:', error);
		return res.status(500).json({
			error: 'Failed to generate timetable',
			details: error.message
		});
	}
});

// Get class timetable
router.get('/class/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });

		if (!timetable) {
			return res.status(404).json({ error: 'No timetable found. Please generate a timetable first.' });
		}

		const classTimetable = timetable.timetable[id];
		if (!classTimetable) {
			return res.status(404).json({ error: 'Class not found in timetable' });
		}

		// Get class details
		const classData = await Class.findById(id);
		if (!classData) {
			return res.status(404).json({ error: 'Class not found' });
		}

		// Format the response
		const formattedTimetable = {
			class: {
				id: classData._id,
				standard: classData.standard,
				division: classData.division,
				full_name: classData.full_name
			},
			config: timetable.schoolConfig,
			schedule: {}
		};

		// Convert to day-wise format
		const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		for (let day = 1; day <= timetable.schoolConfig.daysPerWeek; day++) {
			const dayName = dayNames[day - 1] || `Day ${day}`;
			formattedTimetable.schedule[dayName] = {};

			const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, day);
			for (let period = 1; period <= dayPeriods; period++) {
				const slot = classTimetable[day] && classTimetable[day][period];
				formattedTimetable.schedule[dayName][`Period ${period}`] = slot || coverageSlot();
			}
		}

		return res.json(formattedTimetable);

	} catch (error) {
		console.error('Error fetching class timetable:', error);
		return res.status(500).json({ error: 'Failed to fetch class timetable' });
	}
});


// Get school timetable (complete overview)
router.get('/school', async (req, res) => {
	try {
		const timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });

		if (!timetable) {
			return res.status(404).json({ error: 'No timetable found. Please generate a timetable first.' });
		}

		// Get all classes
		const classes = await Class.find({}).sort({ standard: 1, division: 1 });

		// Format the response
		const schoolTimetable = {
			config: timetable.schoolConfig,
			stats: timetable.stats,
			generatedAt: timetable.generatedAt,
			overview: {}
		};

		// Create period-wise overview
		const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		for (let day = 1; day <= timetable.schoolConfig.daysPerWeek; day++) {
			const dayName = dayNames[day - 1] || `Day ${day}`;
			schoolTimetable.overview[dayName] = {};

			const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, day);
			for (let period = 1; period <= dayPeriods; period++) {
				schoolTimetable.overview[dayName][`Period ${period}`] = {};

				// Get all classes for this period
				for (const classData of classes) {
					const classTimetable = timetable.timetable[classData._id];
					const slot = classTimetable && classTimetable[day] && classTimetable[day][period];

					schoolTimetable.overview[dayName][`Period ${period}`][classData.full_name] = slot || coverageSlot();
				}
			}
		}

		return res.json(schoolTimetable);

	} catch (error) {
		console.error('Error fetching school timetable:', error);
		return res.status(500).json({ error: 'Failed to fetch school timetable' });
	}
});

// Get timetable generation status
router.get('/status', async (req, res) => {
	try {
		const timetable = await Timetable.findOne({}).sort({ generatedAt: -1 });

		if (!timetable) {
			return res.json({
				status: 'not_generated',
				message: 'No timetable has been generated yet'
			});
		}

		return res.json({
			status: timetable.generationStatus,
			generatedAt: timetable.generatedAt,
			stats: timetable.stats,
			log: timetable.generationLog
		});

	} catch (error) {
		console.error('Error fetching timetable status:', error);
		return res.status(500).json({ error: 'Failed to fetch timetable status' });
	}
});

// Get all timetables (for admin)
router.get('/', async (req, res) => {
	try {
		const timetables = await Timetable.find({}).sort({ generatedAt: -1 }).select('generatedAt generationStatus stats');
		return res.json(timetables);
	} catch (error) {
		console.error('Error fetching timetables:', error);
		return res.status(500).json({ error: 'Failed to fetch timetables' });
	}
});

// Get available classes for generation
router.get('/available-classes', async (req, res) => {
	try {
		const classes = await Class.find({}).sort({ standard: 1, division: 1 }).lean();
		const formatted = classes.map(c => ({
			id: c._id,
			standard: c.standard,
			division: c.division,
			full_name: c.full_name
		}));
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching available classes:', error);
		return res.status(500).json({ error: 'Failed to fetch available classes' });
	}
});

// Get subjects by standard
router.get('/subjects/:standard', async (req, res) => {
	try {
		const { standard } = req.params;
		const subjects = await Subject.find({ standard }).sort({ subject_name: 1 }).lean();
		const formatted = subjects.map(s => ({
			id: s._id,
			subject_name: s.subject_name,
			standard: s.standard,
			weekly_periods: s.weekly_periods,
			consecutive_periods: s.consecutive_periods
		}));
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching subjects:', error);
		return res.status(500).json({ error: 'Failed to fetch subjects' });
	}
});

// Get teachers for a specific subject and standard
router.get('/teachers/:standard/:subjectName', async (req, res) => {
	try {
		const { standard, subjectName } = req.params;
		const teacherSubjects = await TeacherSubject.find({
			standard,
			subjectName: new RegExp(escapeRegex(subjectName), 'i')
		}).lean();

		const formatted = teacherSubjects.map(ts => ({
			teacherId: ts.teacherId,
			teacherName: ts.teacherName,
			preferredPeriods: ts.preferredPeriods || [],
			avoidPeriods: ts.avoidPeriods || [],
			consecutivePeriods: ts.consecutivePeriods || false
		}));

		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching teachers for subject:', error);
		return res.status(500).json({ error: 'Failed to fetch teachers for subject' });
	}
});

// Get teacher timetable
router.get('/teacher/:id', async (req, res) => {
	try {
		const { id } = req.params;
		console.log('Fetching teacher timetable for ID:', id);

		const timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });

		if (!timetable) {
			console.log('No completed timetable found');
			return res.status(404).json({ error: 'No timetable found. Please generate a timetable first.' });
		}

		console.log('Found timetable, checking teacher schedule for ID:', id);
		const teacherSchedule = timetable.teacherSchedule[id];
		if (!teacherSchedule) {
			console.log('Teacher schedule not found for ID:', id);
			console.log('Available teacher schedules:', Object.keys(timetable.teacherSchedule));
			return res.status(404).json({ error: 'Teacher not found in timetable' });
		}

		// Get teacher details
		const teacher = await Teacher.findOne({ id: Number(id) });
		if (!teacher) {
			console.log('Teacher not found in database for ID:', id);
			return res.status(404).json({ error: 'Teacher not found' });
		}

		console.log('Found teacher:', teacher.name);

		// Format the response
		const formattedTimetable = {
			teacher: {
				id: teacher.id,
				name: teacher.name,
				weeklyPeriods: teacher.weeklyPeriods,
				dailyPeriods: teacher.dailyPeriods
			},
			config: timetable.schoolConfig,
			schedule: {}
		};

		// Convert schedule to array format for easier frontend consumption
		const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
			const day = days[dayIndex];
			formattedTimetable.schedule[day] = [];

			const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, dayIndex + 1);
			for (let period = 1; period <= dayPeriods; period++) {
				const periodData = teacherSchedule[dayIndex + 1] && teacherSchedule[dayIndex + 1][period];
				formattedTimetable.schedule[day].push({
					period: period,
					class: periodData ? periodData.className : null,
					subject: periodData ? periodData.subject : null,
					classId: periodData ? periodData.classId : null,
					isFree: !periodData
				});
			}
		}

		console.log('Formatted timetable for teacher:', formattedTimetable.teacher.name);
		return res.json(formattedTimetable);

	} catch (error) {
		console.error('Error fetching teacher timetable:', error);
		return res.status(500).json({ error: 'Failed to fetch teacher timetable' });
	}
});

// Get all teacher timetables
router.get('/teachers', async (req, res) => {
	try {
		const timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });

		if (!timetable) {
			return res.status(404).json({ error: 'No timetable found. Please generate a timetable first.' });
		}

		// Get all teachers
		const teachers = await Teacher.find({}).sort({ id: 1 }).lean();

		const teacherTimetables = {};

		for (const teacher of teachers) {
			const teacherSchedule = timetable.teacherSchedule[teacher.id];
			if (teacherSchedule) {
				teacherTimetables[teacher.id] = {
					teacher: {
						id: teacher.id,
						name: teacher.name,
						weeklyPeriods: teacher.weeklyPeriods,
						dailyPeriods: teacher.dailyPeriods
					},
					schedule: teacherSchedule
				};
			}
		}

		return res.json({
			config: timetable.schoolConfig,
			teacherTimetables
		});

	} catch (error) {
		console.error('Error fetching teacher timetables:', error);
		return res.status(500).json({ error: 'Failed to fetch teacher timetables' });
	}
});

// Helper: Convert day number to name
const getDayName = (dayNum) => {
	const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	return dayNames[dayNum - 1] || `Day ${dayNum}`;
};

// GET timetable history
router.get('/history', async (req, res) => {
	try {
		const timetables = await Timetable.find({}).sort({ generatedAt: -1 }).lean();
		const formatted = timetables.map(t => ({
			id: t._id,
			generatedAt: t.generatedAt || t.createdAt,
			generationStatus: t.generationStatus,
			isActive: t.isActive || false,
			label: t.label || `Schedule generated on ${new Date(t.generatedAt || t.createdAt).toLocaleString()}`,
			stats: t.stats || {},
			hasManualEdits: t.hasManualEdits || false
		}));
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching timetable history:', error);
		return res.status(500).json({ error: 'Failed to fetch timetable history' });
	}
});

// ACTIVATE a historical timetable version
router.put('/:id/active', async (req, res) => {
	try {
		const { id } = req.params;
		
		// Load the timetable to verify it exists
		const target = await Timetable.findById(id);
		if (!target) {
			return res.status(404).json({ error: 'Timetable not found' });
		}

		// Deactivate all first
		await Timetable.updateMany({}, { isActive: false, generationStatus: 'draft' });

		// Activate target, set status to completed, and touch generatedAt to make it newest
		await Timetable.findByIdAndUpdate(id, { 
			isActive: true, 
			generationStatus: 'completed',
			generatedAt: new Date()
		});

		return res.json({ success: true, message: 'Timetable activated successfully' });
	} catch (error) {
		console.error('Error activating timetable:', error);
		return res.status(500).json({ error: 'Failed to activate timetable' });
	}
});

// RENAME a generated timetable version
router.put('/:id/rename', async (req, res) => {
	try {
		const { id } = req.params;
		const { label } = req.body;

		if (!label) {
			return res.status(400).json({ error: 'Label is required' });
		}

		const target = await Timetable.findByIdAndUpdate(id, { label });
		if (!target) {
			return res.status(404).json({ error: 'Timetable not found' });
		}

		return res.json({ success: true, message: 'Timetable renamed successfully' });
	} catch (error) {
		console.error('Error renaming timetable:', error);
		return res.status(500).json({ error: 'Failed to rename timetable' });
	}
});

// DELETE a specific timetable
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const target = await Timetable.findByIdAndDelete(id);
		if (!target) {
			return res.status(404).json({ error: 'Timetable not found' });
		}

		return res.json({ success: true, message: 'Timetable deleted successfully' });
	} catch (error) {
		console.error('Error deleting timetable:', error);
		return res.status(500).json({ error: 'Failed to delete timetable' });
	}
});

// Validate a cell change before saving
router.post('/validate-cell', async (req, res) => {
	try {
		const { timetableId, classId, day, period, subjectName, teacherId, teacherName } = req.body;
		
		const dayNum = Number(day);
		const periodNum = Number(period);

		let timetable;
		if (timetableId) {
			timetable = await Timetable.findById(timetableId);
		} else {
			timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });
		}

		if (!timetable) {
			return res.status(404).json({ error: 'Timetable not found' });
		}

		const timetableObj = timetable.timetable;
		const warnings = [];

		if (!teacherId || subjectName === 'Free') {
			return res.json({ success: true, warnings: [] });
		}

		const tId = teacherId.toString();

		// 1. Double-booking check
		const classesList = await Class.find({}).lean();
		for (const otherCls of classesList) {
			const otherCId = otherCls._id.toString();
			if (otherCId === classId) continue;

			const otherCell = timetableObj[otherCId]?.[dayNum]?.[periodNum];
			if (otherCell && otherCell.teacherId && otherCell.teacherId.toString() === tId) {
				warnings.push(`Teacher "${teacherName}" is already scheduled in Class ${otherCls.full_name} during Period ${periodNum} on ${getDayName(dayNum)}.`);
			}
		}
			// 2. Daily max limits check
		const teacher = await Teacher.findOne({ id: Number(teacherId) });
		if (teacher && teacher.dailyPeriods) {
			let dailyPeriodsCount = 0;
			const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, dayNum);
			for (let p = 1; p <= dayPeriods; p++) {
				let isAssigned = false;
				for (const checkCls of classesList) {
					const checkCId = checkCls._id.toString();
					// Exclude the currently edited slot to avoid double-counting if we're just re-assigning the same slot
					if (checkCId === classId && p === periodNum) continue;

					const checkCell = timetableObj[checkCId]?.[dayNum]?.[p];
					if (checkCell && checkCell.teacherId && checkCell.teacherId.toString() === tId) {
						isAssigned = true;
						break;
					}
				}
				if (isAssigned) dailyPeriodsCount++;
			}

			// Add 1 for the proposed slot
			dailyPeriodsCount++;

			if (dailyPeriodsCount > teacher.dailyPeriods) {
				warnings.push(`Assigning this period will result in ${dailyPeriodsCount} daily periods for "${teacherName}" on ${getDayName(dayNum)}, which exceeds their daily limit of ${teacher.dailyPeriods}.`);
			}
		}

		// 3. Consecutive teaching periods check (max 2 consecutive)
		const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, dayNum);
		const recessAfter = timetable.schoolConfig.recessAfterPeriod || 4;
		
		// Map all active periods for this teacher on this day
		const simulatedTeacherSchedule = {};
		for (const checkCls of classesList) {
			const checkCId = checkCls._id.toString();
			for (let p = 1; p <= dayPeriods; p++) {
				// If checking the currently edited slot, use the proposed teacher assignment
				if (checkCId === classId && p === periodNum) {
					simulatedTeacherSchedule[p] = true;
					continue;
				}
				
				const checkCell = timetableObj[checkCId]?.[dayNum]?.[p];
				if (checkCell && checkCell.teacherId && checkCell.teacherId.toString() === tId) {
					simulatedTeacherSchedule[p] = true;
				}
			}
		}
		
		let continuousCount = 0;
		let maxContinuous = 0;
		for (let p = 1; p <= dayPeriods; p++) {
			// Recess boundary reset
			if (recessAfter && p === recessAfter + 1) {
				continuousCount = 0;
			}
			
			if (simulatedTeacherSchedule[p]) {
				continuousCount++;
				if (continuousCount > maxContinuous) {
					maxContinuous = continuousCount;
				}
			} else {
				continuousCount = 0;
			}
		}
		
		if (maxContinuous > 2) {
			warnings.push(`Assigning this period will result in ${maxContinuous} consecutive teaching periods for "${teacherName}" on ${getDayName(dayNum)} without a break, which exceeds the strict limit of 2.`);
		}

		return res.json({
			success: true,
			hasWarnings: warnings.length > 0,
			warnings
		});

	} catch (error) {
		console.error('Error validating cell change:', error);
		return res.status(500).json({ error: 'Failed to validate cell change', details: error.message });
	}
});

// Update a timetable cell manually or perform a swap
router.put('/cell', async (req, res) => {
	try {
		const { timetableId, classId, day, period, subjectName, teacherId, teacherName, action, swapWithDay, swapWithPeriod } = req.body;
		
		const dayNum = Number(day);
		const periodNum = Number(period);

		let timetable;
		if (timetableId) {
			timetable = await Timetable.findById(timetableId);
		} else {
			timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });
		}

		if (!timetable) {
			return res.status(404).json({ error: 'Timetable not found' });
		}

		const classData = await Class.findById(classId);
		if (!classData) {
			return res.status(404).json({ error: 'Class not found' });
		}

		const timetableObj = timetable.timetable;
		const teacherScheduleObj = timetable.teacherSchedule;

		if (!timetableObj[classId]) {
			timetableObj[classId] = {};
		}
		if (!timetableObj[classId][dayNum]) {
			timetableObj[classId][dayNum] = {};
		}

		// Action 1: SWAP slots
		if (action === 'swap' && swapWithDay && swapWithPeriod) {
			const swapD = Number(swapWithDay);
			const swapP = Number(swapWithPeriod);

			if (!timetableObj[classId][swapD]) {
				timetableObj[classId][swapD] = {};
			}

			const cell1 = timetableObj[classId][dayNum][periodNum];
			const cell2 = timetableObj[classId][swapD][swapP];

			// Swap in timetable
			timetableObj[classId][dayNum][periodNum] = cell2 ? { ...cell2, isManualOverride: true } : null;
			timetableObj[classId][swapD][swapP] = cell1 ? { ...cell1, isManualOverride: true } : null;

			// Update teacher schedules
			if (cell1 && cell1.teacherId) {
				const tId = cell1.teacherId.toString();
				if (teacherScheduleObj[tId] && teacherScheduleObj[tId][dayNum]) {
					delete teacherScheduleObj[tId][dayNum][periodNum];
				}
				if (!teacherScheduleObj[tId]) teacherScheduleObj[tId] = {};
				if (!teacherScheduleObj[tId][swapD]) teacherScheduleObj[tId][swapD] = {};
				teacherScheduleObj[tId][swapD][swapP] = {
					classId,
					className: classData.full_name,
					subject: cell1.subject
				};
			}

			if (cell2 && cell2.teacherId) {
				const tId = cell2.teacherId.toString();
				if (teacherScheduleObj[tId] && teacherScheduleObj[tId][swapD]) {
					delete teacherScheduleObj[tId][swapD][swapP];
				}
				if (!teacherScheduleObj[tId]) teacherScheduleObj[tId] = {};
				if (!teacherScheduleObj[tId][dayNum]) teacherScheduleObj[tId][dayNum] = {};
				teacherScheduleObj[tId][dayNum][periodNum] = {
					classId,
					className: classData.full_name,
					subject: cell2.subject
				};
			}
		} 
		// Action 2: CLEAR slot -> replace with supervised coverage so class periods are never free.
		else if (action === 'clear' || subjectName === 'Free' || !subjectName) {
			const cell = timetableObj[classId][dayNum][periodNum];
			if (cell && cell.teacherId) {
				const tId = cell.teacherId.toString();
				if (teacherScheduleObj[tId] && teacherScheduleObj[tId][dayNum]) {
					delete teacherScheduleObj[tId][dayNum][periodNum];
				}
			}
			timetableObj[classId][dayNum][periodNum] = {
				...coverageSlot(),
				isManualOverride: true
			};
		} 
		// Action 3: EDIT cell
		else {
			const cell = timetableObj[classId][dayNum][periodNum];
			if (cell && cell.teacherId && cell.teacherId.toString() !== teacherId?.toString()) {
				const oldTId = cell.teacherId.toString();
				if (teacherScheduleObj[oldTId] && teacherScheduleObj[oldTId][dayNum]) {
					delete teacherScheduleObj[oldTId][dayNum][periodNum];
				}
			}

			timetableObj[classId][dayNum][periodNum] = {
				subject: subjectName,
				teacher: teacherName || 'Free',
				teacherId: teacherId ? Number(teacherId) : null,
				isManualOverride: true
			};

			if (teacherId) {
				const tId = teacherId.toString();
				if (!teacherScheduleObj[tId]) {
					teacherScheduleObj[tId] = {};
				}
				if (!teacherScheduleObj[tId][dayNum]) {
					teacherScheduleObj[tId][dayNum] = {};
				}
				teacherScheduleObj[tId][dayNum][periodNum] = {
					classId,
					className: classData.full_name,
					subject: subjectName
				};
			}
		}

		// Re-run global conflict detection
		const allConflicts = [];
		const classesList = await Class.find({}).lean();
		const teachersList = await Teacher.find({}).lean();

		const teacherMap = {};
		teachersList.forEach(t => {
			teacherMap[t.id.toString()] = t;
		});

		for (const cls of classesList) {
			const cId = cls._id.toString();
			const clsTimetable = timetableObj[cId];
			if (!clsTimetable) continue;

			for (let d = 1; d <= timetable.schoolConfig.daysPerWeek; d++) {
				const daySlots = clsTimetable[d];
				if (!daySlots) continue;

				const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, d);
				for (let p = 1; p <= dayPeriods; p++) {
					const cell = daySlots[p];
					if (!cell || !cell.teacherId) continue;

					cell.hasConflict = false;
					cell.conflictDescription = null;

					const tId = cell.teacherId.toString();

					// 1. Double-booking check
					for (const otherCls of classesList) {
						const otherCId = otherCls._id.toString();
						if (otherCId === cId) continue;

						const otherCell = timetableObj[otherCId]?.[d]?.[p];
						if (otherCell && otherCell.teacherId && otherCell.teacherId.toString() === tId) {
							cell.hasConflict = true;
							cell.conflictDescription = `Teacher "${cell.teacher}" is double-booked in ${otherCls.full_name}`;
							allConflicts.push({
								type: 'double_booking',
								description: `${cls.full_name} Period ${p} on ${getDayName(d)}: Teacher "${cell.teacher}" is also scheduled in ${otherCls.full_name}`,
								affectedClass: cls.full_name,
								affectedTeacher: cell.teacher,
								affectedPeriod: `${getDayName(d)} Period ${p}`
							});
							break;
						}
					}

					// 2. Daily max limits check
					const teacher = teacherMap[tId];
					if (teacher && teacher.dailyPeriods) {
						let dailyPeriodsCount = 0;
						const dayPeriods = getPeriodsForDayFromConfig(timetable.schoolConfig, d);
						for (let periodKey = 1; periodKey <= dayPeriods; periodKey++) {
							let isAssigned = false;
							for (const checkCls of classesList) {
								const checkCId = checkCls._id.toString();
								const checkCell = timetableObj[checkCId]?.[d]?.[periodKey];
								if (checkCell && checkCell.teacherId && checkCell.teacherId.toString() === tId) {
									isAssigned = true;
									break;
								}
							}
							if (isAssigned) dailyPeriodsCount++;
						}

						if (dailyPeriodsCount > teacher.dailyPeriods) {
							cell.hasConflict = true;
							cell.conflictDescription = cell.conflictDescription
								? `${cell.conflictDescription}. Exceeds daily max limit of ${teacher.dailyPeriods}`
								: `Exceeds daily max limit of ${teacher.dailyPeriods}`;
							allConflicts.push({
								type: 'daily_max_limit',
								description: `${cls.full_name} on ${getDayName(d)}: Teacher "${cell.teacher}" is scheduled for ${dailyPeriodsCount} periods, exceeding limit of ${teacher.dailyPeriods}`,
								affectedClass: cls.full_name,
								affectedTeacher: cell.teacher,
								affectedPeriod: getDayName(d)
							});
						}
					}

					// 3. Consecutive teaching periods check (max 2 consecutive)
					const recessAfter = timetable.schoolConfig.recessAfterPeriod || 4;
					const teacherScheduleMapForDay = {};
					for (const checkCls of classesList) {
						const checkCId = checkCls._id.toString();
						for (let periodKey = 1; periodKey <= dayPeriods; periodKey++) {
							const checkCell = timetableObj[checkCId]?.[d]?.[periodKey];
							if (checkCell && checkCell.teacherId && checkCell.teacherId.toString() === tId) {
								teacherScheduleMapForDay[periodKey] = true;
							}
						}
					}

					let currentContinuous = 0;
					let teacherMaxContinuous = 0;
					for (let periodKey = 1; periodKey <= dayPeriods; periodKey++) {
						if (recessAfter && periodKey === recessAfter + 1) {
							currentContinuous = 0;
						}
						if (teacherScheduleMapForDay[periodKey]) {
							currentContinuous++;
							if (currentContinuous > teacherMaxContinuous) {
								teacherMaxContinuous = currentContinuous;
							}
						} else {
							currentContinuous = 0;
						}
					}

					if (teacherMaxContinuous > 2) {
						cell.hasConflict = true;
						cell.conflictDescription = cell.conflictDescription
							? `${cell.conflictDescription}. Has ${teacherMaxContinuous} consecutive teaching periods without a break`
							: `Has ${teacherMaxContinuous} consecutive teaching periods without a break`;
						
						const conflictDescriptionString = `${cls.full_name} on ${getDayName(d)}: Teacher "${cell.teacher}" is scheduled for ${teacherMaxContinuous} consecutive periods without a break, exceeding strict limit of 2`;
						if (!allConflicts.some(c => c.description === conflictDescriptionString)) {
							allConflicts.push({
								type: 'consecutive_limit',
								description: conflictDescriptionString,
								affectedClass: cls.full_name,
								affectedTeacher: cell.teacher,
								affectedPeriod: `${getDayName(d)}`
							});
						}
					}
				}
			}
		}

		// Update stats
		const currentStats = timetable.stats || {};
		timetable.stats = {
			...currentStats,
			conflicts: allConflicts.length,
			conflictDetails: allConflicts
		};

		// Stringify before saving
		const payload = {
			timetable: JSON.stringify(timetableObj),
			teacherSchedule: JSON.stringify(teacherScheduleObj),
			stats: JSON.stringify(timetable.stats),
			hasManualEdits: true
		};

		await Timetable.findByIdAndUpdate(timetable._id, payload);

		return res.json({
			success: true,
			message: 'Timetable cell updated successfully',
			stats: timetable.stats,
			conflictsCount: allConflicts.length,
			conflicts: allConflicts,
			timetable: timetableObj
		});

	} catch (error) {
		console.error('Error updating timetable cell:', error);
		return res.status(500).json({ error: 'Failed to update timetable cell', details: error.message });
	}
});

export default router;







