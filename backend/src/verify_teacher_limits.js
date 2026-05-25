import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TimetableGenerator from './utils/timetableGenerator.js';
import Teacher from './models/Teacher.js';
import Subject from './models/Subject.js';
import Class from './models/Class.js';

dotenv.config();
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

async function verifyTeacherLimits() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected.\n');

        const recessAfterPeriod = 5;
        const config = {
            daysPerWeek: 6,
            periodsPerDay: 9,
            startTime: '08:00',
            periodDuration: 45,
            recessAfterPeriod: recessAfterPeriod,
            dayPeriods: {
                Monday: 9,
                Tuesday: 9,
                Wednesday: 9,
                Thursday: 9,
                Friday: 5,
                Saturday: 5
            }
        };

        console.log('Running Timetable Generator...');
        const generator = new TimetableGenerator(config);
        const timetable = await generator.generate();
        console.log(`\n✅ Timetable generated! Stats: ${JSON.stringify(timetable.stats)}\n`);

        // Fetch teacher data for verification
        const teachers = await Teacher.find({}).lean();
        const subjects = await Subject.find({}).lean();
        const classes = await Class.find({}).lean();

        const teacherSchedule = timetable.teacherSchedule;
        const timetableObj = timetable.timetable;

        let weeklyViolations = 0;
        let dailyViolations = 0;
        let totalTeachersChecked = 0;

        console.log('═══════════════════════════════════════════════════');
        console.log('  TEACHER WEEKLY & DAILY PERIOD LIMIT VERIFICATION');
        console.log('═══════════════════════════════════════════════════\n');

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        for (const teacher of teachers) {
            const tId = teacher.id?.toString();
            if (!tId) continue;

            const schedule = teacherSchedule[tId];
            if (!schedule) continue;

            totalTeachersChecked++;
            let weeklyTotal = 0;
            let dailyBreakdown = [];

            for (let dayIndex = 1; dayIndex <= 6; dayIndex++) {
                const daySlots = schedule[dayIndex] || {};
                const dayCount = Object.keys(daySlots).length;
                weeklyTotal += dayCount;
                dailyBreakdown.push(`${days[dayIndex - 1].slice(0, 3)}:${dayCount}`);

                // Daily limit check
                if (teacher.dailyPeriods && dayCount > teacher.dailyPeriods) {
                    dailyViolations++;
                    console.log(`❌ DAILY VIOLATION: ${teacher.name} (ID: ${tId}) has ${dayCount} periods on ${days[dayIndex - 1]}, limit is ${teacher.dailyPeriods}`);
                }
            }

            // Weekly limit check
            const weeklyLimit = teacher.weeklyPeriods || 999;
            const status = weeklyTotal > weeklyLimit ? '❌' : weeklyTotal === weeklyLimit ? '✅' : '⚠️';
            if (weeklyTotal > weeklyLimit) {
                weeklyViolations++;
            }

            console.log(`${status} ${teacher.name.padEnd(35)} | Weekly: ${weeklyTotal}/${weeklyLimit} | [${dailyBreakdown.join(', ')}]`);
        }

        // Subject weekly periods verification
        console.log('\n═══════════════════════════════════════════════════');
        console.log('  SUBJECT WEEKLY PERIODS VERIFICATION');
        console.log('═══════════════════════════════════════════════════\n');

        let subjectMismatches = 0;
        for (const cls of classes) {
            const clsId = cls._id.toString();
            const clsTimetable = timetableObj[clsId];
            if (!clsTimetable) continue;

            // Count assigned subjects for this class
            const subjectCounts = {};
            for (let d = 1; d <= config.daysPerWeek; d++) {
                const daySlots = clsTimetable[d] || {};
                for (const [p, slot] of Object.entries(daySlots)) {
                    if (slot && slot.subject) {
                        subjectCounts[slot.subject] = (subjectCounts[slot.subject] || 0) + 1;
                    }
                }
            }

            // Compare with expected weekly_periods
            const classSubjects = subjects.filter(s => s.standard === cls.standard);
            for (const sub of classSubjects) {
                const actual = subjectCounts[sub.subject_name] || 0;
                const expected = sub.weekly_periods;
                if (actual !== expected) {
                    subjectMismatches++;
                    if (actual < expected) {
                        console.log(`⚠️ ${cls.full_name} — ${sub.subject_name}: assigned ${actual}/${expected} periods (deficit: ${expected - actual})`);
                    }
                }
            }
        }

        // Summary
        console.log('\n═══════════════════════════════════════════════════');
        console.log('  VERIFICATION SUMMARY');
        console.log('═══════════════════════════════════════════════════');
        console.log(`Teachers checked: ${totalTeachersChecked}`);
        console.log(`Weekly violations: ${weeklyViolations}`);
        console.log(`Daily violations: ${dailyViolations}`);
        console.log(`Subject period mismatches: ${subjectMismatches}`);

        if (weeklyViolations === 0 && dailyViolations === 0) {
            console.log('\n🎉 SUCCESS! No teacher weekly/daily period violations found!');
        } else {
            console.log(`\n⚠️ FOUND VIOLATIONS: ${weeklyViolations} weekly + ${dailyViolations} daily`);
        }

        await mongoose.disconnect();
        process.exit(weeklyViolations + dailyViolations === 0 ? 0 : 1);

    } catch (error) {
        console.error('Error during verification:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyTeacherLimits();
