import { Router } from 'express';
import Subject from '../models/Subject.js';

const router = Router();

router.get('/', async (_req, res) => {
	try {
		let subs = await Subject.find({}).lean();
		// In-memory sort
		subs.sort((a, b) => {
			if (a.standard !== b.standard) return String(a.standard).localeCompare(String(b.standard), undefined, { numeric: true });
			return String(a.subject_name).localeCompare(String(b.subject_name));
		});
		return res.json(subs.map(s => ({ id: s._id.toString(), standard: s.standard, subject_name: s.subject_name, weekly_periods: s.weekly_periods, consecutive_periods: s.consecutive_periods })));
	} catch (e) {
		console.error('Error fetching subjects:', e);
		return res.status(500).json({ error: 'Failed to fetch subjects' });
	}
});

router.post('/', async (req, res) => {
	try {
		const payload = Array.isArray(req.body) ? req.body : [];
		await Subject.insertMany(payload.map(s => ({
			standard: s.standard,
			subject_name: s.subject_name,
			weekly_periods: Number(s.weekly_periods) || 0,
			consecutive_periods: Boolean(s.consecutive_periods)
		})), { ordered: false }).catch(() => { });
		return res.json({ success: true });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to save subjects' });
	}
});

router.post('/import', async (req, res) => {
	try {
		const { subjects } = req.body || {};
		if (!Array.isArray(subjects)) return res.status(400).json({ error: 'Invalid payload' });
		await Subject.insertMany(subjects.map(s => ({
			standard: s.standard,
			subject_name: s.subject_name,
			weekly_periods: Number(s.weekly_periods) || 0,
			consecutive_periods: Boolean(s.consecutive_periods)
		})), { ordered: false }).catch(() => { });

		let all = await Subject.find({}).lean();
		all.sort((a, b) => {
			if (a.standard !== b.standard) return String(a.standard).localeCompare(String(b.standard), undefined, { numeric: true });
			return String(a.subject_name).localeCompare(String(b.subject_name));
		});
		return res.json({ subjects: all.map(s => ({ id: s._id.toString(), standard: s.standard, subject_name: s.subject_name, weekly_periods: s.weekly_periods, consecutive_periods: s.consecutive_periods })) });
	} catch (e) {
		console.error('Error importing subjects:', e);
		return res.status(500).json({ error: 'Failed to import subjects' });
	}
});

router.post('/cleanup-duplicates', async (_req, res) => {
	try {
		const all = await Subject.aggregate([
			{ $sort: { createdAt: -1 } },
			{ $group: { _id: { standard: '$standard', subject_name: '$subject_name' }, ids: { $push: '$_id' }, keep: { $first: '$_id' } } }
		]);
		const toDelete = all.flatMap(g => g.ids.filter(id => id.toString() !== g.keep.toString()));
		if (toDelete.length) await Subject.deleteMany({ _id: { $in: toDelete } });
		const remaining = await Subject.find({}).sort({ standard: 1, subject_name: 1 }).lean();
		return res.json({ subjects: remaining.map(s => ({ id: s._id.toString(), standard: s.standard, subject_name: s.subject_name, weekly_periods: s.weekly_periods, consecutive_periods: s.consecutive_periods })) });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to cleanup duplicates' });
	}
});

router.delete('/:id', async (req, res) => {
	try {
		await Subject.findByIdAndDelete(req.params.id);

		let remaining = await Subject.find({}).lean();
		remaining.sort((a, b) => {
			if (a.standard !== b.standard) return String(a.standard).localeCompare(String(b.standard), undefined, { numeric: true });
			return String(a.subject_name).localeCompare(String(b.subject_name));
		});
		return res.json({ subjects: remaining.map(s => ({ id: s._id.toString(), standard: s.standard, subject_name: s.subject_name, weekly_periods: s.weekly_periods, consecutive_periods: s.consecutive_periods })) });
	} catch (e) {
		console.error('Error deleting subject:', e);
		return res.status(400).json({ error: 'Failed to delete subject' });
	}
});

router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const update = {
			standard: req.body.standard,
			subject_name: req.body.subject_name,
			weekly_periods: Number(req.body.weekly_periods) || 0,
			consecutive_periods: Boolean(req.body.consecutive_periods)
		};
		const updated = await Subject.findByIdAndUpdate(id, update, { new: true });
		if (!updated) return res.status(404).json({ error: 'Not found' });
		return res.json({ subject: { id: updated._id.toString(), standard: updated.standard, subject_name: updated.subject_name, weekly_periods: updated.weekly_periods, consecutive_periods: updated.consecutive_periods } });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to update subject' });
	}
});

// Delete all subjects
router.delete('/all', async (req, res) => {
	try {
		const result = await Subject.deleteMany({});
		return res.json({
			success: true,
			message: `Deleted ${result.deletedCount} subjects`,
			deletedCount: result.deletedCount
		});
	} catch (e) {
		return res.status(500).json({ error: 'Failed to delete all subjects' });
	}
});

export default router;






