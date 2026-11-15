import pg from "pg";
import './env.js';

const { Pool } = pg;

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (isTest && !connectionString) {
  throw new Error('TEST_DATABASE_URL is required in test mode; refusing to use the development database.');
}

function databaseIdentity(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return undefined;
  }
}

if (
  isTest
  && process.env.DATABASE_URL
  && databaseIdentity(connectionString) === databaseIdentity(process.env.DATABASE_URL)
) {
  throw new Error('TEST_DATABASE_URL points to the development database; use a separate test database.');
}

const localTestDatabase = isTest && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString).hostname);

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: localTestDatabase ? false : {
    rejectUnauthorized: false,
  },
});

pool.on('error', (error) => {
	console.error('Unexpected PostgreSQL pool error:', error.message);
});