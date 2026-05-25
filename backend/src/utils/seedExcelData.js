import mongoose from 'mongoose';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Timetable from '../models/Timetable.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

// Relative or absolute paths to the Excel files
const directoryPath = 'd:/WORK/Project/timetable/directory';
const files = {
    classes: path.join(directoryPath, 'class_list_corrected.xlsx'),
    subjects: path.join(directoryPath, 'subject_periods_updated.xlsx'),
    teachers: path.join(directoryPath, 'teacher_periods.xlsx')
};

async function seed() {
    try {
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        // Verify Excel files exist
        for (const [key, filePath] of Object.entries(files)) {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Critical Excel file not found: ${filePath}`);
            }
        }

        // 1. Clear existing collections to ensure a clean slate
        console.log('\n🧹 Clearing existing collections...');
        const teacherDel = await Teacher.deleteMany({});
        const subjectDel = await Subject.deleteMany({});
        const classDel = await Class.deleteMany({});
        const assignmentDel = await TeacherSubject.deleteMany({});
        const timetableDel = await Timetable.deleteMany({});
        
        console.log(`Deleted: ${teacherDel.deletedCount} teachers, ${subjectDel.deletedCount} subjects, ${classDel.deletedCount} classes, ${assignmentDel.deletedCount} assignments, ${timetableDel.deletedCount} timetables.`);

        // 2. Seed Classes
        console.log('\n📚 Seeding Classes from class_list_corrected.xlsx...');
        const classWb = XLSX.readFile(files.classes);
        const classSheet = classWb.Sheets[classWb.SheetNames[0]];
        const classRows = XLSX.utils.sheet_to_json(classSheet);
        
        const seededClasses = [];
        for (const row of classRows) {
            const standard = row.standard?.toString().trim();
            const division = row.division?.toString().trim();
            const full_name = row.full_name?.toString().trim() || `${standard} ${division}`;
            
            if (standard && division) {
                const clsDoc = await Class.create({
                    standard,
                    division,
                    full_name
                });
                seededClasses.push(clsDoc);
            }
        }
        console.log(`✅ Loaded ${seededClasses.length} classes successfully.`);

        // 3. Seed Subjects
        console.log('\n📖 Seeding Subjects from subject_periods_updated.xlsx...');
        const subjectWb = XLSX.readFile(files.subjects);
        const subjectSheet = subjectWb.Sheets[subjectWb.SheetNames[0]];
        const subjectRows = XLSX.utils.sheet_to_json(subjectSheet);
        
        const seededSubjects = [];
        for (const row of subjectRows) {
            const standard = row.standard?.toString().trim();
            const subject_name = row.subject_name?.toString().trim().toUpperCase();
            const weekly_periods = parseInt(row.weekly_periods);
            const consecutive = row.consecutive_periods?.toString().trim().toLowerCase();
            const consecutive_periods = consecutive === 'yes' || consecutive === 'true';

            if (standard && subject_name && !isNaN(weekly_periods)) {
                const subDoc = await Subject.create({
                    standard,
                    subject_name,
                    weekly_periods,
                    consecutive_periods
                });
                seededSubjects.push(subDoc);
            }
        }
        console.log(`✅ Loaded ${seededSubjects.length} subjects successfully.`);

        // 4. Seed Teachers
        console.log('\n🧑‍🏫 Seeding Teachers from teacher_periods.xlsx...');
        const teacherWb = XLSX.readFile(files.teachers);
        const teacherSheet = teacherWb.Sheets[teacherWb.SheetNames[0]];
        const teacherRows = XLSX.utils.sheet_to_json(teacherSheet);
        
        const seededTeachers = [];
        let index = 0;
        for (const row of teacherRows) {
            const id = parseInt(row.id);
            const name = row.name?.toString().trim();
            const weeklyPeriods = parseInt(row.weekly_periods);
            const dailyPeriods = parseInt(row.daily_max_periods);

            if (!isNaN(id) && name && !isNaN(weeklyPeriods) && !isNaN(dailyPeriods)) {
                const teachDoc = await Teacher.create({
                    id,
                    name,
                    weeklyPeriods,
                    dailyPeriods,
                    rowOrder: index++
                });
                seededTeachers.push(teachDoc);
            }
        }
        console.log(`✅ Loaded ${seededTeachers.length} teachers successfully.`);
        console.log(`⭐ Special Verification: MRS. DARAKHSHAN ARIF MULLA has weeklyPeriods: ${seededTeachers.find(t => t.id === 1)?.weeklyPeriods} and dailyPeriods: ${seededTeachers.find(t => t.id === 1)?.dailyPeriods}.`);

        console.log('\n🎉 Database Seeding Completed Successfully!');
        
    } catch (e) {
        console.error('❌ Seeding failed with error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

seed();
