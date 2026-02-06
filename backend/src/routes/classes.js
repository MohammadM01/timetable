import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Counter from '../models/Counter.js';
import Timetable from '../models/Timetable.js';
import { escapeRegex } from '../utils/helpers.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all classes
router.get('/', async (_req, res) => {
	try {
		const classes = await Class.find({}).sort({ standard: 1, division: 1 }).lean();
		const formatted = classes.map((c) => ({
			id: c._id,
			standard: c.standard,
			division: c.division,
			full_name: c.full_name
		}));
		return res.json(formatted);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch classes' });
	}
});

// Create multiple classes
router.post('/', async (req, res) => {
	try {
		const payload = Array.isArray(req.body) ? req.body : [];
		const results = [];
		for (const c of payload) {
			const doc = await Class.findOneAndUpdate(
				{ standard: c.standard, division: c.division },
				{
					$setOnInsert: {
						standard: c.standard,
						division: c.division,
						full_name: c.full_name || `${c.standard} ${c.division}`
					}
				},
				{ upsert: true, new: true }
			);
			results.push(doc);
		}
		return res.json({ success: true });
	} catch (e) {
		return res.json({ success: true });
	}
});

// Create single class
router.post('/single', async (req, res) => {
	try {
		const c = req.body || {};
		const doc = await Class.create({
			standard: c.standard,
			division: c.division,
			full_name: c.full_name || `${c.standard} ${c.division}`
		});
		return res.json({ id: doc._id });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to add class' });
	}
});

// Update class
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { standard, division, full_name } = req.body;
		const updated = await Class.findByIdAndUpdate(
			id,
			{ standard, division, full_name: full_name || `${standard} ${division}` },
			{ new: true }
		);
		if (!updated) return res.status(404).json({ error: 'Not found' });
		return res.json({
			id: updated._id,
			standard: updated.standard,
			division: updated.division,
			full_name: updated.full_name
		});
	} catch (e) {
		return res.status(400).json({ error: 'Failed to update class' });
	}
});

// Delete all classes
router.delete('/all', async (req, res) => {
	try {
		const result = await Class.deleteMany({});

		// Clean up all timetable data since all classes are deleted
		await Timetable.deleteMany({});

		return res.json({
			success: true,
			message: `Deleted ${result.deletedCount} classes and all timetable data`,
			deletedCount: result.deletedCount
		});
	} catch (e) {
		console.error('Error deleting all classes:', e);
		return res.status(500).json({ error: 'Failed to delete all classes' });
	}
});

// Delete class
router.delete('/:id', async (req, res) => {
	try {
		const classId = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(classId)) {
			return res.status(400).json({ error: 'Invalid class id' });
		}

		// Delete the class
		const deletedClass = await Class.findByIdAndDelete(classId);
		if (!deletedClass) {
			return res.status(404).json({ error: 'Class not found' });
		}

		// Clean up timetable references
		await Timetable.updateMany(
			{},
			{
				$unset: {
					[`timetable.${classId}`]: 1
				}
			}
		);

		// Clean up teacher schedule references to this class
		await Timetable.updateMany(
			{},
			{
				$unset: {
					[`teacherSchedule.${classId}`]: 1
				}
			}
		);

		// Also clean up any teacher schedules that reference this class
		const timetables = await Timetable.find({});
		for (const timetable of timetables) {
			let needsUpdate = false;
			const updatedTeacherSchedule = { ...timetable.teacherSchedule };

			// Remove class references from all teacher schedules
			for (const teacherId in updatedTeacherSchedule) {
				for (const day in updatedTeacherSchedule[teacherId]) {
					for (const period in updatedTeacherSchedule[teacherId][day]) {
						const slot = updatedTeacherSchedule[teacherId][day][period];
						if (slot && String(slot.classId) === String(classId)) {
							delete updatedTeacherSchedule[teacherId][day][period];
							needsUpdate = true;
						}
					}
				}
			}

			if (needsUpdate) {
				await Timetable.findByIdAndUpdate(timetable._id, {
					teacherSchedule: updatedTeacherSchedule
				});
			}
		}

		return res.json({ success: true, message: 'Class deleted successfully' });
	} catch (e) {
		console.error('Error deleting class:', e);
		return res.status(500).json({ error: 'Failed to delete class', details: e?.message });
	}
});

// Upload classes via Excel
router.post('/upload', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
		const workbook = XLSX.read(req.file.buffer);
		const sheetName = workbook.SheetNames[0];
		const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
		const classes = sheet.map((row) => ({
			standard: (row.Standard || row.standard || '').toString().trim(),
			division: (row.Division || row.division || '').toString().trim(),
			full_name: (row['Full Name'] || row.full_name || '').toString().trim()
		})).filter(c => c.standard && c.division);

		if (classes.length === 0) return res.status(400).json({ error: 'No valid rows' });

		for (const c of classes) {
			const exists = await Class.findOne({
				standard: new RegExp('^' + escapeRegex(c.standard) + '$', 'i'),
				division: new RegExp('^' + escapeRegex(c.division) + '$', 'i')
			});
			if (exists) continue;
			await Class.create({
				standard: c.standard,
				division: c.division,
				full_name: c.full_name || `${c.standard} ${c.division}`
			});
		}

		const all = await Class.find({}).sort({ standard: 1, division: 1 }).lean();
		return res.json(all.map(c => ({
			id: c._id,
			standard: c.standard,
			division: c.division,
			full_name: c.full_name
		})));
	} catch (e) {
		return res.status(500).json({ error: 'Failed to upload classes' });
	}
});

export default router;

