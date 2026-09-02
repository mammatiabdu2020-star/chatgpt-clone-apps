import express from "express";
// Import controller functions (2 levels up to src/controller/)
import {
  getConversationsController,
  createConversationController,
} from "../../controller/chat.controller.js";

const router = express.Router();

// GET /api/chat/conversations
router.get("/conversations", getConversationsController);

// POST /api/chat/conversations
router.post("/conversations", createConversationController);

export default router;
