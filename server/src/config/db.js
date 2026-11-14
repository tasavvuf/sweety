import pg from "pg";
import './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (error) => {
	console.error('Unexpected PostgreSQL pool error:', error.message);
});