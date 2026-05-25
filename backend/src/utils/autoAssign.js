import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Principal from '../models/Principal.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

async function autoAssign() {
    try {
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB.');

        // Clear existing assignments
        console.log('🧹 Clearing existing teacher-subject assignments...');
        await TeacherSubject.deleteMany({});

        // Fetch teachers, subjects, classes, and principal
        const teachers = await Teacher.find({}).sort({ id: 1 });
        const subjects = await Subject.find({});
        const classes = await Class.find({}).sort({ standard: 1, division: 1 });
        const principalDoc = await Principal.findOne({});

        console.log(`Loaded ${teachers.length} teachers, ${subjects.length} subjects, ${classes.length} classes.`);

        let principal = null;
        if (principalDoc) {
            principal = {
                id: 'principal',
                name: principalDoc.name,
                weeklyPeriods: principalDoc.weekly_periods,
                dailyPeriods: principalDoc.daily_max_periods
            };
            console.log('Principal loaded for auto-assign:', principal);
        }

        const regularTeachers = teachers;

        // Keep track of active teaching load for each teacher
        const teacherLoads = {};
        teachers.forEach(t => {
            teacherLoads[t.id] = 0;
        });
        if (principal) {
            teacherLoads[principal.id] = 0;
        }

        // Map standards V, VI, VII, VIII, IX, X to their divisions
        const classesByStandard = {};
        classes.forEach(c => {
            if (!classesByStandard[c.standard]) {
                classesByStandard[c.standard] = [];
            }
            classesByStandard[c.standard].push(c);
        });

        let principalAssignedCount = 0;

        // Group subjects by standard
        const subjectsByStandard = {};
        subjects.forEach(s => {
            if (!subjectsByStandard[s.standard]) {
                subjectsByStandard[s.standard] = [];
            }
            subjectsByStandard[s.standard].push(s);
        });

        console.log('\nAssigning teachers to subjects by standard and division...');

        // For each standard (V to X)
        const standardsOrder = ['V', 'VI', 'VII', 'VIII', 'IX', 'X'];
        let regularTeacherIndex = 0;

        for (const standard of standardsOrder) {
            const stdSubjects = subjectsByStandard[standard] || [];
            const stdClasses = classesByStandard[standard] || [];

            console.log(`Standard ${standard}: ${stdSubjects.length} subjects, ${stdClasses.length} divisions.`);

            for (const subject of stdSubjects) {
                // For each subject in this standard (e.g. Urdu, Maths, English)
                // We want to assign a teacher to this subject for EACH division of this standard
                
                // Let's decide who will teach this subject
                // If it's standard V/VI "MI" (Moral Instruction) and Principal has capacity, let Principal teach some of it!
                let assignedTeacher = null;
                const totalSubjectPeriodsForStandard = subject.weekly_periods * stdClasses.length;

                // Simple check if Principal should teach this subject
                if (principal && principalAssignedCount + subject.weekly_periods <= principal.weeklyPeriods && 
                    (subject.subject_name === 'MI' || subject.subject_name === 'PE') && 
                    principalAssignedCount < principal.weeklyPeriods) {
                    
                    assignedTeacher = principal;
                    principalAssignedCount += subject.weekly_periods;
                    teacherLoads[principal.id] += subject.weekly_periods;
                    console.log(`👑 Assigned Principal (${principal.name}) to teach ${subject.subject_name} in Standard ${standard} (${subject.weekly_periods} periods)`);
                }

                // Loop through divisions and assign teachers
                for (const cls of stdClasses) {
                    // If not Principal, find a regular teacher with available load
                    let currentTeacher = assignedTeacher;

                    if (!currentTeacher) {
                        // Find a regular teacher who has the capacity for this class's weekly subject periods
                        // We will cycle through teachers to distribute the load evenly
                        let attempts = 0;
                        while (attempts < regularTeachers.length) {
                            const candidate = regularTeachers[regularTeacherIndex];
                            const loadLimit = candidate.weeklyPeriods;
                            const currentLoad = teacherLoads[candidate.id];

                            if (currentLoad + subject.weekly_periods <= loadLimit) {
                                currentTeacher = candidate;
                                teacherLoads[candidate.id] += subject.weekly_periods;
                                break;
                            }

                            // Cycle to the next teacher
                            regularTeacherIndex = (regularTeacherIndex + 1) % regularTeachers.length;
                            attempts++;
                        }
                    }

                    if (!currentTeacher) {
                        // Fallback: if all teachers are full, pick the one with the lowest load
                        let bestCandidate = regularTeachers[0];
                        let minLoad = teacherLoads[bestCandidate.id];
                        for (const t of regularTeachers) {
                            if (teacherLoads[t.id] < minLoad) {
                                bestCandidate = t;
                                minLoad = teacherLoads[t.id];
                            }
                        }
                        currentTeacher = bestCandidate;
                        teacherLoads[currentTeacher.id] += subject.weekly_periods;
                        console.log(`⚠️ Overloading teacher ${currentTeacher.name} with ${subject.subject_name} in ${cls.full_name} (New Load: ${teacherLoads[currentTeacher.id]})`);
                    }

                    // Create the assignment document
                    await TeacherSubject.create({
                        teacherId: currentTeacher.id,
                        teacherName: currentTeacher.name,
                        subjectId: subject._id.toString(),
                        subjectName: subject.subject_name,
                        standard: standard,
                        classId: cls._id.toString(),
                        className: cls.full_name,
                        preferredPeriods: [],
                        avoidPeriods: [],
                        consecutivePeriods: subject.consecutive_periods
                    });

                    // For standard subjects, we can reuse the same teacher for other divisions of this standard
                    // if it fits their capacity, otherwise we cycle to keep it realistic
                    if (!assignedTeacher && teacherLoads[currentTeacher.id] >= currentTeacher.weeklyPeriods - 6) {
                        regularTeacherIndex = (regularTeacherIndex + 1) % regularTeachers.length;
                    }
                }
            }
        }

        console.log('\n📊 Seeding Mappings Statistics:');
        const count = await TeacherSubject.countDocuments();
        console.log(`Total Assignments Loaded: ${count}`);

        console.log('\n🧑‍🏫 Teacher Weekly Load Summary:');
        const allTeachersForPrint = principal ? [principal, ...teachers] : teachers;
        allTeachersForPrint.forEach(t => {
            const load = teacherLoads[t.id];
            const maxP = t.weeklyPeriods || 0;
            const pct = maxP > 0 ? Math.round((load / maxP) * 100) : 0;
            console.log(`- [ID: ${t.id}] ${t.name}: ${load} / ${maxP} periods (${pct}%)`);
        });

        console.log('\n🎉 Auto-Assignment Completed Perfectly!');
        
    } catch (e) {
        console.error('❌ Auto-assignment failed:', e);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

autoAssign();
