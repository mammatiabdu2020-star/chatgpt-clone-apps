import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./src/db/db.config.js";
import errorHandler from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();
const PORT = process.env.PORT || 3777;

// 1. Enable CORS for Vite frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// 2. Request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Main API Router
app.use("/api", mainRouter);

// 4. Centralized Error Handling Middleware (must stay after routes)
app.use(errorHandler);

// 5. Database verification and server initialization
async function startServer() {
  try {
    console.log("Connecting to database...");

    // Test database connection pool
    const connection = await db.getConnection();
    console.log("Database connected successfully!");

    if (connection.config) {
      console.log(`Connected to host: ${connection.config.host}`);
    }

    // Release connection back to the pool
    connection.release();

    // Start Express server after DB connection succeeds
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed!");
    console.error("Error details:", error.message);
    process.exit(1); // Stop server process if database connection fails
  }
}

startServer();
