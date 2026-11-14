import jwt from 'jsonwebtoken';

function getAuthCookie(header) {
	for (const part of header?.split(';') ?? []) {
		const separatorIndex = part.indexOf('=');
		if (separatorIndex < 0 || part.slice(0, separatorIndex).trim() !== 'auth_token') {
			continue;
		}

		try {
			return decodeURIComponent(part.slice(separatorIndex + 1).trim());
		} catch {
			return undefined;
		}
	}

	return undefined;
}

export function requireAuth(req, res, next) {
	const token = getAuthCookie(req.get('cookie'));
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		return res.status(500).json({ message: 'Authentication is not configured' });
	}

	if (!token) {
		return res.status(401).json({ message: 'Authentication required' });
	}

	try {
		req.auth = jwt.verify(token, secret);
		return next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}