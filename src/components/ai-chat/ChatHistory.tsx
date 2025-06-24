import React from "react";
import { useChatContext } from "./ChatWidget";
import { ChatMessage as ChatMessageComponent } from "./ChatMessage";

export function ChatHistory() {
  const { messages } = useChatContext();
  return (
    <div className="space-y-2 text-sm text-foreground">
      {messages.map((msg) => (
        <ChatMessageComponent key={msg.id} message={msg.message} from={msg.from} />
      ))}
    </div>
  );
}
