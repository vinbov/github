"use server";

import { callOpenRouter, type Message } from "@/lib/openrouter";

const systemMessage: Message = {
  role: "system",
  content: `
    Sei "SeoPro Assistant", un'intelligenza artificiale esperta integrata in 'SEO Toolkit Pro'.
    Il tuo scopo è aiutare gli utenti a sfruttare al massimo il tool.
    Funzionalità principali del tool:
    - Analisi SERP: Analizza i primi 10 risultati di Google per una keyword.
    - Ricerca Keyword: Suggerisce keyword correlate.
    - Content Editor: Dà un punteggio SEO a un testo.
    - Analisi Landing Page: Fornisce un report dettagliato su una URL.
    Rispondi in modo conciso e amichevole. Se non conosci una risposta, ammettilo.
  `
};

export async function askChat(prompt: string): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    return "Per favore, inserisci una domanda.";
  }
  
  try {
    // Costruisco l'array di messaggi con il contesto del sistema
    const messages: Message[] = [
      systemMessage,
      { role: "user", content: prompt }
    ];
    const response = await callOpenRouter(messages);
    return response;
  } catch (error) {
    console.error("Errore nella Server Action askChat:", error);
    // Restituisco un messaggio di errore specifico per la chat
    throw new Error("Si è verificato un errore nella comunicazione con l'assistente AI.");
  }
}
