import './config/env.js';
import app from './app.js';
import { pool } from './config/db.js';

const port = process.env.PORT || 3000;

try {
	await pool.query('SELECT 1');
	console.log('Connected to PostgreSQL');

	const server = app.listen(port, () => {
		console.log(`Server listening on port ${port}`);
	});

	server.on('error', async (error) => {
		console.error('Failed to start HTTP server:', error.message);
		await pool.end();
		process.exitCode = 1;
	});
} catch (error) {
	console.error('Failed to connect to PostgreSQL. HTTP server was not started.');
	console.error(`Database error (${error.code ?? 'unknown'}): ${error.message}`);
	await pool.end();
	process.exitCode = 1;
}