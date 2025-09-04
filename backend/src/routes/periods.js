import { Router } from 'express';

// Simple in-memory store for now
let periodsStore = [];

const router = Router();

router.post('/', (req, res) => {
	periodsStore = Array.isArray(req.body) ? req.body : [];
	return res.json({ success: true });
});

router.get('/', (_req, res) => {
	return res.json(periodsStore);
});

export default router;







