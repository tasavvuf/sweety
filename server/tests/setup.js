import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { afterAll } from 'vitest';

dotenv.config({ path: fileURLToPath(new URL('../.env.test', import.meta.url)) });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'sweety-vitest-only-secret';

if (!process.env.TEST_DATABASE_URL) {
	throw new Error('Create server/.env.test from server/.env.test.example and set TEST_DATABASE_URL before running tests.');
}

const { pool } = await import('../src/config/db.js');

try {
	await pool.query('SELECT id, role FROM app_users LIMIT 0');
	await pool.query('SELECT id, user_id FROM glucose_readings LIMIT 0');
	await pool.query('SELECT id, doctor_id, patient_id FROM doctor_patients LIMIT 0');
} catch (error) {
	await pool.end();
	throw new Error('Test database is unreachable or missing the schema. Apply ../database/schema.sql first.', { cause: error });
}

afterAll(async () => {
	await pool.end();
});