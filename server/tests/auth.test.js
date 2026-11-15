import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { createUser, deleteUsers, testPassword, uniqueEmail } from './helpers.js';

const createdUserIds = [];

afterEach(async () => {
	await deleteUsers(createdUserIds.splice(0));
});

describe('authentication', () => {
	it('registers a patient and sets an auth cookie', async () => {
		const response = await request(app).post('/api/auth/reg').send({
			name: 'Test Patient',
			email: uniqueEmail('register'),
			password: testPassword,
		});

		expect(response.status).toBe(201);
		expect(response.body.user.role).toBe('patient');
		expect(response.headers['set-cookie'][0]).toContain('auth_token=');
		expect(response.body.user.password_hash).toBeUndefined();
		createdUserIds.push(response.body.user.id);
	});

	it('rejects duplicate email registration', async () => {
		const account = {
			name: 'Duplicate Patient',
			email: uniqueEmail('duplicate'),
			password: testPassword,
		};
		const first = await request(app).post('/api/auth/reg').send(account);
		createdUserIds.push(first.body.user.id);

		const duplicate = await request(app).post('/api/auth/reg').send(account);
		expect(first.status).toBe(201);
		expect(duplicate.status).toBe(409);
	});

	it('does not allow doctor self-registration through the public registration API', async () => {
		const response = await request(app).post('/api/auth/reg').send({
			name: 'Unprivileged Doctor Attempt',
			email: uniqueEmail('doctor-signup'),
			password: testPassword,
			role: 'doctor',
		});

		expect(response.status).toBe(201);
		expect(response.body.user.role).toBe('patient');
		createdUserIds.push(response.body.user.id);
	});

	it('rejects an incorrect password', async () => {
		const user = await createUser();
		createdUserIds.push(user.id);

		const response = await request(app).post('/api/auth/login').send({
			email: user.email,
			password: 'incorrect-password',
		});

		expect(response.status).toBe(401);
	});

	it('rejects missing, malformed, and expired auth tokens', async () => {
		const missing = await request(app).get('/api/auth/me');
		const malformed = await request(app)
			.get('/api/auth/me')
			.set('Cookie', 'auth_token=not-a-jwt');
		const expiredToken = jwt.sign({ userId: '00000000-0000-4000-8000-000000000001' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
		const expired = await request(app)
			.get('/api/auth/me')
			.set('Cookie', `auth_token=${expiredToken}`);

		expect(missing.status).toBe(401);
		expect(malformed.status).toBe(401);
		expect(expired.status).toBe(401);
	});
});