import express from "express";
import chatRouter from "./chat/chat.routes.js";

const mainRouter = express.Router();

// Health check endpoint (optional)
mainRouter.get("/health", (req, res) => {
  res.json({ status: "ok", message: "API is healthy" });
});

// Mount the chat router under /chat
// This makes the full path: /api/chat/conversations
mainRouter.use("/chat", chatRouter);

export default mainRouter;
