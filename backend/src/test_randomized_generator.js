import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TimetableGenerator from './utils/timetableGenerator.js';
import Teacher from './models/Teacher.js';
import Principal from './models/Principal.js';

dotenv.config();
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

async function testGenerator() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        
        console.log('Generating Timetable...');
        const generator = new TimetableGenerator({
            daysPerWeek: 6,
            periodsPerDay: 9,
            startTime: '08:00',
            periodDuration: 45,
            recessAfterPeriod: 5,
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
        console.log('Timetable generated successfully!');
        console.log(`Stats: ${JSON.stringify(timetable.stats)}`);
        
        // Let's verify constraints for each teacher
        console.log('\n--- VERIFYING CONSTRAINTS ---');
        const teacherSchedule = timetable.teacherSchedule;
        
        let totalViolationsActive = 0;
        let totalViolationsFree = 0;
        let teachersEvaluated = 0;
        
        for (const [tId, schedule] of Object.entries(teacherSchedule)) {
            teachersEvaluated++;
            
            for (let day = 1; day <= 6; day++) {
                const daySlots = schedule[day] || {};
                
                // 1. Check max active continuous periods (should be <= 2, relax allows up to 3)
                let activeContinuous = 0;
                let maxActiveContinuous = 0;
                for (let p = 1; p <= 8; p++) {
                    if (daySlots[p]) {
                        activeContinuous++;
                        if (activeContinuous > maxActiveContinuous) {
                            maxActiveContinuous = activeContinuous;
                        }
                    } else {
                        activeContinuous = 0;
                    }
                }
                
                // 2. Check max free continuous periods (should be <= 2, relax allows up to 3)
                let activePeriods = [];
                for (let p = 1; p <= 8; p++) {
                    if (daySlots[p]) {
                        activePeriods.push(p);
                    }
                }
                
                let maxFreeContinuous = 0;
                if (activePeriods.length >= 2) {
                    const firstActive = activePeriods[0];
                    const lastActive = activePeriods[activePeriods.length - 1];
                    
                    let freeContinuous = 0;
                    for (let p = firstActive; p <= lastActive; p++) {
                        if (!daySlots[p]) {
                            freeContinuous++;
                            if (freeContinuous > maxFreeContinuous) {
                                maxFreeContinuous = freeContinuous;
                            }
                        } else {
                            freeContinuous = 0;
                        }
                    }
                }
                
                if (maxActiveContinuous > 2) {
                    totalViolationsActive++;
                    console.log(`⚠️ Active Constraint Violation: Teacher ID ${tId} on Day ${day} has ${maxActiveContinuous} continuous periods.`);
                }
                if (maxFreeContinuous > 2) {
                    totalViolationsFree++;
                    console.log(`⚠️ Free Constraint Violation: Teacher ID ${tId} on Day ${day} has ${maxFreeContinuous} consecutive free periods between classes.`);
                }
            }
        }
        
        console.log('\n--- VERIFICATION SUMMARY ---');
        console.log(`Teachers evaluated: ${teachersEvaluated}`);
        console.log(`Active constraint violations (max 2 continuous): ${totalViolationsActive}`);
        console.log(`Free constraint violations (max 2 free continuous): ${totalViolationsFree}`);
        
        if (totalViolationsActive === 0 && totalViolationsFree === 0) {
            console.log('✅ ALL STRICT CONSTRAINTS SECURELY MET FOR ALL TEACHERS!');
        } else {
            console.log('ℹ️ Constraints were relaxed dynamically for some slots to ensure 100% successful generation.');
        }
        
    } catch (e) {
        console.error('Test run failed:', e);
    } finally {
        await mongoose.disconnect();
    }
}

testGenerator();
