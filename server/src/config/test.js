import { pool } from "./db.js";

const result = await pool.query("SELECT * FROM app_users");

console.log(result.rows);