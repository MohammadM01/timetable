import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
	// Numeric id used by frontend
	id: { type: Number, index: true, unique: true },
	name: { type: String, required: true, trim: true },
	weeklyPeriods: { type: Number, default: 20 },
	dailyPeriods: { type: Number, default: 5 }
}, { timestamps: true });

// Single unique index on name
teacherSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Teacher', teacherSchema);


