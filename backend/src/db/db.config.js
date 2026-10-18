import mysql from "mysql2/promise";
import "dotenv/config.js";

const isLocal = ["localhost", "127.0.0.1"].includes(process.env.DB_HOST);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  ssl: { rejectUnauthorized: false },
});
export default pool;
