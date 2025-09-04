import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectToDatabase } from './utils/db.js';
import { authOptional } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import teacherRoutes from './routes/teachers.js';
import subjectRoutes from './routes/subjects.js';
import classRoutes from './routes/classes.js';
import periodRoutes from './routes/periods.js';
import timetableRoutes from './routes/timetable.js';
import principalRoutes from './routes/principals.js';
import teacherSubjectRoutes from './routes/teacher-subjects.js';

dotenv.config();

const app = express();

app.use(cors({
	origin: [
		process.env.ORIGIN || 'http://localhost:5173',
		'http://localhost:5174'
	],
	credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', authOptional, teacherRoutes);
app.use('/api/subjects', authOptional, subjectRoutes);
app.use('/api/classes', authOptional, classRoutes);
app.use('/api/periods', authOptional, periodRoutes);
app.use('/api/timetable', authOptional, timetableRoutes);
app.use('/api/principals', authOptional, principalRoutes);
app.use('/api/teacher-subjects', authOptional, teacherSubjectRoutes);

const port = process.env.PORT || 5000;

connectToDatabase()
	.then(() => {
		app.listen(port, () => {
			console.log(`Server listening on port ${port}`);
		});
	})
	.catch((err) => {
		console.error('Failed to connect to DB:', err);
		process.exit(1);
	});







