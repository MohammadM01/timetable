import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

// Seed default admin if none exists
router.post('/seed-admin', async (_req, res) => {
	try {
		const existing = await User.findOne({ username: 'admin' });
		if (existing) return res.json({ message: 'Admin already exists' });
		const passwordHash = await bcrypt.hash('admin', 10);
		const user = await User.create({ username: 'admin', passwordHash, role: 'admin' });
		return res.json({ message: 'Admin seeded', user: { id: user._id, username: user.username } });
	} catch (e) {
		return res.status(500).json({ error: 'Failed to seed admin' });
	}
});

router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body || {};
		const user = await User.findOne({ username });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await user.verifyPassword(password || '');
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = signToken(user);
		return res.json({ success: true, token, user: { id: user._id, username: user.username } });
	} catch (e) {
		return res.status(500).json({ error: 'Login failed' });
	}
});

export default router;






