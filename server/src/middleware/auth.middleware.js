import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

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

function requireRole(role) {
	return async (req, res, next) => {
		try {
			const result = await pool.query('SELECT id, role FROM app_users WHERE id = $1', [req.auth.userId]);
			const user = result.rows[0];

			if (!user || user.role !== role) {
				return res.status(403).json({ message: `${role[0].toUpperCase()}${role.slice(1)} access required` });
			}

			req.currentUser = user;
			return next();
		} catch (error) {
			return next(error);
		}
	};
}

export const requireDoctor = requireRole('doctor');
export const requirePatient = requireRole('patient');
