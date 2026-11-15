import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();
const authCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax',
	path: '/',
	maxAge: 24 * 60 * 60 * 1000,
};

const passwordSchema = z.string().min(8).refine(
	(password) => Buffer.byteLength(password, 'utf8') <= 72,
	'Password must be no more than 72 bytes',
);

const registerSchema = z.object({
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(255),
	password: passwordSchema,
});

const loginSchema = z.object({
	email: z.string().trim().email().max(255),
	password: passwordSchema,
});

function createToken(userId) {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error('JWT_SECRET is not configured');
	}

	return jwt.sign({ userId }, secret, { expiresIn: '1d' });
}

router.post('/reg', async (req, res, next) => {
	if (!process.env.JWT_SECRET) {
		return res.status(500).json({ message: 'Authentication is not configured' });
	}

	const parsed = registerSchema.safeParse(req.body ?? {});
	if (!parsed.success) {
		const validationErrors = parsed.error.issues.map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
		}));

		console.warn('[auth.register] Validation failed:', validationErrors);
		return res.status(400).json({
			message: 'Invalid registration details',
			errors: validationErrors,
		});
	}

	const name = parsed.data.name;
	const email = parsed.data.email.toLowerCase();
	const passwordHash = await bcrypt.hash(parsed.data.password, 7);

	try {
		const result = await pool.query(
			`INSERT INTO app_users (name, email, password_hash)
			 VALUES ($1, $2, $3)
			 RETURNING id, name, email, role, created_at`,
			[name, email, passwordHash],
		);

		const user = result.rows[0];
		res.cookie('auth_token', createToken(user.id), authCookieOptions);
		return res.status(201).json({ message: 'Account created successfully', user });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ message: 'An account with this email already exists' });
		}
		return next(error);
	}
});

router.post('/login', async (req, res, next) => {
	if (!process.env.JWT_SECRET) {
		return res.status(500).json({ message: 'Authentication is not configured' });
	}

	const parsed = loginSchema.safeParse(req.body ?? {});
	if (!parsed.success) {
		return res.status(400).json({ message: 'Invalid email or password' });
	}

	try {
		const result = await pool.query(
			`SELECT id, name, email, role, password_hash, created_at
			 FROM app_users
			 WHERE LOWER(email) = LOWER($1)
			 LIMIT 1`,
			[parsed.data.email],
		);

		const user = result.rows[0];
		if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const { password_hash: passwordHash, ...safeUser } = user;
		res.cookie('auth_token', createToken(user.id), authCookieOptions);
		return res.status(200).json({ message: 'Logged in successfully', user: safeUser });
	} catch (error) {
		return next(error);
	}
});

router.get('/me', requireAuth, async (req, res, next) => {
	try {
		const result = await pool.query(
			`SELECT id, name, email, role, created_at
			 FROM app_users
			 WHERE id = $1`,
			[req.auth.userId],
		);

		if (!result.rows[0]) {
			return res.status(401).json({ message: 'User account not found' });
		}

		return res.status(200).json({ user: result.rows[0] });
	} catch (error) {
		return next(error);
	}
});

router.post('/logout', requireAuth, (req, res) => {
	const { maxAge, ...clearOptions } = authCookieOptions;
	res.clearCookie('auth_token', clearOptions);
	res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
