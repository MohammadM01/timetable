import { Router } from 'express';
import Principal from '../models/Principal.js';

const router = Router();

// Get principal list (first used by context)
router.get('/', async (_req, res) => {
	try {
		const principals = await Principal.find({}).lean();
		const list = principals.map(p => ({ id: p._id.toString(), name: p.name, weekly_periods: p.weekly_periods, daily_max_periods: p.daily_max_periods }));
		return res.json(list);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch principal' });
	}
});

// Create principal (used by context as alternative path)
router.post('/', async (req, res) => {
	try {
		const { name, weeklyPeriods, dailyPeriods } = req.body || {};
		await Principal.deleteMany({});
		const created = await Principal.create({ name, weekly_periods: Number(weeklyPeriods) || 0, daily_max_periods: Number(dailyPeriods) || 0 });
		return res.json({ id: created._id.toString() });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to save principal' });
	}
});

export default router;






