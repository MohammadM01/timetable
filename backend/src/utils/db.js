import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/timetable';

export async function connectToDatabase() {
	console.log(`Connecting to MongoDB at ${mongoUri}...`);
	try {
		await mongoose.connect(mongoUri);
		console.log('✅ Connected to MongoDB successfully.');
	} catch (err) {
		console.error('❌ Failed to connect to MongoDB:', err);
		throw err;
	}
}
