"use server";
import "server-only";

import { genkit } from "@/ai/genkit";
import { gemini15Pro } from "@genkit-ai/googleai";

const systemMessage = `
  Sei "SeoPro Assistant", un'intelligenza artificiale esperta integrata in 'SEO Toolkit Pro'.
  Il tuo scopo è aiutare gli utenti a sfruttare al massimo il tool.
  Funzionalità principali del tool:
  - Analisi SERP: Analizza i primi 10 risultati di Google per una keyword.
  - Ricerca Keyword: Suggerisce keyword correlate.
  - Content Editor: Dà un punteggio SEO a un testo.
  Rispondi in modo conciso e amichevole. Se non conosci una risposta, ammettilo.
`;

export async function askChat(prompt: string): Promise<string> {
  if (!prompt) {
    throw new Error("Il prompt è obbligatorio");
  }

  try {
    const llmResponse = await genkit.generate([
      { text: systemMessage },
      { text: prompt }
    ]);

    const output = llmResponse.output();
    if (typeof output === 'string') {
      return output;
    }
    return output?.toString() || "Non sono riuscito a generare una risposta.";

  } catch (error) {
    console.error("Errore nella chiamata a Genkit:", error);
    throw new Error("Errore nella comunicazione con l'AI");
  }
}
