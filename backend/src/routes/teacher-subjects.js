import { Router } from 'express';
import TeacherSubject from '../models/TeacherSubject.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';

const router = Router();

// Get all teacher-subject mappings
router.get('/', async (req, res) => {
	try {
		const mappings = await TeacherSubject.find({})
			.populate('subjectId', 'subject_name standard weekly_periods')
			.sort({ teacherName: 1, standard: 1, subjectName: 1 })
			.lean();
		
		const formatted = mappings.map(m => ({
			id: m._id,
			teacherId: m.teacherId,
			teacherName: m.teacherName,
			subjectId: m.subjectId._id,
			subjectName: m.subjectName,
			standard: m.standard,
			weeklyPeriods: m.subjectId.weekly_periods,
			preferredPeriods: m.preferredPeriods || [],
			avoidPeriods: m.avoidPeriods || [],
			consecutivePeriods: m.consecutivePeriods || false
		}));
		
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching teacher-subject mappings:', error);
		return res.status(500).json({ error: 'Failed to fetch teacher-subject mappings' });
	}
});

// Get mappings for a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
	try {
		const { teacherId } = req.params;
		const mappings = await TeacherSubject.find({ teacherId: parseInt(teacherId) })
			.populate('subjectId', 'subject_name standard weekly_periods')
			.sort({ standard: 1, subjectName: 1 })
			.lean();
		
		const formatted = mappings.map(m => ({
			id: m._id,
			teacherId: m.teacherId,
			teacherName: m.teacherName,
			subjectId: m.subjectId._id,
			subjectName: m.subjectName,
			standard: m.standard,
			weeklyPeriods: m.subjectId.weekly_periods,
			preferredPeriods: m.preferredPeriods || [],
			avoidPeriods: m.avoidPeriods || [],
			consecutivePeriods: m.consecutivePeriods || false
		}));
		
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching teacher mappings:', error);
		return res.status(500).json({ error: 'Failed to fetch teacher mappings' });
	}
});

// Get mappings for a specific subject
router.get('/subject/:subjectId', async (req, res) => {
	try {
		const { subjectId } = req.params;
		const mappings = await TeacherSubject.find({ subjectId })
			.populate('subjectId', 'subject_name standard weekly_periods')
			.sort({ teacherName: 1 })
			.lean();
		
		const formatted = mappings.map(m => ({
			id: m._id,
			teacherId: m.teacherId,
			teacherName: m.teacherName,
			subjectId: m.subjectId._id,
			subjectName: m.subjectName,
			standard: m.standard,
			weeklyPeriods: m.subjectId.weekly_periods,
			preferredPeriods: m.preferredPeriods || [],
			avoidPeriods: m.avoidPeriods || [],
			consecutivePeriods: m.consecutivePeriods || false
		}));
		
		return res.json(formatted);
	} catch (error) {
		console.error('Error fetching subject mappings:', error);
		return res.status(500).json({ error: 'Failed to fetch subject mappings' });
	}
});

// Create teacher-subject mapping
router.post('/', async (req, res) => {
	try {
		const { teacherId, subjectId, preferredPeriods, avoidPeriods, consecutivePeriods } = req.body;
		
		// Validate teacher exists - handle both numeric and string IDs
		let teacher;
		if (typeof teacherId === 'number' || !isNaN(teacherId)) {
			teacher = await Teacher.findOne({ id: parseInt(teacherId) });
		} else {
			teacher = await Teacher.findOne({ id: teacherId });
		}
		
		if (!teacher) {
			return res.status(400).json({ error: `Teacher with ID ${teacherId} not found` });
		}
		
		// Validate subject exists
		const subject = await Subject.findById(subjectId);
		if (!subject) {
			return res.status(400).json({ error: 'Subject not found' });
		}
		
		// Create mapping
		const mapping = await TeacherSubject.create({
			teacherId,
			teacherName: teacher.name,
			subjectId,
			subjectName: subject.subject_name,
			standard: subject.standard,
			preferredPeriods: preferredPeriods || [],
			avoidPeriods: avoidPeriods || [],
			consecutivePeriods: consecutivePeriods || false
		});
		
		return res.json({
			id: mapping._id,
			teacherId: mapping.teacherId,
			teacherName: mapping.teacherName,
			subjectId: mapping.subjectId,
			subjectName: mapping.subjectName,
			standard: mapping.standard,
			preferredPeriods: mapping.preferredPeriods,
			avoidPeriods: mapping.avoidPeriods,
			consecutivePeriods: mapping.consecutivePeriods
		});
		
	} catch (error) {
		if (error.code === 11000) {
			return res.status(400).json({ error: 'This teacher-subject combination already exists' });
		}
		console.error('Error creating teacher-subject mapping:', error);
		return res.status(500).json({ error: 'Failed to create teacher-subject mapping' });
	}
});

// Update teacher-subject mapping
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { preferredPeriods, avoidPeriods, consecutivePeriods } = req.body;
		
		const mapping = await TeacherSubject.findByIdAndUpdate(
			id,
			{
				preferredPeriods: preferredPeriods || [],
				avoidPeriods: avoidPeriods || [],
				consecutivePeriods: consecutivePeriods || false
			},
			{ new: true }
		);
		
		if (!mapping) {
			return res.status(404).json({ error: 'Mapping not found' });
		}
		
		return res.json({
			id: mapping._id,
			teacherId: mapping.teacherId,
			teacherName: mapping.teacherName,
			subjectId: mapping.subjectId,
			subjectName: mapping.subjectName,
			standard: mapping.standard,
			preferredPeriods: mapping.preferredPeriods,
			avoidPeriods: mapping.avoidPeriods,
			consecutivePeriods: mapping.consecutivePeriods
		});
		
	} catch (error) {
		console.error('Error updating teacher-subject mapping:', error);
		return res.status(500).json({ error: 'Failed to update teacher-subject mapping' });
	}
});

// Delete teacher-subject mapping
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		
		const mapping = await TeacherSubject.findByIdAndDelete(id);
		if (!mapping) {
			return res.status(404).json({ error: 'Mapping not found' });
		}
		
		return res.json({ success: true });
		
	} catch (error) {
		console.error('Error deleting teacher-subject mapping:', error);
		return res.status(500).json({ error: 'Failed to delete teacher-subject mapping' });
	}
});

// Bulk create teacher-subject mappings
router.post('/bulk', async (req, res) => {
	try {
		const mappings = req.body || [];
		const results = [];
		
		for (const mappingData of mappings) {
			const { teacherId, subjectId, preferredPeriods, avoidPeriods, consecutivePeriods } = mappingData;
			
			try {
				// Validate teacher exists - handle both numeric and string IDs
				let teacher;
				if (typeof teacherId === 'number' || !isNaN(teacherId)) {
					teacher = await Teacher.findOne({ id: parseInt(teacherId) });
				} else {
					teacher = await Teacher.findOne({ id: teacherId });
				}
				
				if (!teacher) {
					results.push({ error: `Teacher with ID ${teacherId} not found` });
					continue;
				}
				
				// Validate subject exists
				const subject = await Subject.findById(subjectId);
				if (!subject) {
					results.push({ error: `Subject with ID ${subjectId} not found` });
					continue;
				}
				
				// Create mapping
				const mapping = await TeacherSubject.create({
					teacherId,
					teacherName: teacher.name,
					subjectId,
					subjectName: subject.subject_name,
					standard: subject.standard,
					preferredPeriods: preferredPeriods || [],
					avoidPeriods: avoidPeriods || [],
					consecutivePeriods: consecutivePeriods || false
				});
				
				results.push({
					success: true,
					id: mapping._id,
					teacherId: mapping.teacherId,
					teacherName: mapping.teacherName,
					subjectName: mapping.subjectName,
					standard: mapping.standard
				});
				
			} catch (error) {
				if (error.code === 11000) {
					results.push({ error: `Teacher-subject combination already exists for teacher ${teacherId} and subject ${subjectId}` });
				} else {
					results.push({ error: `Failed to create mapping: ${error.message}` });
				}
			}
		}
		
		return res.json({ results });
		
	} catch (error) {
		console.error('Error creating bulk teacher-subject mappings:', error);
		return res.status(500).json({ error: 'Failed to create bulk teacher-subject mappings' });
	}
});

export default router;
