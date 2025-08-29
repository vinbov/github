"use server";
import "server-only";
import { callOpenRouter } from "@/lib/openrouter";

export async function askChat(prompt: string): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    return "Per favore, inserisci una domanda.";
  }
  
  try {
    const response = await callOpenRouter(prompt);
    return response;
  } catch (error) {
    console.error("Errore nella Server Action askChat:", error);
    return "Si è verificato un errore nella comunicazione con l'assistente AI.";
  }
}
