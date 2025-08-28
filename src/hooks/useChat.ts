import { useState } from "react";
import { askChat } from "@/app/actions/chat-actions";

export type ChatMessage = {
  id: string;
  from: "user" | "ai";
  message: string;
  createdAt: number;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "ai",
      message: "Ciao! Sono il tuo assistente AI. Come posso aiutarti?",
      createdAt: Date.now(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Invia un messaggio utente e ottieni risposta AI
  async function sendMessage(userMessage: string) {
    const msg: ChatMessage = {
      id: Date.now() + Math.random().toString(36),
      from: "user",
      message: userMessage,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setLoading(true);
    try {
      const aiResponse = await askChat(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random().toString(36),
          from: "ai",
          message: aiResponse,
          createdAt: Date.now(),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random().toString(36),
          from: "ai",
          message: "Errore: " + (e?.message || e),
          createdAt: Date.now(),
        },
      ]);
    }
    setLoading(false);
  }

  return { messages, sendMessage, loading };
}
