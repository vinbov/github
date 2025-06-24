import React from "react";

export function ChatMessage({ message, from }: { message: string; from: "user" | "ai" }) {
  return (
    <div
      className={`p-2 rounded mb-1 ${from === "user" ? "bg-primary text-white ml-auto" : "bg-muted text-foreground mr-auto"}`}
      style={{ maxWidth: "80%" }}
    >
      {message}
    </div>
  );
}
