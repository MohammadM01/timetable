import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TimetableGenerator from './utils/timetableGenerator.js';

dotenv.config();
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

async function verifyConsecutiveConstraint() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        
        const recessAfterPeriod = 5;
        console.log('Running Automatic Generator with Strict Constraint...');
        const generator = new TimetableGenerator({
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
        });
        
        const timetable = await generator.generate();
        console.log('\n✅ Timetable generated successfully!');
        console.log(`Stats: ${JSON.stringify(timetable.stats)}`);
        
        const teacherSchedule = timetable.teacherSchedule;
        let totalViolations = 0;
        let totalChecked = 0;
        
        console.log('\n--- VERIFYING CONSECUTIVE TEACHING PERIODS (MAX 2) ---');
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (const [tId, schedule] of Object.entries(teacherSchedule)) {
            for (let dayIndex = 1; dayIndex <= 6; dayIndex++) {
                const daySlots = schedule[dayIndex] || {};
                const dayName = days[dayIndex - 1];
                
                // Get periods for day
                const dayPeriodsCount = dayName === 'Friday' || dayName === 'Saturday' ? 5 : 9;
                
                let continuous = 0;
                let maxContinuous = 0;
                let violationRun = [];
                let currentRun = [];
                
                for (let p = 1; p <= dayPeriodsCount; p++) {
                    // Recess resets consecutive teaching periods count
                    if (recessAfterPeriod && p === recessAfterPeriod + 1) {
                        continuous = 0;
                        currentRun = [];
                    }
                    
                    if (daySlots[p]) {
                        continuous++;
                        currentRun.push(p);
                        if (continuous > maxContinuous) {
                            maxContinuous = continuous;
                            if (continuous > 2) {
                                violationRun = [...currentRun];
                            }
                        }
                    } else {
                        continuous = 0;
                        currentRun = [];
                    }
                }
                
                totalChecked++;
                if (maxContinuous > 2) {
                    totalViolations++;
                    console.log(`❌ VIOLATION DETECTED: Teacher ID ${tId} on ${dayName} teaches ${maxContinuous} consecutive periods: [${violationRun.join(', ')}] without break!`);
                }
            }
        }
        
        console.log('\n--- VERIFICATION SUMMARY ---');
        console.log(`Checked total of ${totalChecked} teacher-day schedules.`);
        if (totalViolations === 0) {
            console.log('🎉 SUCCESS! No violations found. Every teacher strictly has max 2 consecutive periods (with recess breaks correctly factored in).');
        } else {
            console.log(`⚠️ FAILURE: Found ${totalViolations} teacher-day consecutive teaching period violations.`);
        }
        
        await mongoose.disconnect();
        process.exit(totalViolations === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('Error during verification:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyConsecutiveConstraint();
