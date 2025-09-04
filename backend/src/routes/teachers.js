import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Teacher from '../models/Teacher.js';
import Counter from '../models/Counter.js';
import Principal from '../models/Principal.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all teachers (excluding principal)
router.get('/', async (_req, res) => {
	try {
		const [teachers, principal] = await Promise.all([
			Teacher.find({}).sort({ name: 1 }).lean(),
			Principal.findOne({}).lean()
		]);
		const formatted = teachers.map((t) => ({ id: t.id, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods }));
		if (principal) {
			const principalRow = {
				id: 'principal',
				name: principal.name,
				weeklyPeriods: principal.weekly_periods,
				dailyPeriods: principal.daily_max_periods
			};
			// Place principal first. If a teacher with same name exists, do not duplicate.
			const exists = formatted.some(t => (t.name || '').toLowerCase() === (principalRow.name || '').toLowerCase());
			const list = exists ? formatted : [principalRow, ...formatted];
			return res.json(list);
		}
		return res.json(formatted);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch teachers' });
	}
});

// Create multiple teachers
router.post('/', async (req, res) => {
	try {
		const payload = Array.isArray(req.body) ? req.body : [];
		const results = [];
		for (const t of payload) {
			const counter = await Counter.findOneAndUpdate({ key: 'teacher' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
			const doc = await Teacher.findOneAndUpdate(
				{ name: t.name },
				{ $setOnInsert: { id: counter.seq, name: t.name, weeklyPeriods: Number(t.weeklyPeriods) || 0, dailyPeriods: Number(t.dailyPeriods) || 0 } },
				{ upsert: true, new: true }
			);
			results.push(doc);
		}
		return res.json({ success: true });
	} catch (e) {
		return res.json({ success: true });
	}
});

// Create single teacher
router.post('/single', async (req, res) => {
	try {
		const t = req.body || {};
		const counter = await Counter.findOneAndUpdate({ key: 'teacher' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
		const doc = await Teacher.create({ id: counter.seq, name: t.name, weeklyPeriods: Number(t.weeklyPeriods) || 0, dailyPeriods: Number(t.dailyPeriods) || 0 });
		return res.json({ id: doc.id });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to add teacher' });
	}
});

// Update teacher
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, weeklyPeriods, dailyPeriods } = req.body;
		const updated = await Teacher.findOneAndUpdate({ id: Number(id) }, { name, weeklyPeriods, dailyPeriods }, { new: true });
		if (!updated) return res.status(404).json({ error: 'Not found' });
		return res.json({ id: updated.id, name: updated.name, weeklyPeriods: updated.weeklyPeriods, dailyPeriods: updated.dailyPeriods });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to update teacher' });
	}
});

// Delete teacher
router.delete('/:id', async (req, res) => {
	try {
		await Teacher.findOneAndDelete({ id: Number(req.params.id) });
		return res.json({ success: true });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to delete teacher' });
	}
});

// Upload teachers via Excel
router.post('/upload', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
		const workbook = XLSX.read(req.file.buffer);
		const sheetName = workbook.SheetNames[0];
		const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
		const teachers = sheet.map((row) => ({
			name: (row.Name || row.name || '').toString().trim(),
			weeklyPeriods: Number(row['Weekly Periods'] || row.weeklyPeriods || 0),
			dailyPeriods: Number(row['Daily Periods'] || row.dailyPeriods || 0)
		})).filter(t => t.name);
		if (teachers.length === 0) return res.status(400).json({ error: 'No valid rows' });
		for (const t of teachers) {
			const exists = await Teacher.findOne({ name: new RegExp('^' + t.name + '$', 'i') });
			if (exists) continue;
			const counter = await Counter.findOneAndUpdate({ key: 'teacher' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
			await Teacher.create({ id: counter.seq, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods });
		}
		const all = await Teacher.find({}).sort({ name: 1 }).lean();
		return res.json(all.map(t => ({ id: t.id, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods })));
	} catch (e) {
		return res.status(500).json({ error: 'Failed to upload teachers' });
	}
});

// Principal endpoints (compat with api.js)
router.post('/principal', async (req, res) => {
	try {
		const { name, weeklyPeriods, dailyPeriods } = req.body || {};
		await Principal.deleteMany({});
		const principal = await Principal.create({ name, weekly_periods: Number(weeklyPeriods) || 0, daily_max_periods: Number(dailyPeriods) || 0 });
		// If principal exists as a teacher, remove
		await Teacher.deleteOne({ name: new RegExp('^' + name + '$', 'i') });
		return res.json({ message: 'Principal saved' });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to save principal' });
	}
});

router.post('/principal/update-periods', async (req, res) => {
	try {
		const { weeklyPeriods, dailyPeriods } = req.body || {};
		const updated = await Principal.findOneAndUpdate({}, { weekly_periods: Number(weeklyPeriods) || 0, daily_max_periods: Number(dailyPeriods) || 0 }, { new: true });
		return res.json({ principal: updated });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to update principal periods' });
	}
});

router.delete('/principal/delete', async (_req, res) => {
	try {
		await Principal.deleteMany({});
		return res.json({ message: 'Principal deleted' });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to delete principal' });
	}
});

export default router;


