
import mongoose from 'mongoose';
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import Class from './models/Class.js';
import TeacherSubject from './models/TeacherSubject.js';
import Timetable from './models/Timetable.js';

const mongoUri = 'mongodb://127.0.0.1:27017/timetable';

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const teachers = await Teacher.countDocuments();
        const subjects = await Subject.countDocuments();
        const classes = await Class.countDocuments();
        const teacherSubjects = await TeacherSubject.countDocuments();
        const timetables = await Timetable.find({}).sort({ generatedAt: -1 }).limit(1);

        console.log(`Teachers: ${teachers}`);
        console.log(`Subjects: ${subjects}`);
        console.log(`Classes: ${classes}`);
        console.log(`TeacherSubjects: ${teacherSubjects}`);

        if (timetables.length > 0) {
            console.log('Latest timetable status:', timetables[0].generationStatus);
            console.log('Latest timetable log:', timetables[0].generationLog);
        } else {
            console.log('No timetables generated yet.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
