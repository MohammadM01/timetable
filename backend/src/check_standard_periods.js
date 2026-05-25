import mongoose from 'mongoose';
import Class from './models/Class.js';
import Subject from './models/Subject.js';
import TeacherSubject from './models/TeacherSubject.js';

const mongoUri = 'mongodb://127.0.0.1:27017/timetable';

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const classes = await Class.find({}).lean();
        const subjects = await Subject.find({}).lean();
        const teacherSubjects = await TeacherSubject.find({}).lean();

        // 1. Group subjects by standard and sum weekly_periods
        const stdSubjectPeriods = {};
        subjects.forEach(s => {
            if (!stdSubjectPeriods[s.standard]) stdSubjectPeriods[s.standard] = 0;
            stdSubjectPeriods[s.standard] += s.weekly_periods;
        });

        console.log('--- STANDARD PERIODS SUMMARY ---');
        Object.entries(stdSubjectPeriods).sort().forEach(([std, count]) => {
            console.log(`Standard ${std}: Needs ${count} weekly periods`);
        });

        // 2. Check if subjects have assigned teachers
        console.log('\n--- UNASSIGNED SUBJECTS ---');
        let unassignedCount = 0;
        subjects.forEach(s => {
            // Find a mapping for this subject in teacher-subjects
            const mappings = teacherSubjects.filter(ts => 
                ts.standard === s.standard && 
                ts.subjectName.toLowerCase() === s.subject_name.toLowerCase()
            );
            if (mappings.length === 0) {
                unassignedCount++;
                console.log(`⚠️ No teacher assigned for Standard ${s.standard} - ${s.subject_name}`);
            }
        });
        console.log(`Total unassigned subject-standard pairs: ${unassignedCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
