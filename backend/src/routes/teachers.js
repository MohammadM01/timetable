import { Router } from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Teacher from '../models/Teacher.js';
import Counter from '../models/Counter.js';
import Principal from '../models/Principal.js';
import { escapeRegex } from '../utils/helpers.js';

const getNextId = async () => {
	let counter = await Counter.findOneAndUpdate({ key: 'teacher' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
	const existing = await Teacher.findOne({ id: counter.seq });
	if (existing) {
		const last = await Teacher.findOne().sort({ id: -1 });
		const maxId = last ? last.id : 0;
		counter = await Counter.findOneAndUpdate({ key: 'teacher' }, { seq: maxId + 1 }, { upsert: true, new: true });
	}
	return counter.seq;
};

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Test Excel parsing without saving
router.post('/test-parse', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

		const workbook = XLSX.read(req.file.buffer);
		const sheetName = workbook.SheetNames[0];
		const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

		// Auto-detect column names
		let detectedColumns = {};
		if (sheet.length > 0) {
			const headers = Object.keys(sheet[0]);
			console.log('Test - Detected headers:', headers);

			const nameCol = headers.find(h =>
				h.toLowerCase().includes('name') ||
				h.toLowerCase().includes('teacher')
			);
			if (nameCol) detectedColumns.name = nameCol;

			const weeklyCol = headers.find(h =>
				h.toLowerCase().includes('weekly') &&
				(h.toLowerCase().includes('period') || h.toLowerCase().includes('periods'))
			);
			if (weeklyCol) detectedColumns.weekly = weeklyCol;

			const dailyCol = headers.find(h =>
				(h.toLowerCase().includes('daily') || h.toLowerCase().includes('max')) &&
				(h.toLowerCase().includes('period') || h.toLowerCase().includes('periods'))
			);
			if (dailyCol) detectedColumns.daily = dailyCol;
		}

		// Parse first 3 rows for testing
		const testResults = sheet.slice(0, 3).map((row, index) => {
			const name = row.Name || row.name || row.NAME || row['Teacher Name'] || row['teacher_name'] || row['TEACHER NAME'] || row['Name'] ||
				(detectedColumns.name ? row[detectedColumns.name] : '') || '';

			const weeklyPeriods = row['Weekly Periods'] || row.weeklyPeriods || row['WEEKLY PERIODS'] || row['weekly_periods'] ||
				row['Weekly'] || row.weekly || row['WEEKLY'] || row['Weekly Period'] || row['weekly_period'] ||
				row['Weekly Periods per Week'] || row['weekly_periods_per_week'] ||
				(detectedColumns.weekly ? row[detectedColumns.weekly] : null) || 0;

			const dailyPeriods = row['Daily Periods'] || row.dailyPeriods || row['DAILY PERIODS'] || row['daily_periods'] ||
				row['Daily'] || row.daily || row['DAILY'] || row['Daily Period'] || row['daily_period'] ||
				row['Daily Max Periods'] || row['daily_max_periods'] || row['Max Daily Periods'] || row['max_daily_periods'] ||
				row['Daily Maximum'] || row['daily_maximum'] || row['Max Periods'] || row['max_periods'] ||
				(detectedColumns.daily ? row[detectedColumns.daily] : null) || 0;

			return {
				rowIndex: index,
				rawRow: row,
				detectedColumns: detectedColumns,
				parsed: {
					name: name.toString().trim(),
					weeklyPeriods: Number(weeklyPeriods) || 0,
					dailyPeriods: Number(dailyPeriods) || 0
				}
			};
		});

		return res.json({
			headers: sheet.length > 0 ? Object.keys(sheet[0]) : [],
			detectedColumns: detectedColumns,
			testResults: testResults
		});
	} catch (e) {
		console.error('Test parse error:', e);
		return res.status(500).json({ error: 'Failed to parse Excel file', details: e.message });
	}
});

// Test endpoint to check teacher data
router.get('/test', async (_req, res) => {
	try {
		// Ensure all teachers have rowOrder (migration for existing data)
		await Teacher.updateMany({ rowOrder: { $exists: false } }, { $set: { rowOrder: 0 } });

		const teachers = await Teacher.find({}).sort({ rowOrder: 1, id: 1 }).lean();
		const principal = await Principal.findOne({}).lean();
		return res.json({
			teachers: teachers.map(t => ({ id: t.id, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods })),
			principal: principal ? { name: principal.name, weekly_periods: principal.weekly_periods, daily_max_periods: principal.daily_max_periods } : null
		});
	} catch (e) {
		return res.status(500).json({ error: 'Failed to fetch test data' });
	}
});

// Get all teachers (excluding principal)
router.get('/', async (_req, res) => {
	try {
		// First, ensure all teachers have rowOrder (migration for existing data)
		await Teacher.updateMany({ rowOrder: { $exists: false } }, { $set: { rowOrder: 0 } });

		const [teachers, principal] = await Promise.all([
			Teacher.find({}).sort({ rowOrder: 1, id: 1 }).lean(),
			Principal.findOne({}).lean()
		]);
		const formatted = teachers.map((t) => {
			console.log('Teacher data:', { id: t.id, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods });
			return { id: t.id, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods };
		});
		if (principal) {
			console.log('Principal data:', principal);
			const principalRow = {
				id: 'principal',
				name: principal.name,
				weeklyPeriods: principal.weekly_periods,
				dailyPeriods: principal.daily_max_periods
			};
			console.log('Formatted principal:', principalRow);
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
			const safeId = await getNextId();
			// For manual creation, use the counter as rowOrder to maintain sequence
			const doc = await Teacher.findOneAndUpdate(
				{ name: t.name },
				{ $setOnInsert: { id: safeId, rowOrder: safeId, name: t.name, weeklyPeriods: Number(t.weeklyPeriods) || 0, dailyPeriods: Number(t.dailyPeriods) || 0 } },
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
		const safeId = await getNextId();
		const doc = await Teacher.create({ id: safeId, rowOrder: safeId, name: t.name, weeklyPeriods: Number(t.weeklyPeriods) || 0, dailyPeriods: Number(t.dailyPeriods) || 0 });
		return res.json({ id: doc.id });
	} catch (e) {
		return res.status(400).json({ error: 'Failed to add teacher' });
	}
});

// Delete all teachers (excluding principal)
router.delete('/all', async (req, res) => {
	try {
		const result = await Teacher.deleteMany({});
		// Reset the counter
		await Counter.findOneAndUpdate({ key: 'teacher' }, { seq: 0 }, { upsert: true });
		return res.json({
			success: true,
			message: `Deleted ${result.deletedCount} teachers`,
			deletedCount: result.deletedCount
		});
	} catch (e) {
		return res.status(500).json({ error: 'Failed to delete all teachers' });
	}
});

// Delete all teachers including principal
router.delete('/all-including-principal', async (req, res) => {
	try {
		console.log('Delete all teachers including principal endpoint called');
		const [teacherResult, principalResult] = await Promise.all([
			Teacher.deleteMany({}),
			Principal.deleteMany({})
		]);
		// Reset the counter
		await Counter.findOneAndUpdate({ key: 'teacher' }, { seq: 0 }, { upsert: true });
		console.log(`Deleted ${teacherResult.deletedCount} teachers and ${principalResult.deletedCount} principal(s)`);
		return res.json({
			success: true,
			message: `Deleted ${teacherResult.deletedCount} teachers and ${principalResult.deletedCount} principal(s)`,
			deletedCount: teacherResult.deletedCount + principalResult.deletedCount
		});
	} catch (e) {
		console.error('Error deleting all teachers and principal:', e);
		return res.status(500).json({ error: 'Failed to delete all teachers and principal' });
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

// Download template
router.get('/template', async (req, res) => {
	try {
		const template = [
			{
				Name: 'John Doe',
				'Weekly Periods': 20,
				'Daily Periods': 5
			},
			{
				Name: 'Jane Smith',
				'Weekly Periods': 18,
				'Daily Periods': 4
			}
		];

		const ws = XLSX.utils.json_to_sheet(template);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Teachers');

		const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=teachers_template.xlsx');
		res.send(buffer);
	} catch (e) {
		return res.status(500).json({ error: 'Failed to generate template' });
	}
});

// Upload teachers via Excel
router.post('/upload', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
		const workbook = XLSX.read(req.file.buffer);
		const sheetName = workbook.SheetNames[0];
		const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

		// Auto-detect column names if sheet has data
		let detectedColumns = {};
		if (sheet.length > 0) {
			const headers = Object.keys(sheet[0]);
			console.log('Detected headers:', headers);

			// Find name column
			const nameCol = headers.find(h =>
				h.toLowerCase().includes('name') ||
				h.toLowerCase().includes('teacher')
			);
			if (nameCol) detectedColumns.name = nameCol;

			// Find weekly periods column
			const weeklyCol = headers.find(h =>
				h.toLowerCase().includes('weekly') &&
				(h.toLowerCase().includes('period') || h.toLowerCase().includes('periods'))
			);
			if (weeklyCol) detectedColumns.weekly = weeklyCol;

			// Find daily periods column
			const dailyCol = headers.find(h =>
				(h.toLowerCase().includes('daily') || h.toLowerCase().includes('max')) &&
				(h.toLowerCase().includes('period') || h.toLowerCase().includes('periods'))
			);
			if (dailyCol) detectedColumns.daily = dailyCol;

			console.log('Auto-detected columns:', detectedColumns);
		}
		console.log('Total rows in sheet:', sheet.length);
		console.log('First few rows:', sheet.slice(0, 5));

		const teachers = sheet.map((row, index) => {
			// Preserve the Excel row order (index + 1 to start from 1)
			const excelRowOrder = index + 1;
			// Debug: Log the first few rows to see the actual column names
			if (index < 5) {
				console.log(`Row ${index}:`, Object.keys(row));
				console.log(`Row ${index} data:`, row);
			}

			// Try multiple variations of column names with more comprehensive checking
			const name = row.Name || row.name || row.NAME || row['Teacher Name'] || row['teacher_name'] || row['TEACHER NAME'] || row['Name'] ||
				row['TEACHER'] || row['teacher'] || row['Teacher'] ||
				(detectedColumns.name ? row[detectedColumns.name] : '') || '';

			// Debug: Log name extraction for first few rows
			if (index < 5) {
				console.log(`Name extraction for row ${index}:`, {
					'row.Name': row.Name,
					'row.name': row.name,
					'row.NAME': row.NAME,
					'row.Teacher Name': row['Teacher Name'],
					'detectedColumns.name': detectedColumns.name,
					'final name': name
				});
			}

			// More comprehensive weekly periods checking
			const weeklyPeriods = row['Weekly Periods'] || row.weeklyPeriods || row['WEEKLY PERIODS'] || row['weekly_periods'] ||
				row['Weekly'] || row.weekly || row['WEEKLY'] || row['Weekly Period'] || row['weekly_period'] ||
				row['Weekly Periods per Week'] || row['weekly_periods_per_week'] ||
				(detectedColumns.weekly ? row[detectedColumns.weekly] : null) || 0;

			// More comprehensive daily periods checking
			const dailyPeriods = row['Daily Periods'] || row.dailyPeriods || row['DAILY PERIODS'] || row['daily_periods'] ||
				row['Daily'] || row.daily || row['DAILY'] || row['Daily Period'] || row['daily_period'] ||
				row['Daily Max Periods'] || row['daily_max_periods'] || row['Max Daily Periods'] || row['max_daily_periods'] ||
				row['Daily Maximum'] || row['daily_maximum'] || row['Max Periods'] || row['max_periods'] ||
				(detectedColumns.daily ? row[detectedColumns.daily] : null) || 0;

			// Debug: Log the parsed values for first few rows
			if (index < 3) {
				console.log(`Parsed Row ${index}:`, {
					name: name,
					weeklyPeriods: weeklyPeriods,
					dailyPeriods: dailyPeriods,
					weeklyType: typeof weeklyPeriods,
					dailyType: typeof dailyPeriods
				});
			}

			// Convert to numbers with better error handling
			let weeklyNum = 0;
			let dailyNum = 0;

			try {
				weeklyNum = Number(weeklyPeriods);
				if (isNaN(weeklyNum)) weeklyNum = 0;
			} catch (e) {
				console.log('Error parsing weekly periods:', weeklyPeriods, e);
				weeklyNum = 0;
			}

			try {
				dailyNum = Number(dailyPeriods);
				if (isNaN(dailyNum)) dailyNum = 0;
			} catch (e) {
				console.log('Error parsing daily periods:', dailyPeriods, e);
				dailyNum = 0;
			}

			// Debug: Log the final converted values
			if (index < 3) {
				console.log(`Final Row ${index}:`, {
					name: name.toString().trim(),
					weeklyPeriods: weeklyNum,
					dailyPeriods: dailyNum
				});
			}

			return {
				name: name.toString().trim(),
				weeklyPeriods: weeklyNum,
				dailyPeriods: dailyNum,
				rowOrder: excelRowOrder
			};
		});

		console.log('All processed teachers before filtering:', teachers.length);
		console.log('Sample processed teachers:', teachers.slice(0, 3));

		// Filter out teachers with empty names
		const validTeachers = teachers.filter(t => t.name && t.name.trim() !== '');
		console.log('Valid teachers after filtering:', validTeachers.length);
		console.log('Sample valid teachers:', validTeachers.slice(0, 3));

		if (validTeachers.length === 0) return res.status(400).json({ error: 'No valid rows' });
		for (const t of validTeachers) {
			const exists = await Teacher.findOne({ name: new RegExp('^' + escapeRegex(t.name) + '$', 'i') });
			if (exists) continue;
			const safeId = await getNextId();
			const newTeacher = await Teacher.create({ id: safeId, rowOrder: t.rowOrder, name: t.name, weeklyPeriods: t.weeklyPeriods, dailyPeriods: t.dailyPeriods });
			console.log('Created teacher:', newTeacher);
		}
		// Ensure all teachers have rowOrder (migration for existing data)
		await Teacher.updateMany({ rowOrder: { $exists: false } }, { $set: { rowOrder: 0 } });

		const all = await Teacher.find({}).sort({ rowOrder: 1, id: 1 }).lean();
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


