import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { createUser, databaseToday, dateOffset, deleteUsers, insertReading, loginAs } from './helpers.js';
import { pool } from '../src/config/db.js';

const createdUserIds = [];
let patient;
let patientAgent;

beforeEach(async () => {
	patient = await createUser('patient');
	createdUserIds.push(patient.id);
	patientAgent = await loginAs(patient);
});

afterEach(async () => {
	await deleteUsers(createdUserIds.splice(0));
});

describe('reports', () => {
	it('requires authentication and validates report dates', async () => {
		const unauthenticated = await request(app).get('/api/reports/daily?date=2026-01-01');
		const invalid = await patientAgent.get('/api/reports/daily?date=not-a-date');

		expect(unauthenticated.status).toBe(401);
		expect(invalid.status).toBe(400);
	});

	it('returns patient-scoped daily, month-to-date, and previous-month summaries', async () => {
		const today = await databaseToday();
		const otherPatient = await createUser('patient');
		createdUserIds.push(otherPatient.id);

		await insertReading(patient.id, { date: today, slot: 'Morning', value: 100 });
		await insertReading(patient.id, { date: today, slot: 'After breakfast', value: 150 });
		await insertReading(otherPatient.id, { date: today, slot: 'Morning', value: 500 });

		const previousMonthDateResult = await pool.query("SELECT (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' + INTERVAL '10 days')::date::text AS date");
		const previousMonthDate = previousMonthDateResult.rows[0].date;
		await insertReading(patient.id, { date: previousMonthDate, slot: 'Morning', value: 120 });

		const daily = await patientAgent.get(`/api/reports/daily?date=${today}`);
		const monthToDate = await patientAgent.get(`/api/reports/month-to-date?date=${today}`);
		const previousMonth = await patientAgent.get(`/api/reports/previous-month?date=${today}`);

		expect(daily.status).toBe(200);
		expect(daily.body).toMatchObject({ total_readings: 2, highest: 150, lowest: 100, average: 125 });
		expect(daily.body.readings).toHaveLength(2);
		expect(monthToDate.body.total_readings).toBe(2);
		expect(previousMonth.body.total_readings).toBe(1);
	});

	it('uses a date before today when checking the daily report endpoint', async () => {
		const response = await patientAgent.get(`/api/reports/daily?date=${dateOffset(1)}`);
		expect(response.status).toBe(200);
	});
});