// Servizio per inviare prompt all'actor Apify GPT Search e ottenere la risposta
// ATTENZIONE: chiave hardcoded solo per test locale!

const APIFY_TOKEN = "apify_api_U6GVlC8ekCj50XUfw0XbOynwe5h2yN1iAWV8";
const ACTOR_ID = "openapi~gpt-search-private-api"; // ID actor corretto per Apify
const API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

export async function askGptSearch(prompt: string): Promise<string> {
  console.log("[askGptSearch] chiamata con prompt:", prompt);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { prompt } }),
    });
    console.log("[askGptSearch] fetch completata, status:", res.status);
    if (!res.ok) throw new Error("Errore chiamata Apify: " + res.status);
    const data = await res.json();
    console.log("[Apify API response]", data);
    if (Array.isArray(data) && data[0]?.output) {
      if (typeof data[0].output === "string" && data[0].output.trim() !== "") {
        return data[0].output;
      }
    }
    // Fallback: risposta vuota o formato inatteso
    return "[Nessuna risposta valida ricevuta dall'AI. Riprova o verifica la configurazione.]";
  } catch (err: any) {
    console.error("[askGptSearch] Errore:", err);
    return "[Errore nella comunicazione con l'AI: " + (err?.message || err) + "]";
  }
}
