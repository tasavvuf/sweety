import express from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { requireAuth, requireDoctor, requirePatient } from '../middleware/auth.middleware.js';

const router = express.Router();

function isCalendarDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);

	return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const patientIdSchema = z.object({ id: z.uuid('Invalid patient ID') });
const requestSchema = z.object({ patient_id: z.uuid('Invalid patient ID') });
const dateSchema = z.object({
	date: z.string().refine(isCalendarDate, 'Date must be a valid YYYY-MM-DD date'),
});

function validationError(res, parsed) {
	return res.status(400).json({
		success: false,
		message: 'Invalid request details',
		errors: parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
	});
}

function positiveInteger(value, fallback) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function acceptedRelationship(doctorId, patientId) {
	const result = await pool.query(
		`SELECT id FROM doctor_patients
		 WHERE doctor_id = $1 AND patient_id = $2 AND status = 'accepted'`,
		[doctorId, patientId],
	);

	return result.rows[0];
}

async function dailyPatientSummary(doctorId, patientId, date) {
	const result = await pool.query(
		`SELECT MAX(r.value_mg_dl) AS highest,
				MIN(r.value_mg_dl) AS lowest,
				AVG(r.value_mg_dl)::float AS average,
				COUNT(*)::int AS total_readings
		 FROM glucose_readings r
		 JOIN doctor_patients dp ON dp.patient_id = r.user_id
		 WHERE dp.doctor_id = $1
			AND dp.patient_id = $2
			AND dp.status = 'accepted'
			AND r.reading_date = $3::date`,
		[doctorId, patientId, date],
	);

	return result.rows[0];
}

router.use(requireAuth);

router.post('/patients/request', requireDoctor, async (req, res) => {
	const parsed = requestSchema.safeParse(req.body ?? {});
	if (!parsed.success) return validationError(res, parsed);

	try {
		const patient = await pool.query(
			`SELECT id FROM app_users WHERE id = $1 AND role = 'patient'`,
			[parsed.data.patient_id],
		);
		if (!patient.rows[0]) {
			return res.status(404).json({ success: false, message: 'Patient not found' });
		}

		const result = await pool.query(
			`INSERT INTO doctor_patients (doctor_id, patient_id)
			 VALUES ($1, $2)
			 RETURNING *`,
			[req.auth.userId, parsed.data.patient_id],
		);

		return res.status(201).json({ success: true, relationship: result.rows[0] });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(409).json({ success: false, message: 'An access request already exists for this patient' });
		}
		console.error('Doctor request failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to request patient access' });
	}
});

router.get('/patients', requireDoctor, async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT dp.id, dp.status, dp.created_at,
				p.id AS patient_id, p.name AS patient_name, p.email AS patient_email
			 FROM doctor_patients dp
			 JOIN app_users p ON p.id = dp.patient_id
			 WHERE dp.doctor_id = $1
			 ORDER BY dp.created_at DESC`,
			[req.auth.userId],
		);

		return res.status(200).json({ success: true, patients: result.rows });
	} catch (error) {
		console.error('Doctor patients failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get patients' });
	}
});

router.patch('/patients/:id/accept', requirePatient, async (req, res) => {
	const parsed = patientIdSchema.safeParse(req.params);
	if (!parsed.success) return validationError(res, parsed);

	try {
		const result = await pool.query(
			`UPDATE doctor_patients
			 SET status = 'accepted'
			 WHERE id = $1 AND patient_id = $2 AND status = 'pending'
			 RETURNING *`,
			[parsed.data.id, req.auth.userId],
		);
		if (!result.rows[0]) {
			return res.status(404).json({ success: false, message: 'Pending access request not found' });
		}

		return res.status(200).json({ success: true, relationship: result.rows[0] });
	} catch (error) {
		console.error('Accept request failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to accept access request' });
	}
});

router.patch('/patients/:id/reject', requirePatient, async (req, res) => {
	const parsed = patientIdSchema.safeParse(req.params);
	if (!parsed.success) return validationError(res, parsed);

	try {
		const result = await pool.query(
			`UPDATE doctor_patients
			 SET status = 'rejected'
			 WHERE id = $1 AND patient_id = $2 AND status = 'pending'
			 RETURNING *`,
			[parsed.data.id, req.auth.userId],
		);
		if (!result.rows[0]) {
			return res.status(404).json({ success: false, message: 'Pending access request not found' });
		}

		return res.status(200).json({ success: true, relationship: result.rows[0] });
	} catch (error) {
		console.error('Reject request failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to reject access request' });
	}
});

router.get('/patients/:id/readings', requireDoctor, async (req, res) => {
	const parsed = patientIdSchema.safeParse(req.params);
	if (!parsed.success) return validationError(res, parsed);

	const page = positiveInteger(req.query.page, 1);
	const limit = Math.min(50, positiveInteger(req.query.limit, 10));
	const offset = (page - 1) * limit;

	try {
		if (!(await acceptedRelationship(req.auth.userId, parsed.data.id))) {
			return res.status(403).json({ success: false, message: 'Accepted patient relationship required' });
		}

		const [countResult, readingsResult] = await Promise.all([
			pool.query(
				`SELECT COUNT(*)::int AS total_records
				 FROM glucose_readings r
				 JOIN doctor_patients dp ON dp.patient_id = r.user_id
				 WHERE dp.doctor_id = $1 AND dp.patient_id = $2 AND dp.status = 'accepted'`,
				[req.auth.userId, parsed.data.id],
			),
			pool.query(
				`SELECT r.*
				 FROM glucose_readings r
				 JOIN doctor_patients dp ON dp.patient_id = r.user_id
				 WHERE dp.doctor_id = $1 AND dp.patient_id = $2 AND dp.status = 'accepted'
				 ORDER BY r.reading_date DESC, r.created_at DESC, r.id DESC
				 LIMIT $3 OFFSET $4`,
				[req.auth.userId, parsed.data.id, limit, offset],
			),
		]);

		const totalRecords = countResult.rows[0].total_records;
		const totalPages = Math.ceil(totalRecords / limit);
		return res.status(200).json({
			success: true,
			readings: readingsResult.rows,
			pagination: {
				currentPage: page,
				limit,
				totalRecords,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		});
	} catch (error) {
		console.error('Doctor patient readings failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get patient readings' });
	}
});

router.get('/patients/:id/reports', requireDoctor, async (req, res) => {
	const patient = patientIdSchema.safeParse(req.params);
	const date = dateSchema.safeParse(req.query);
	if (!patient.success) return validationError(res, patient);
	if (!date.success) return validationError(res, date);

	try {
		if (!(await acceptedRelationship(req.auth.userId, patient.data.id))) {
			return res.status(403).json({ success: false, message: 'Accepted patient relationship required' });
		}

		const selectedDate = date.data.date;
		const [daily, monthToDate, previousMonth] = await Promise.all([
			dailyPatientSummary(req.auth.userId, patient.data.id, selectedDate),
			pool.query(
				`SELECT MAX(r.value_mg_dl) AS highest, MIN(r.value_mg_dl) AS lowest,
					AVG(r.value_mg_dl)::float AS average, COUNT(*)::int AS total_readings
				 FROM glucose_readings r
				 JOIN doctor_patients dp ON dp.patient_id = r.user_id
				 WHERE dp.doctor_id = $1 AND dp.patient_id = $2 AND dp.status = 'accepted'
					AND r.reading_date >= date_trunc('month', $3::date)::date
					AND r.reading_date <= $3::date`,
				[req.auth.userId, patient.data.id, selectedDate],
			),
			pool.query(
				`SELECT MAX(r.value_mg_dl) AS highest, MIN(r.value_mg_dl) AS lowest,
					AVG(r.value_mg_dl)::float AS average, COUNT(*)::int AS total_readings
				 FROM glucose_readings r
				 JOIN doctor_patients dp ON dp.patient_id = r.user_id
				 WHERE dp.doctor_id = $1 AND dp.patient_id = $2 AND dp.status = 'accepted'
					AND r.reading_date >= (date_trunc('month', $3::date) - INTERVAL '1 month')::date
					AND r.reading_date < date_trunc('month', $3::date)::date`,
				[req.auth.userId, patient.data.id, selectedDate],
			),
		]);

		return res.status(200).json({
			success: true,
			daily,
			month_to_date: monthToDate.rows[0],
			previous_month: previousMonth.rows[0],
		});
	} catch (error) {
		console.error('Doctor patient reports failed:', error);
		return res.status(500).json({ success: false, message: 'Unable to get patient reports' });
	}
});

export default router;
