import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
	standard: { type: String, required: true, trim: true },
	subject_name: { type: String, required: true, trim: true },
	weekly_periods: { type: Number, default: 0 },
	consecutive_periods: { type: Boolean, default: false }
}, { timestamps: true });

subjectSchema.index({ standard: 1, subject_name: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);



