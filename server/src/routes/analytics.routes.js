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

const dateSchema = z.object({
	date: z
		.string()
		.transform((val) => (typeof val === 'string' && val.includes('T') ? val.slice(0, 10) : val))
		.refine(isCalendarDate, 'Date must be a valid YYYY-MM-DD date'),
});

const rangeSchema = z.object({
	from: z.string().refine(isCalendarDate, 'From date must be a valid YYYY-MM-DD date'),
	to: z.string().refine(isCalendarDate, 'To date must be a valid YYYY-MM-DD date'),
});

function invalidQuery(res, parsed) {
	return res.status(400).json({
		success: false,
		message: 'Invalid analytics date',
		errors: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
	});
}

function serverError(error, res) {
	console.error('Analytics request failed:', error);
	return res.status(500).json({ success: false, message: 'Unable to get analytics' });
}

router.use(requireAuth);

router.get('/daily', async (req, res) => {
	const parsed = dateSchema.safeParse(req.query);
	if (!parsed.success) return invalidQuery(res, parsed);

	try {
		const result = await pool.query(
			`SELECT slot, value_mg_dl AS value
			 FROM glucose_readings
			 WHERE user_id = $1 AND reading_date = $2::date
			 ORDER BY CASE slot
				WHEN 'Morning' THEN 1
				WHEN 'After breakfast' THEN 2
				WHEN 'After lunch' THEN 3
				WHEN 'After dinner' THEN 4
			 END`,
			[req.auth.userId, parsed.data.date],
		);

		return res.status(200).json({ success: true, date: parsed.data.date, readings: result.rows });
	} catch (error) {
		return serverError(error, res);
	}
});

router.get('/monthly', async (req, res) => {
	const parsed = dateSchema.safeParse(req.query);
	if (!parsed.success) return invalidQuery(res, parsed);

	try {
		const result = await pool.query(
			`SELECT reading_date,
				ROUND(AVG(value_mg_dl)::numeric, 1)::float AS average,
				MAX(value_mg_dl) AS highest,
				MIN(value_mg_dl) AS lowest,
				COUNT(*)::int AS total_readings
			 FROM glucose_readings
			 WHERE user_id = $1
				AND reading_date >= date_trunc('month', $2::date)::date
				AND reading_date <= $2::date
			 GROUP BY reading_date
			 ORDER BY reading_date ASC`,
			[req.auth.userId, parsed.data.date],
		);

		return res.status(200).json({ success: true, readings: result.rows });
	} catch (error) {
		return serverError(error, res);
	}
});

router.get('/distribution', async (req, res) => {
	const parsed = rangeSchema.safeParse(req.query);
	if (!parsed.success) return invalidQuery(res, parsed);
	if (parsed.data.from > parsed.data.to) {
		return res.status(400).json({ success: false, message: 'From date must be before or equal to to date' });
	}

	try {
		const result = await pool.query(
			`WITH buckets(position, label) AS (
				VALUES (1, 'Below 70'), (2, '70–99'), (3, '100–125'), (4, 'Above 125')
			), counts AS (
				SELECT CASE
					WHEN value_mg_dl < 70 THEN 1
					WHEN value_mg_dl <= 99 THEN 2
					WHEN value_mg_dl <= 125 THEN 3
					ELSE 4
				END AS position, COUNT(*)::int AS total
				FROM glucose_readings
				WHERE user_id = $1 AND reading_date BETWEEN $2::date AND $3::date
				GROUP BY 1
			)
			SELECT buckets.label, COALESCE(counts.total, 0)::int AS total
			FROM buckets
			LEFT JOIN counts ON counts.position = buckets.position
			ORDER BY buckets.position`,
			[req.auth.userId, parsed.data.from, parsed.data.to],
		);

		return res.status(200).json({ success: true, distribution: result.rows });
	} catch (error) {
		return serverError(error, res);
	}
});

export default router;
