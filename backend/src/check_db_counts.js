
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import Class from './models/Class.js';
import TeacherSubject from './models/TeacherSubject.js';
import mongoose from 'mongoose'; // Only if needed for connection string, but we use AppwriteModel

async function checkCounts() {
    try {
        console.log('Checking counts...');
        const teachers = await Teacher.countDocuments();
        console.log(`Teachers: ${teachers}`);

        const subjects = await Subject.countDocuments();
        console.log(`Subjects: ${subjects}`);

        const classes = await Class.countDocuments();
        console.log(`Classes: ${classes}`);

        const assignments = await TeacherSubject.countDocuments();
        console.log(`Assignments: ${assignments}`);

    } catch (e) {
        console.error('Error checking counts:', e);
    }
}

checkCounts();
