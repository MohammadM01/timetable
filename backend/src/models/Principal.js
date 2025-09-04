import mongoose from 'mongoose';

const principalSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	weekly_periods: { type: Number, default: 0 },
	daily_max_periods: { type: Number, default: 5 },
}, { timestamps: true });

export default mongoose.model('Principal', principalSchema);



