import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import "./App.css";

// Base API URL updated to port 3777 to match backend index.js
const API_BASE_URL = "http://localhost:3777/api";

function App() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  const fetchConversations = async () => {
    console.log("Fetching conversations from backend...");
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/conversations`);
      console.log("Fetch conversations response:", response.data);

      if (
        response.data.success &&
        Array.isArray(response.data.data?.conversations)
      ) {
        setConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error(
        "Error fetching conversations:",
        error.response?.data || error.message,
      );
    }
  };

  const handleSendMessage = async (question) => {
    console.log("Sending question to backend:", question);

    // Optimistically add user message to UI immediately
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    setConversations((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question,
      });

      console.log("Backend response received:", response.data);

      if (response.data.success) {
        const { userConversation, assistantConversation } =
          response.data.data || {};

        // Replace temporary user message with actual user and assistant responses
        setConversations((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);
          const newMessages = [];
          if (userConversation) newMessages.push(userConversation);
          if (assistantConversation) newMessages.push(assistantConversation);

          return [...filtered, ...newMessages];
        });
      }
    } catch (err) {
      console.error("Status:", err.response?.status);
      console.error("Server message:", err.response?.data);
      console.error("Message:", err.message);

      // Extract error message from backend response or provide a fallback
      const errorMessage =
        err.response?.data?.message ||
        "There was an error generating a response from the server.";

      // Display error as assistant response in UI
      const errorConversation = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorMessage,
      };

      setConversations((prev) => [...prev, errorConversation]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="chat">
        <ChatHeader />

        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
