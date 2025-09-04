import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function authRequired(req, res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

export function authOptional(req, _res, next) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (token) {
		try {
			req.user = jwt.verify(token, JWT_SECRET);
		} catch (_) {}
	}
	next();
}

export function signToken(user) {
	return jwt.sign({ id: user._id, username: user.username, role: user.role || 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}







