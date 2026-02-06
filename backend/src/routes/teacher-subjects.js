import { Router } from 'express';
import TeacherSubject from '../models/TeacherSubject.js';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import multer from 'multer';
import XLSX from 'xlsx';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

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

// Upload teacher-subject mappings from Excel
router.post('/upload', upload.single('file'), async (req, res) => {
	try {
		console.log('Upload request received');
		console.log('Request file:', req.file);
		
		if (!req.file) {
			console.log('No file uploaded');
			return res.status(400).json({ error: 'No file uploaded' });
		}

		console.log('File uploaded successfully:', req.file.filename);
		console.log('File path:', req.file.path);

		// Read Excel file
		console.log('Reading Excel file...');
		const workbook = XLSX.readFile(req.file.path);
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const data = XLSX.utils.sheet_to_json(worksheet);
		
		console.log('Excel data read successfully, rows:', data.length);

		if (data.length === 0) {
			return res.status(400).json({ error: 'Excel file is empty' });
		}

        // Expected columns (any of these variants):
        // - Teacher ID | teacherId | TeacherId OR Teacher Name | Name | Teacher
        // - Subject ID | subjectId | SubjectId OR Subject Name | subject | Subject and Standard | Class | Grade
        const results = [];
        let addedCount = 0;

        for (let index = 0; index < data.length; index++) {
            const row = data[index];

            // Preserve sheet order implicitly by iterating sequentially

            // Extract teacher identifier
            let teacherId = parseInt(row['Teacher ID'] || row['teacherId'] || row['TeacherId']);
            const teacherName = (row['Teacher Name'] || row['Teacher'] || row['teacher_name'] || row['Name'] || row['Teachername'] || row['TEACHER'] || row['TEACHER NAME'] || '').toString().trim();

            // Extract subject identifier
            let subjectId = row['Subject ID'] || row['subjectId'] || row['SubjectId'];
            const subjectName = (row['Subject Name'] || row['Subject'] || row['subject_name'] || row['SUBJECT'] || '').toString().trim();
            const standard = (row['Standard'] || row['Class'] || row['Grade'] || row['standard'] || '').toString().trim();

            // Resolve teacher by name if ID not present
            let teacherDoc = null;
            if (!teacherId && teacherName) {
                teacherDoc = await Teacher.findOne({ name: new RegExp('^' + teacherName + '$', 'i') });
                if (teacherDoc) {
                    teacherId = teacherDoc.id;
                }
            }

            // Resolve subject by name + standard if ID not present
            let subjectDoc = null;
            if (!subjectId && subjectName && standard) {
                subjectDoc = await Subject.findOne({
                    subject_name: new RegExp('^' + subjectName + '$', 'i'),
                    standard: new RegExp('^' + standard + '$', 'i')
                });
                if (subjectDoc) {
                    subjectId = subjectDoc._id;
                }
            }

            if (!teacherId || !subjectId) {
                results.push({ row: index + 1, error: `Missing teacher/subject reference`, teacherName, subjectName, standard });
                continue;
            }

            try {
                // Ensure teacher exists
                let teacher;
                if (teacherDoc) {
                    teacher = teacherDoc;
                } else if (typeof teacherId === 'number' || !isNaN(teacherId)) {
                    teacher = await Teacher.findOne({ id: parseInt(teacherId) });
                } else {
                    teacher = await Teacher.findOne({ id: teacherId });
                }
                if (!teacher) {
                    results.push({ row: index + 1, error: `Teacher not found`, teacherId, teacherName });
                    continue;
                }

                // Ensure subject exists
                const subject = subjectDoc || (await Subject.findById(subjectId));
                if (!subject) {
                    results.push({ row: index + 1, error: `Subject not found`, subjectId, subjectName, standard });
                    continue;
                }

                // Skip duplicates
                const existingMapping = await TeacherSubject.findOne({ teacherId, subjectId: subject._id });
                if (existingMapping) {
                    results.push({ row: index + 1, error: `Mapping already exists for teacher ${teacherId} and subject ${subject._id.toString()}` });
                    continue;
                }

                // Create mapping
                const mapping = await TeacherSubject.create({
                    teacherId,
                    teacherName: teacher.name,
                    subjectId: subject._id,
                    subjectName: subject.subject_name,
                    standard: subject.standard,
                    preferredPeriods: [],
                    avoidPeriods: [],
                    consecutivePeriods: false
                });

                results.push({
                    success: true,
                    id: mapping._id,
                    teacherId: mapping.teacherId,
                    teacherName: mapping.teacherName,
                    subjectName: mapping.subjectName,
                    standard: mapping.standard
                });
                addedCount++;
            } catch (error) {
                results.push({ row: index + 1, error: `Failed to create mapping: ${error.message}` });
            }
        }

		// Clean up uploaded file
		fs.unlinkSync(req.file.path);

		return res.json({
			success: true,
			message: `Successfully processed ${data.length} rows`,
			addedCount,
			results
		});

	} catch (error) {
		console.error('Error uploading teacher-subject mappings:', error);
		console.error('Error details:', error.message);
		console.error('Error stack:', error.stack);
		return res.status(500).json({ 
			error: 'Failed to upload teacher-subject mappings',
			details: error.message 
		});
	}
});

// Delete all teacher-subject mappings
router.delete('/all', async (req, res) => {
	try {
		const result = await TeacherSubject.deleteMany({});
		return res.json({ 
			success: true, 
			message: `Deleted ${result.deletedCount} teacher-subject mappings`,
			deletedCount: result.deletedCount
		});
	} catch (error) {
		console.error('Error deleting all teacher-subject mappings:', error);
		return res.status(500).json({ error: 'Failed to delete all teacher-subject mappings' });
	}
});

export default router;
