import express from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

function isCalendarDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);

	return date.getFullYear() === year
		&& date.getMonth() === month - 1
		&& date.getDate() === day;
}

const dateQuerySchema = z.object({
	date: z.string().refine(isCalendarDate, 'Date must be a valid YYYY-MM-DD date'),
});

function invalidDate(res, parsed) {
	return res.status(400).json({
		success: false,
		message: 'Invalid date',
		errors: parsed.error.issues.map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
		})),
	});
}

async function getDailySummary(userId, date) {
	const result = await pool.query(
		`SELECT MAX(value_mg_dl) AS highest,
				MIN(value_mg_dl) AS lowest,
				AVG(value_mg_dl)::float AS average,
				COUNT(*)::int AS total_readings
		 FROM glucose_readings
		 WHERE user_id = $1 AND reading_date = $2::date`,
		[userId, date],
	);

	return result.rows[0];
}

router.use(requireAuth);

router.get('/daily', async (req, res) => {
	const parsed = dateQuerySchema.safeParse(req.query);
	if (!parsed.success) return invalidDate(res, parsed);

	try {
		const { date } = parsed.data;
		const [summary, readings] = await Promise.all([
			getDailySummary(req.auth.userId, date),
			pool.query(
				`SELECT id, reading_date, slot, value_mg_dl, created_at, updated_at
				 FROM glucose_readings
				 WHERE user_id = $1 AND reading_date = $2::date
				 ORDER BY created_at ASC`,
				[req.auth.userId, date],
			),
		]);

		return res.status(200).json({ success: true, ...summary, readings: readings.rows });
	} catch (error) {
		console.error('Daily report failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get report' });
	}
});

router.get('/month-to-date', async (req, res) => {
	const parsed = dateQuerySchema.safeParse(req.query);
	if (!parsed.success) return invalidDate(res, parsed);

	try {
		const { date } = parsed.data;
		const result = await pool.query(
			`SELECT MAX(value_mg_dl) AS highest,
				MIN(value_mg_dl) AS lowest,
				AVG(value_mg_dl)::float AS average,
				COUNT(*)::int AS total_readings
			 FROM glucose_readings
			 WHERE user_id = $1
				AND reading_date >= date_trunc('month', $2::date)::date
				AND reading_date <= $2::date`,
			[req.auth.userId, date],
		);

		return res.status(200).json({ success: true, ...result.rows[0] });
	} catch (error) {
		console.error('Month-to-date report failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get report' });
	}
});

router.get('/previous-month', async (req, res) => {
	const parsed = dateQuerySchema.safeParse(req.query);
	if (!parsed.success) return invalidDate(res, parsed);

	try {
		const { date } = parsed.data;
		const result = await pool.query(
			`SELECT MAX(value_mg_dl) AS highest,
				MIN(value_mg_dl) AS lowest,
				AVG(value_mg_dl)::float AS average,
				COUNT(*)::int AS total_readings
			 FROM glucose_readings
			 WHERE user_id = $1
				AND reading_date >= (date_trunc('month', $2::date) - INTERVAL '1 month')::date
				AND reading_date < date_trunc('month', $2::date)::date`,
			[req.auth.userId, date],
		);

		return res.status(200).json({ success: true, ...result.rows[0] });
	} catch (error) {
		console.error('Previous-month report failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get report' });
	}
});

export default router;
