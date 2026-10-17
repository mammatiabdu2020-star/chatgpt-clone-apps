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

// (debug) Log every request so you can see whether it reaches Express
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, req.body);
  next();
});

// 3. Main API Router
app.use("/api", mainRouter);

// (new) Unknown routes return 404 instead of falling through silently
app.use((req, res) => {
  res
    .status(404)
    .json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// 4. Centralized Error Handling Middleware (must stay after routes)
app.use(errorHandler);

// (new) Catch errors that would otherwise disappear
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// 5. Database verification and server initialization
async function startServer() {
  try {
    console.log("Connecting to database...");

    const connection = await db.getConnection();
    console.log("Database connected successfully!");

    if (connection.config) {
      console.log(`Connected to host: ${connection.config.host}`);
    }

    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed!");
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

startServer();
