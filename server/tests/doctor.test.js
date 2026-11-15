import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { createUser, databaseToday, deleteUsers, insertReading, loginAs } from './helpers.js';
import { pool } from '../src/config/db.js';

const createdUserIds = [];

afterEach(async () => {
	await deleteUsers(createdUserIds.splice(0));
});

describe('doctor access', () => {
	it('grants access only after patient approval and blocks it after revocation', async () => {
		const doctor = await createUser('doctor');
		const patient = await createUser('patient');
		const unrelatedPatient = await createUser('patient');
		createdUserIds.push(doctor.id, patient.id, unrelatedPatient.id);
		const doctorAgent = await loginAs(doctor);
		const patientAgent = await loginAs(patient);
		const readingDate = await databaseToday();
		await insertReading(patient.id, { date: readingDate, value: 132 });

		const createdRequest = await doctorAgent.post('/api/doctor/patients/request').send({ patient_id: patient.id });
		expect(createdRequest.status).toBe(201);
		expect(createdRequest.body.relationship.status).toBe('pending');

		const pendingList = await doctorAgent.get('/api/doctor/patients');
		expect(pendingList.status).toBe(200);
		expect(pendingList.body.patients[0]).toMatchObject({ patient_id: patient.id, status: 'pending' });

		const deniedPending = await doctorAgent.get(`/api/doctor/patients/${patient.id}/readings`);
		const deniedUnrelated = await doctorAgent.get(`/api/doctor/patients/${unrelatedPatient.id}/readings`);
		expect(deniedPending.status).toBe(403);
		expect(deniedUnrelated.status).toBe(403);

		const accepted = await patientAgent.patch(`/api/doctor/patients/${createdRequest.body.relationship.id}/accept`);
		expect(accepted.status).toBe(200);
		expect(accepted.body.relationship.status).toBe('accepted');

		const allowedReadings = await doctorAgent.get(`/api/doctor/patients/${patient.id}/readings`);
		const allowedReport = await doctorAgent.get(`/api/doctor/patients/${patient.id}/reports?date=${readingDate}`);
		expect(allowedReadings.status).toBe(200);
		expect(allowedReadings.body.readings).toHaveLength(1);
		expect(allowedReport.status).toBe(200);
		expect(allowedReport.body.daily.total_readings).toBe(1);

		await pool.query("UPDATE doctor_patients SET status = 'rejected' WHERE id = $1", [createdRequest.body.relationship.id]);
		const deniedRevoked = await doctorAgent.get(`/api/doctor/patients/${patient.id}/reports?date=${readingDate}`);
		expect(deniedRevoked.status).toBe(403);
	});

	it('rejects duplicate access requests and prevents patients from using doctor endpoints', async () => {
		const doctor = await createUser('doctor');
		const patient = await createUser('patient');
		createdUserIds.push(doctor.id, patient.id);
		const doctorAgent = await loginAs(doctor);
		const patientAgent = await loginAs(patient);

		const firstRequest = await doctorAgent.post('/api/doctor/patients/request').send({ patient_id: patient.id });
		const duplicateRequest = await doctorAgent.post('/api/doctor/patients/request').send({ patient_id: patient.id });
		const patientRoster = await patientAgent.get('/api/doctor/patients');

		expect(firstRequest.status).toBe(201);
		expect(duplicateRequest.status).toBe(409);
		expect(patientRoster.status).toBe(403);
	});

	it('rejects doctor endpoints without authentication', async () => {
		const response = await request(app).get('/api/doctor/patients');
		expect(response.status).toBe(401);
	});
});