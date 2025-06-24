import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useChatContext } from "./ChatWidget";

export function ChatInput() {
  const [value, setValue] = useState("");
  const { sendMessage, loading } = useChatContext();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    await sendMessage(value);
    setValue("");
  };

  return (
    <form onSubmit={handleSend} className="flex gap-2">
      <input
        className="flex-1 border rounded px-2 py-1 text-foreground bg-background"
        type="text"
        placeholder="Scrivi un messaggio..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <Button type="submit" className="bg-primary text-white" disabled={loading}>
        {loading ? "..." : "Invia"}
      </Button>
    </form>
  );
}
