import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

export const testPassword = 'Test-Password-2026!';

export function uniqueEmail(prefix = 'user') {
	return `${prefix}-${randomUUID()}@example.test`;
}

export async function createUser(role = 'patient') {
	const email = uniqueEmail(role);
	const passwordHash = await bcrypt.hash(testPassword, 4);
	const result = await pool.query(
		`INSERT INTO app_users (name, email, password_hash, role)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, name, email, role`,
		[`Test ${role}`, email, passwordHash, role],
	);

	return { ...result.rows[0], password: testPassword };
}

export async function loginAs(user) {
	const agent = request.agent(app);
	const response = await agent.post('/api/auth/login').send({ email: user.email, password: user.password });
	if (response.status !== 200) {
		throw new Error(`Test login failed with status ${response.status}`);
	}
	return agent;
}

export async function insertReading(userId, { date, slot = 'Morning', value = 110 }) {
	const result = await pool.query(
		`INSERT INTO glucose_readings (user_id, reading_date, slot, value_mg_dl)
		 VALUES ($1, $2, $3, $4)
		 RETURNING *`,
		[userId, date, slot, value],
	);
	return result.rows[0];
}

export async function deleteUsers(ids) {
	const userIds = ids.filter(Boolean);
	if (userIds.length) {
		await pool.query('DELETE FROM app_users WHERE id = ANY($1::uuid[])', [userIds]);
	}
}

export function dateOffset(daysAgo) {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function databaseToday() {
	const result = await pool.query("SELECT CURRENT_DATE::text AS date");
	return result.rows[0].date;
}