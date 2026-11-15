import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { createUser, dateOffset, deleteUsers, insertReading, loginAs } from './helpers.js';
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

describe('patient readings', () => {
	it('requires authentication to create a reading', async () => {
		const response = await request(app).post('/api/readings').send({
			reading_date: dateOffset(1),
			slot: 'Morning',
			value_mg_dl: 110,
		});

		expect(response.status).toBe(401);
	});

	it('creates a valid reading', async () => {
		const response = await patientAgent.post('/api/readings').send({
			reading_date: dateOffset(1),
			slot: 'Morning',
			value_mg_dl: 110,
		});

		expect(response.status).toBe(201);
		expect(response.body.reading.user_id).toBe(patient.id);
		expect(response.body.reading.value_mg_dl).toBe(110);
	});

	it.each([39, 601])('rejects glucose value %i outside the allowed range', async (value) => {
		const response = await patientAgent.post('/api/readings').send({
			reading_date: dateOffset(1),
			slot: 'Morning',
			value_mg_dl: value,
		});

		expect(response.status).toBe(400);
	});

	it('rejects future reading dates', async () => {
		const response = await patientAgent.post('/api/readings').send({
			reading_date: dateOffset(-1),
			slot: 'Morning',
			value_mg_dl: 110,
		});

		expect(response.status).toBe(400);
	});

	it('rejects a duplicate daily time slot', async () => {
		const reading = {
			reading_date: dateOffset(1),
			slot: 'Morning',
			value_mg_dl: 110,
		};
		const first = await patientAgent.post('/api/readings').send(reading);
		const duplicate = await patientAgent.post('/api/readings').send(reading);

		expect(first.status).toBe(201);
		expect(duplicate.status).toBe(409);
	});

	it('prevents one patient from reading, updating, or deleting another patient\'s reading', async () => {
		const otherPatient = await createUser('patient');
		createdUserIds.push(otherPatient.id);
		const ownedReading = await insertReading(otherPatient.id, {
			date: dateOffset(2),
			value: 123,
		});
		const update = await patientAgent.put(`/api/readings/${ownedReading.id}`).send({
			reading_date: dateOffset(2),
			slot: 'Morning',
			value_mg_dl: 150,
		});

		const read = await patientAgent.get(`/api/readings/${ownedReading.id}`);
		const remove = await patientAgent.delete(`/api/readings/${ownedReading.id}`);
		const stillExists = await pool.query('SELECT id, value_mg_dl FROM glucose_readings WHERE id = $1', [ownedReading.id]);

		expect(read.status).toBe(404);
		expect(update.status).toBe(404);
		expect(remove.status).toBe(404);
		expect(stillExists.rows[0]).toMatchObject({ id: ownedReading.id, value_mg_dl: 123 });
	});
});