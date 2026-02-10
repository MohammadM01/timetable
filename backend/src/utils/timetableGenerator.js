import Teacher from '../models/Teacher.js';
import Subject from '../models/Subject.js';
import Class from '../models/Class.js';
import TeacherSubject from '../models/TeacherSubject.js';
import Timetable from '../models/Timetable.js';
import AIPreferenceParser from './aiPreferenceParser.js';

class TimetableGenerator {
	constructor(config = {}) {
		this.config = {
			daysPerWeek: config.daysPerWeek || 6, // Include Saturday
			periodsPerDay: config.periodsPerDay || 8,
			periodDuration: config.periodDuration || 45,
			startTime: config.startTime || '08:00',
			recessAfterPeriod: config.recessAfterPeriod || 4, // Add recess after 4th period
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

			// Add randomization seed to ensure different timetables
			this.randomSeed = Date.now() + Math.random() * 1000;
			this.log.push(`Using randomization seed: ${this.randomSeed}`);

			// Parse custom preferences using AI
			const parser = new AIPreferenceParser(this.config.customPreferences);
			this.rules = await parser.parse();

			if (Object.keys(this.rules.excludedDays).length > 0 || this.rules.consecutive.length > 0) {
				this.log.push('Applied AI-interpreted custom preferences');
			}

			// Fetch all data
			const [teachers, subjects, classes, teacherSubjects] = await Promise.all([
				Teacher.find({}).lean(),
				Subject.find({}).lean(),
				Class.find({}).lean(),
				TeacherSubject.find({}).lean()
			]);

			// Use target classes if specified, otherwise use all classes
			const classesToProcess = this.targetClasses || classes;

			// Shuffle classes to process them in different order each time
			const shuffledClasses = this.shuffleArray([...classesToProcess]);

			this.log.push(`Found ${teachers.length} teachers, ${subjects.length} subjects, ${classes.length} total classes`);
			this.log.push(`Generating timetable for ${shuffledClasses.length} selected classes`);

			// Initialize timetable structure
			this.initializeTimetable(shuffledClasses);

			// Group subjects by standard
			const subjectsByStandard = this.groupSubjectsByStandard(subjects);

			// Create teacher-subject mapping
			const teacherSubjectMap = this.createTeacherSubjectMap(teacherSubjects, teachers);

			// Generate timetable for each class
			for (const classData of shuffledClasses) {
				await this.generateClassTimetable(classData, subjectsByStandard[classData.standard] || [], teacherSubjectMap);
			}

			// Save to database
			const timetableDoc = await this.saveTimetable(teachers, subjects, shuffledClasses);

			this.log.push('Timetable generation completed successfully');
			return timetableDoc;

		} catch (error) {
			this.log.push(`Error: ${error.message}`);
			throw error;
		}
	}

	shuffleArray(array) {
		// Fisher-Yates shuffle algorithm with seeded random
		const shuffled = [...array];
		let currentIndex = shuffled.length;

		// Use seeded random for consistent but different results
		const seededRandom = () => {
			this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
			return this.randomSeed / 233280;
		};

		while (currentIndex > 0) {
			const randomIndex = Math.floor(seededRandom() * currentIndex);
			currentIndex--;

			// Swap elements
			[shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
		}

		return shuffled;
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

		// Shuffle subjects to add randomization
		const shuffledSubjects = this.shuffleArray([...subjects]);

		// Create period allocation plan
		const periodPlan = this.createPeriodPlan(shuffledSubjects);

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
			let periods = subject.weekly_periods;

			// Check if we need to force daily (increase periods if needed)
			const forceDaily = this.rules.forceDaily.find(rule => rule.subject.toLowerCase() === subject.subject_name.toLowerCase());
			const excluded = this.rules.excludedDays.filter(rule => rule.subject.toLowerCase() === subject.subject_name.toLowerCase());
			const excludedDayIndices = excluded.map(r => r.days).flat();

			if (forceDaily) {
				// Calculate how many days are available
				const availableDaysCount = this.config.daysPerWeek - excludedDayIndices.length;
				if (periods < availableDaysCount) {
					// User wants daily, but DB has less periods. We trust user preference?
					// For now, let's keep DB periods but try to spread them as much as possible.
				}
			}

			if (periods <= 0) continue;

			const distribution = [];
			let remainingPeriods = periods;

			// Handle PRE-ALLOCATION for Consecutive Rules
			const consecutiveRules = this.rules.consecutive.filter(rule => rule.subject.toLowerCase() === subject.subject_name.toLowerCase());

			for (const rule of consecutiveRules) {
				if (remainingPeriods >= rule.count && !excludedDayIndices.includes(rule.day)) {
					distribution.push({ day: rule.day, periods: rule.count, consecutive: true });
					remainingPeriods -= rule.count;
				}
			}

			// Distribute remaining periods
			if (remainingPeriods > 0) {
				const availableDays = [];
				for (let d = 1; d <= this.config.daysPerWeek; d++) {
					// Skip if day is excluded
					if (excludedDayIndices.includes(d)) continue;

					// Skip if day already has allocation (from consecutive rule)
					// Unless we want to add more? For now, simple logic: one block per subject per day usually.
					if (distribution.find(dist => dist.day === d)) continue;

					availableDays.push(d);
				}

				// Shuffle available days
				const shuffledDays = this.shuffleArray(availableDays);

				// Distribute one by one
				let i = 0;
				while (remainingPeriods > 0 && availableDays.length > 0) {
					// If we run out of unique days, loop back or add to existing?
					// Logic: Fill all available days with 1 period first.
					if (i < availableDays.length) {
						distribution.push({ day: availableDays[i], periods: 1 });
						remainingPeriods--;
						i++;
					} else {
						// Add to existing distributions
						// Find a day that is not excluded and already has periods
						// Ideally shortest day
						const candidate = distribution.find(d => !d.consecutive && !excludedDayIndices.includes(d.day));
						if (candidate) {
							candidate.periods++;
							remainingPeriods--;
						} else {
							// If all are consecutive or excluded, we might be stuck 
							// Just pick first available non-excluded
							const anyDay = distribution.find(d => !excludedDayIndices.includes(d.day));
							if (anyDay) {
								anyDay.periods++;
								remainingPeriods--;
							} else {
								// Cannot place
								break;
							}
						}
					}
				}
			}

			plan.push({
				subject,
				distribution,
				totalPeriods: periods
			});
		}

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

		let totalAllocated = 0;

		// Try to allocate periods for each day
		for (const dayAllocation of distribution) {
			const { day, periods } = dayAllocation;

			// Find available periods for this day with better strategy
			let availablePeriods;
			if (dayAllocation.consecutive) {
				availablePeriods = this.findAvailablePeriodsConsecutive(classData._id, day, periods);
			} else {
				availablePeriods = this.findAvailablePeriodsOptimized(classData._id, day, periods);
			}

			if (availablePeriods.length < periods) {
				this.log.push(`Not enough periods available for ${subject.subject_name} on day ${day} (needed: ${periods}, found: ${availablePeriods.length})`);
				continue;
			}

			// Find best teacher for these periods with overlap prevention
			const teacher = this.findBestTeacherWithOverlapCheck(availableTeachers, availablePeriods, day);

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

				totalAllocated++;
			}
		}

		// If we couldn't allocate all periods, try to fill remaining gaps
		if (totalAllocated < allocation.totalPeriods) {
			this.log.push(`Only allocated ${totalAllocated}/${allocation.totalPeriods} periods for ${subject.subject_name}`);
			await this.fillRemainingPeriods(classData, subject, allocation.totalPeriods - totalAllocated, teacherSubjectMap);
		}

		return totalAllocated > 0;
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

	findAvailablePeriodsOptimized(classId, day, count) {
		const available = [];
		for (let period = 1; period <= this.config.periodsPerDay; period++) {
			if (this.timetable[classId][day][period] === null) {
				available.push(period);
			}
		}

		// If we have enough periods, try to fill gaps first
		if (available.length >= count) {
			// Prioritize filling gaps in the middle of the day
			const sortedAvailable = available.sort((a, b) => {
				// Prefer periods that are surrounded by occupied periods
				const aHasNeighbors = this.hasOccupiedNeighbors(classId, day, a);
				const bHasNeighbors = this.hasOccupiedNeighbors(classId, day, b);

				if (aHasNeighbors && !bHasNeighbors) return -1;
				if (!aHasNeighbors && bHasNeighbors) return 1;

				// If both or neither have neighbors, prefer earlier periods
				return a - b;
			});

			return sortedAvailable.slice(0, count);
		}

		return available;
	}

	findAvailablePeriodsConsecutive(classId, day, count) {
		// Look for 'count' null slots in a row
		const slots = this.timetable[classId][day];
		for (let period = 1; period <= this.config.periodsPerDay - count + 1; period++) {
			let isConsecutive = true;
			for (let i = 0; i < count; i++) {
				if (slots[period + i] !== null) {
					isConsecutive = false;
					break;
				}
				// Optional: Check Recess break?
				// If recess is after period 4, and we want 4 and 5, it spans recess. Usually allowed.
			}

			if (isConsecutive) {
				const result = [];
				for (let i = 0; i < count; i++) {
					result.push(period + i);
				}
				return result;
			}
		}
		return [];
	}

	hasOccupiedNeighbors(classId, day, period) {
		const prevPeriod = period - 1;
		const nextPeriod = period + 1;

		const prevOccupied = prevPeriod >= 1 && this.timetable[classId][day][prevPeriod] !== null;
		const nextOccupied = nextPeriod <= this.config.periodsPerDay && this.timetable[classId][day][nextPeriod] !== null;

		return prevOccupied || nextOccupied;
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

	findBestTeacherWithOverlapCheck(teachers, periods, day) {
		// Enhanced teacher selection with better overlap prevention
		const availableTeachers = [];

		for (const teacher of teachers) {
			let conflicts = 0;
			let availablePeriods = 0;

			for (const period of periods) {
				if (this.teacherSchedule[teacher.teacherId] &&
					this.teacherSchedule[teacher.teacherId][day] &&
					this.teacherSchedule[teacher.teacherId][day][period]) {
					conflicts++;
				} else {
					availablePeriods++;
				}
			}

			if (availablePeriods === periods.length) {
				// Teacher is completely available
				return teacher;
			} else if (availablePeriods > 0) {
				// Teacher has some availability
				availableTeachers.push({
					teacher,
					conflicts,
					availablePeriods,
					score: availablePeriods - conflicts * 2 // Penalize conflicts heavily
				});
			}
		}

		// Sort by score (highest first) and return the best teacher
		if (availableTeachers.length > 0) {
			availableTeachers.sort((a, b) => b.score - a.score);
			return availableTeachers[0].teacher;
		}

		return null;
	}

	async fillRemainingPeriods(classData, subject, remainingPeriods, teacherSubjectMap) {
		const key = `${classData.standard}-${subject.subject_name}`;
		const availableTeachers = teacherSubjectMap[key] || [];

		if (availableTeachers.length === 0) return;

		// Try to fill remaining periods across all days
		for (let day = 1; day <= this.config.daysPerWeek; day++) {
			if (remainingPeriods <= 0) break;

			const availablePeriods = this.findAvailablePeriodsOptimized(classData._id, day, remainingPeriods);
			if (availablePeriods.length === 0) continue;

			const teacher = this.findBestTeacherWithOverlapCheck(availableTeachers, availablePeriods, day);
			if (!teacher) continue;

			// Allocate available periods
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

				remainingPeriods--;
				if (remainingPeriods <= 0) break;
			}
		}
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

	// Get teacher timetable from generated schedule
	getTeacherTimetable(teacherId) {
		return this.teacherSchedule[teacherId] || {};
	}

	// Get all teacher timetables
	getAllTeacherTimetables() {
		return this.teacherSchedule;
	}
}

export default TimetableGenerator;
