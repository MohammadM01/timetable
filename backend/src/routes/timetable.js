import { Router } from 'express';
import Timetable from '../models/Timetable.js';
import TimetableGenerator from '../utils/timetableGenerator.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';

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
		
		return res.json({ 
			success: true, 
			message: `Timetable generated successfully for ${targetClasses.length} class(es)`,
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
			
			for (let period = 1; period <= timetable.schoolConfig.periodsPerDay; period++) {
				const slot = classTimetable[day] && classTimetable[day][period];
				formattedTimetable.schedule[dayName][`Period ${period}`] = slot || {
					subject: 'Free',
					teacher: 'Free',
					teacherId: null
				};
			}
		}

		return res.json(formattedTimetable);
		
	} catch (error) {
		console.error('Error fetching class timetable:', error);
		return res.status(500).json({ error: 'Failed to fetch class timetable' });
	}
});

// Get teacher timetable
router.get('/teacher/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const teacherId = parseInt(id);
		
		const timetable = await Timetable.findOne({ generationStatus: 'completed' }).sort({ generatedAt: -1 });
		
		if (!timetable) {
			return res.status(404).json({ error: 'No timetable found. Please generate a timetable first.' });
		}

		const teacherSchedule = timetable.teacherSchedule[teacherId];
		if (!teacherSchedule) {
			return res.status(404).json({ error: 'Teacher not found in timetable' });
		}

		// Get teacher details
		const teacher = await Teacher.findOne({ id: teacherId });
		if (!teacher) {
			return res.status(404).json({ error: 'Teacher not found' });
		}

		// Format the response
		const formattedSchedule = {
			teacher: {
				id: teacher.id,
				name: teacher.name,
				weeklyPeriods: teacher.weeklyPeriods,
				dailyPeriods: teacher.dailyPeriods
			},
			config: timetable.schoolConfig,
			schedule: {}
		};

		// Convert to day-wise format
		const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		for (let day = 1; day <= timetable.schoolConfig.daysPerWeek; day++) {
			const dayName = dayNames[day - 1] || `Day ${day}`;
			formattedSchedule.schedule[dayName] = {};
			
			for (let period = 1; period <= timetable.schoolConfig.periodsPerDay; period++) {
				const slot = teacherSchedule[day] && teacherSchedule[day][period];
				formattedSchedule.schedule[dayName][`Period ${period}`] = slot || {
					classId: null,
					className: 'Free',
					subject: 'Free'
				};
			}
		}

		return res.json(formattedSchedule);
		
	} catch (error) {
		console.error('Error fetching teacher timetable:', error);
		return res.status(500).json({ error: 'Failed to fetch teacher timetable' });
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
			
			for (let period = 1; period <= timetable.schoolConfig.periodsPerDay; period++) {
				schoolTimetable.overview[dayName][`Period ${period}`] = {};
				
				// Get all classes for this period
				for (const classData of classes) {
					const classTimetable = timetable.timetable[classData._id];
					const slot = classTimetable && classTimetable[day] && classTimetable[day][period];
					
					schoolTimetable.overview[dayName][`Period ${period}`][classData.full_name] = slot || {
						subject: 'Free',
						teacher: 'Free',
						teacherId: null
					};
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
			subjectName: new RegExp(subjectName, 'i') 
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
			
			for (let period = 1; period <= timetable.schoolConfig.periodsPerDay; period++) {
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

export default router;







