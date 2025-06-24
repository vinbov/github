import { useState } from "react";

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
    // Placeholder: qui chiamerai la tua API Genkit o altra AI
    const aiResponse = await fakeGenkitApi(userMessage);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random().toString(36),
        from: "ai",
        message: aiResponse,
        createdAt: Date.now(),
      },
    ]);
    setLoading(false);
  }

  return { messages, sendMessage, loading };
}

// Simula una risposta AI (da sostituire con chiamata reale a Genkit)
async function fakeGenkitApi(input: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 800));
  return `Risposta AI a: "${input}"`;
}
