import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
	// School configuration
	schoolConfig: {
		daysPerWeek: { type: Number, default: 6 }, // Include Saturday
		periodsPerDay: { type: Number, default: 8 },
		periodDuration: { type: Number, default: 45 }, // minutes
		startTime: { type: String, default: '08:00' },
		recessAfterPeriod: { type: Number, default: 4 } // Add recess after 4th period
	},
	
	// Generated timetable data
	timetable: {
		// Structure: { classId: { day: { period: { subject, teacher, room } } } }
		type: mongoose.Schema.Types.Mixed,
		default: {}
	},
	
	// Teacher assignments: { teacherId: { day: { period: { classId, subject } } } }
	teacherSchedule: {
		type: mongoose.Schema.Types.Mixed,
		default: {}
	},
	
	// Generation metadata
	generatedAt: { type: Date, default: Date.now },
	generationStatus: { 
		type: String, 
		enum: ['pending', 'generating', 'completed', 'failed'], 
		default: 'pending' 
	},
	generationLog: [String],
	
	// Statistics
	stats: {
		totalClasses: { type: Number, default: 0 },
		totalTeachers: { type: Number, default: 0 },
		totalSubjects: { type: Number, default: 0 },
		conflicts: { type: Number, default: 0 },
		unassignedPeriods: { type: Number, default: 0 }
	}
}, { timestamps: true });

// Index for quick lookups
timetableSchema.index({ generatedAt: -1 });
timetableSchema.index({ generationStatus: 1 });

export default mongoose.model('Timetable', timetableSchema);
