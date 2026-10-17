import "dotenv/config";
import express from "express";
import cors from "cors";

import db from "./src/db/db.config.js";
import errorHandler from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();
const PORT = process.env.PORT || 3777;

// 1. CORS configuration for local development and Render frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://chatgpt-clone-apps-1.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`, req.body);
  next();
});

// 4. Main API router
app.use("/api", mainRouter);

// 5. Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 6. Centralized error handler
app.use(errorHandler);

// 7. Log unexpected asynchronous and synchronous process errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// 8. Verify database connection and start server
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
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed!");
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

startServer();
