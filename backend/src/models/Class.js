import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
	standard: { type: String, required: true, trim: true },
	division: { type: String, required: true, trim: true },
	full_name: { type: String, required: true, trim: true }
}, { timestamps: true });

classSchema.index({ standard: 1, division: 1 }, { unique: true });

export default mongoose.model('Class', classSchema);



