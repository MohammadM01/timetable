import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, trim: true },
	passwordHash: { type: String, required: true },
	role: { type: String, default: 'admin' }
}, { timestamps: true });

userSchema.methods.verifyPassword = function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model('User', userSchema);



