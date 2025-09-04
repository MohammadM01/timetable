import mongoose from 'mongoose';

const teacherSubjectSchema = new mongoose.Schema({
	teacherId: { type: Number, required: true, ref: 'Teacher' },
	teacherName: { type: String, required: true },
	subjectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Subject' },
	subjectName: { type: String, required: true },
	standard: { type: String, required: true },
	// Additional constraints
	preferredPeriods: [{ type: Number }], // 1-8 for periods
	avoidPeriods: [{ type: Number }],
	consecutivePeriods: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure unique teacher-subject-standard combination
teacherSubjectSchema.index({ teacherId: 1, subjectId: 1, standard: 1 }, { unique: true });

export default mongoose.model('TeacherSubject', teacherSubjectSchema);
