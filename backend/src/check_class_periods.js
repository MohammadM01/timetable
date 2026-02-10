
import mongoose from 'mongoose';
import Class from './models/Class.js';
import Subject from './models/Subject.js';

const mongoUri = 'mongodb://127.0.0.1:27017/timetable';

async function check() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to DB');

        const classes = await Class.find({ full_name: 'VG1' });
        if (classes.length === 0) {
            console.log('Class VG1 not found');
            return;
        }

        const classData = classes[0];
        console.log(`Class: ${classData.full_name}, Standard: ${classData.standard}`);

        const subjects = await Subject.find({ standard: classData.standard });
        console.log(`Found ${subjects.length} subjects for standard ${classData.standard}`);

        let totalPeriods = 0;
        subjects.forEach(s => {
            console.log(`Subject: ${s.subject_name}, Weekly periods: ${s.weekly_periods}`);
            totalPeriods += s.weekly_periods;
        });

        console.log(`Total weekly periods needed: ${totalPeriods}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
