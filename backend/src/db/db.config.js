import mysql from "mysql2/promise";
import "dotenv/config.js";

const isLocal = ["localhost", "127.0.0.1"].includes(process.env.DB_HOST);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "chatgpt_clone2",
  charset: "utf8mb4",
  ssl: isLocal
    ? undefined
    : { minVersion: "TLSv1.2", rejectUnauthorized: true },
  // ...ሌሎች ነባር ቅንብሮችዎን ያቆዩ
});
export default db;
