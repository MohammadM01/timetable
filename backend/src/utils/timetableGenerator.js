import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Timetable from '../models/Timetable.js';

class TimetableGenerator {
	constructor(config = {}) {
		this.config = {
			daysPerWeek: config.daysPerWeek || 5,
			periodsPerDay: config.periodsPerDay || 8,
			periodDuration: config.periodDuration || 45,
			startTime: config.startTime || '08:00',
			...config
		};
		
		this.targetClasses = config.targetClasses || null; // For selective generation
		this.timetable = {};
		this.teacherSchedule = {};
		this.conflicts = [];
		this.unassignedPeriods = [];
		this.log = [];
	}

	async generate() {
		try {
			this.log.push('Starting timetable generation...');
			
					// Fetch all data
		const [teachers, subjects, classes, teacherSubjects] = await Promise.all([
			Teacher.find({}).lean(),
			Subject.find({}).lean(),
			Class.find({}).lean(),
			TeacherSubject.find({}).lean()
		]);

		// Use target classes if specified, otherwise use all classes
		const classesToProcess = this.targetClasses || classes;
		
		this.log.push(`Found ${teachers.length} teachers, ${subjects.length} subjects, ${classes.length} total classes`);
		this.log.push(`Generating timetable for ${classesToProcess.length} selected classes`);

		// Initialize timetable structure
		this.initializeTimetable(classesToProcess);
			
			// Group subjects by standard
			const subjectsByStandard = this.groupSubjectsByStandard(subjects);
			
			// Create teacher-subject mapping
			const teacherSubjectMap = this.createTeacherSubjectMap(teacherSubjects, teachers);
			
					// Generate timetable for each class
		for (const classData of classesToProcess) {
			await this.generateClassTimetable(classData, subjectsByStandard[classData.standard] || [], teacherSubjectMap);
		}
		
		// Save to database
		const timetableDoc = await this.saveTimetable(teachers, subjects, classesToProcess);
			
			this.log.push('Timetable generation completed successfully');
			return timetableDoc;
			
		} catch (error) {
			this.log.push(`Error: ${error.message}`);
			throw error;
		}
	}

	initializeTimetable(classes) {
		for (const classData of classes) {
			this.timetable[classData._id] = {};
			for (let day = 1; day <= this.config.daysPerWeek; day++) {
				this.timetable[classData._id][day] = {};
				for (let period = 1; period <= this.config.periodsPerDay; period++) {
					this.timetable[classData._id][day][period] = null;
				}
			}
		}
	}

	groupSubjectsByStandard(subjects) {
		const grouped = {};
		for (const subject of subjects) {
			if (!grouped[subject.standard]) {
				grouped[subject.standard] = [];
			}
			grouped[subject.standard].push(subject);
		}
		return grouped;
	}

	createTeacherSubjectMap(teacherSubjects, teachers) {
		const map = {};
		const teacherMap = {};
		
		// Create teacher lookup
		for (const teacher of teachers) {
			teacherMap[teacher.id] = teacher;
		}
		
		// Create subject-teacher mapping
		for (const ts of teacherSubjects) {
			const key = `${ts.standard}-${ts.subjectName}`;
			if (!map[key]) {
				map[key] = [];
			}
			map[key].push({
				teacherId: ts.teacherId,
				teacherName: ts.teacherName,
				preferredPeriods: ts.preferredPeriods || [],
				avoidPeriods: ts.avoidPeriods || [],
				consecutivePeriods: ts.consecutivePeriods || false
			});
		}
		
		return map;
	}

	async generateClassTimetable(classData, subjects, teacherSubjectMap) {
		this.log.push(`Generating timetable for ${classData.full_name}`);
		
		// Calculate total periods needed
		const totalPeriodsNeeded = subjects.reduce((sum, subject) => sum + subject.weekly_periods, 0);
		const availablePeriods = this.config.daysPerWeek * this.config.periodsPerDay;
		
		if (totalPeriodsNeeded > availablePeriods) {
			this.log.push(`Warning: ${classData.full_name} needs ${totalPeriodsNeeded} periods but only ${availablePeriods} available`);
		}
		
		// Create period allocation plan
		const periodPlan = this.createPeriodPlan(subjects);
		
		// Allocate periods
		for (const allocation of periodPlan) {
			const success = await this.allocateSubjectPeriod(classData, allocation, teacherSubjectMap);
			if (!success) {
				this.unassignedPeriods.push({
					class: classData.full_name,
					subject: allocation.subject.subject_name,
					periods: allocation.periods
				});
			}
		}
	}

	createPeriodPlan(subjects) {
		const plan = [];
		
		for (const subject of subjects) {
			const periods = subject.weekly_periods;
			if (periods <= 0) continue;
			
			// Distribute periods across days
			const periodsPerDay = Math.floor(periods / this.config.daysPerWeek);
			const remainingPeriods = periods % this.config.daysPerWeek;
			
			const distribution = [];
			for (let day = 1; day <= this.config.daysPerWeek; day++) {
				let dayPeriods = periodsPerDay;
				if (day <= remainingPeriods) {
					dayPeriods++;
				}
				if (dayPeriods > 0) {
					distribution.push({ day, periods: dayPeriods });
				}
			}
			
			plan.push({
				subject,
				distribution,
				totalPeriods: periods
			});
		}
		
		// Sort by total periods (descending) to allocate subjects with more periods first
		return plan.sort((a, b) => b.totalPeriods - a.totalPeriods);
	}

	async allocateSubjectPeriod(classData, allocation, teacherSubjectMap) {
		const { subject, distribution } = allocation;
		const key = `${classData.standard}-${subject.subject_name}`;
		const availableTeachers = teacherSubjectMap[key] || [];
		
		if (availableTeachers.length === 0) {
			this.log.push(`No teacher available for ${subject.subject_name} in ${classData.standard}`);
			return false;
		}
		
		// Try to allocate periods for each day
		for (const dayAllocation of distribution) {
			const { day, periods } = dayAllocation;
			
			// Find available periods for this day
			const availablePeriods = this.findAvailablePeriods(classData._id, day, periods);
			
			if (availablePeriods.length < periods) {
				this.log.push(`Not enough periods available for ${subject.subject_name} on day ${day}`);
				continue;
			}
			
			// Find best teacher for these periods
			const teacher = this.findBestTeacher(availableTeachers, availablePeriods, day);
			
			if (!teacher) {
				this.log.push(`No suitable teacher found for ${subject.subject_name} on day ${day}`);
				continue;
			}
			
			// Allocate the periods
			for (const period of availablePeriods) {
				this.timetable[classData._id][day][period] = {
					subject: subject.subject_name,
					teacher: teacher.teacherName,
					teacherId: teacher.teacherId
				};
				
				// Update teacher schedule
				if (!this.teacherSchedule[teacher.teacherId]) {
					this.teacherSchedule[teacher.teacherId] = {};
				}
				if (!this.teacherSchedule[teacher.teacherId][day]) {
					this.teacherSchedule[teacher.teacherId][day] = {};
				}
				this.teacherSchedule[teacher.teacherId][day][period] = {
					classId: classData._id,
					className: classData.full_name,
					subject: subject.subject_name
				};
			}
		}
		
		return true;
	}

	findAvailablePeriods(classId, day, count) {
		const available = [];
		for (let period = 1; period <= this.config.periodsPerDay; period++) {
			if (this.timetable[classId][day][period] === null) {
				available.push(period);
				if (available.length >= count) {
					break;
				}
			}
		}
		return available;
	}

	findBestTeacher(teachers, periods, day) {
		// Simple teacher selection - can be enhanced with more sophisticated logic
		for (const teacher of teachers) {
			// Check if teacher is available for all required periods
			let available = true;
			for (const period of periods) {
				if (this.teacherSchedule[teacher.teacherId] && 
					this.teacherSchedule[teacher.teacherId][day] && 
					this.teacherSchedule[teacher.teacherId][day][period]) {
					available = false;
					break;
				}
			}
			
			if (available) {
				return teacher;
			}
		}
		return null;
	}

	async saveTimetable(teachers, subjects, classes) {
		const timetableDoc = new Timetable({
			schoolConfig: this.config,
			timetable: this.timetable,
			teacherSchedule: this.teacherSchedule,
			generationStatus: 'completed',
			generationLog: this.log,
			stats: {
				totalClasses: classes.length,
				totalTeachers: teachers.length,
				totalSubjects: subjects.length,
				conflicts: this.conflicts.length,
				unassignedPeriods: this.unassignedPeriods.length
			}
		});
		
		// Remove old timetables
		await Timetable.deleteMany({});
		
		return await timetableDoc.save();
	}
}

export default TimetableGenerator;
