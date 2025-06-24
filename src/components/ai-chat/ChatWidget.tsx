"use client";
import { useState, createContext, useContext } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";

const ChatContext = createContext<ReturnType<typeof useChat> | null>(null);
export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("ChatContext non trovato");
  return ctx;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const chat = useChat();

  return (
    <ChatContext.Provider value={chat}>
      {/* Mostra l'icona SOLO se la chat è chiusa */}
      {!open && (
        <div className="absolute bottom-6 right-6 z-50"> {/* CAMBIATO: fixed -> absolute */}
          <Button
            className="rounded-full shadow-lg bg-primary text-white w-14 h-14 flex items-center justify-center text-2xl"
            onClick={() => setOpen(true)} // Ora apre sempre
            aria-label="Apri chat AI"
          >
            💬
          </Button>
        </div>
      )}

      {/* Mostra la finestra della chat SOLO se è aperta */}
      {open && (
         <div className="absolute bottom-6 right-6 z-50 w-80 max-w-full bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted">
            <span className="font-semibold">AI Chat</span>
            {/* Questo pulsante ora è l'unico modo per chiudere/ridurre a icona */}
            <button onClick={() => setOpen(false)} className="text-lg font-bold">_</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ChatHistory />
          </div>
          <div className="border-t border-border p-2 bg-card">
            <ChatInput />
          </div>
        </div>
      )}
    </ChatContext.Provider>
  );
}