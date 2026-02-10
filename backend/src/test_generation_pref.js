
import mongoose from 'mongoose';
import TimetableGenerator from './utils/timetableGenerator.js';
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import Class from './models/Class.js';
import TeacherSubject from './models/TeacherSubject.js';
import Timetable from './models/Timetable.js';

const mongoUri = 'mongodb://127.0.0.1:27017/timetable';

async function testGeneration() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const classes = await Class.find({});
        if (classes.length === 0) {
            console.log('No classes found');
            return;
        }

        console.log(`Found ${classes.length} classes`);

        const config = {
            daysPerWeek: 6,
            periodsPerDay: 8,
            periodDuration: 45,
            startTime: '08:00',
            recessAfterPeriod: 4,
            targetClasses: classes,
            customPreferences: "Add English daily except Friday\nOn Thursday it should be 2 periods of Maths back to back"
        };

        console.log('Starting generator with preferences:', config.customPreferences);
        const generator = new TimetableGenerator(config);
        const timetable = await generator.generate();

        console.log('Generation successful!');
        console.log('Timetable ID:', timetable._id);

        if (timetable.generationLog) {
            const warnings = timetable.generationLog.filter(log =>
                log.toLowerCase().includes('warning') ||
                log.toLowerCase().includes('not enough') ||
                log.toLowerCase().includes('applied')
            );
            console.log('Logs related to preferences:', warnings);
        }

    } catch (err) {
        console.error('Generation failed:', err);
        console.error(err.stack);
    } finally {
        await mongoose.disconnect();
    }
}

testGeneration();
