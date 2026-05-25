import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Timetable from '../models/Timetable.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

async function clear() {
    try {
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        console.log('\n🧹 Clearing collections...');
        const teacherDel = await Teacher.deleteMany({});
        const subjectDel = await Subject.deleteMany({});
        const classDel = await Class.deleteMany({});
        const assignmentDel = await TeacherSubject.deleteMany({});
        const timetableDel = await Timetable.deleteMany({});
        
        console.log(`✅ Successfully cleared all data!`);
        console.log(`Deleted counts:`);
        console.log(`- Teachers: ${teacherDel.deletedCount}`);
        console.log(`- Subjects: ${subjectDel.deletedCount}`);
        console.log(`- Classes: ${classDel.deletedCount}`);
        console.log(`- Assignments (TeacherSubjects): ${assignmentDel.deletedCount}`);
        console.log(`- Timetables: ${timetableDel.deletedCount}`);

    } catch (e) {
        console.error('❌ Clearing failed:', e);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

clear();
