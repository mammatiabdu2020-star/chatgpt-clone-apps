import { createConversationService } from "../api/chat/service/chat.service.js";

/**
 * GET Controller - Retrieves conversation list
 */
export async function getConversationsController(req, res, next) {
  console.log("--> [GET] /api/chat/conversations requested");
  try {
    return res.status(200).json({
      success: true,
      data: {
        conversations: [],
      },
    });
  } catch (error) {
    console.error("GET Controller Error:", error);
    next(error);
  }
}

/**
 * POST Controller - Handles user question and sends to Gemini API via service layer
 */
export async function createConversationController(req, res, next) {
  console.log("--> [POST] Request received:", req.body);
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question field is required",
      });
    }

    // Call service to process question with Gemini AI
    const result = await createConversationService(question);

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: result,
    });
  } catch (error) {
    console.error("POST Controller Error:", error);
    next(error);
  }
}
