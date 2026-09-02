import db from "../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

// Read model & API key from environment variables with safe fallbacks
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Fetch recent message history to provide context to Gemini
 */
const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0 ? 5 : normalizedLimit;

  const [rows] = await db.execute(
    `SELECT id, role, content, created_at
     FROM conversations
     ORDER BY id DESC
     LIMIT ?`,
    [safeLimit],
  );

  // Reverse so history flows in chronological order (oldest -> newest)
  return rows.reverse();
};

/**
 * Send history and current question to Gemini API.
 * Automatically retries a couple of times if Gemini returns a
 * 503 UNAVAILABLE / "overloaded" error, since that's usually transient.
 */
const generateAssistantAnswer = async (
  { historyRows, question },
  retries = 2,
) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    config: {
      maxOutputTokens: 1024,
    },
    history: formattedHistory,
  });

  try {
    const result = await chat.sendMessage({ message: question });

    return {
      text: result.text,
      totalTokens: result.usageMetadata?.totalTokenCount || 0,
    };
  } catch (error) {
    const isOverloaded =
      error.message?.includes("UNAVAILABLE") ||
      error.message?.includes("overloaded");

    if (isOverloaded && retries > 0) {
      console.log(
        `Gemini overloaded, retrying... (${retries} attempt(s) left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500)); // wait 1.5s before retry
      return generateAssistantAnswer({ historyRows, question }, retries - 1);
    }

    throw error;
  }
};

/**
 * Helper to fetch a newly created row by ID to return complete data to controller
 */
const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );
  if (!rows[0]) return null;

  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

/**
 * Main Service Function: Handles DB saving, AI generation, and state return
 */
export async function createConversationService(question) {
  try {
    // 1. Input Validation
    if (!question || !question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // 2. Fetch recent conversation context (last 5 messages)
    const historyRows = await getRecentConversationRows(5);

    // 3. Save User Message into MySQL
    const [userInsertResult] = await db.execute(
      "INSERT INTO conversations (content, role) VALUES (?, 'user')",
      [question],
    );

    // 4. Generate AI Response via Gemini (with built-in retry on overload)
    const { text, totalTokens } = await generateAssistantAnswer({
      historyRows,
      question,
    });

    // 5. Save Assistant Reply into MySQL
    const [assistantInsertResult] = await db.execute(
      "INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)",
      ["assistant", text, totalTokens],
    );

    // 6. Retrieve formatted records to match App.jsx expectations
    const userConversation = await getMessageById(userInsertResult.insertId);
    const assistantConversation = await getMessageById(
      assistantInsertResult.insertId,
    );

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}
