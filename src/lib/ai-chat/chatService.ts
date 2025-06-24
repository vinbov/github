// Servizio per inviare prompt all'actor Apify GPT Search e ottenere la risposta
// ATTENZIONE: chiave hardcoded solo per test locale!

const APIFY_TOKEN = "apify_api_U6GVlC8ekCj50XUfw0XbOynwe5h2yN1iAWV8";
const ACTOR_ID = "openapi~gpt-search-private-api";
const API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

export async function askGptSearch(prompt: string): Promise<string> {
  console.log("[askGptSearch] chiamata con prompt:", prompt);
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { prompt } }), // <-- payload corretto per Apify
  });
  console.log("[askGptSearch] fetch completata, status:", res.status);
  if (!res.ok) throw new Error("Errore chiamata Apify: " + res.status);
  const data = await res.json();
  // Log temporaneo per debug
  console.log("[Apify API response]", data);
  // Di solito la risposta è un array di oggetti, prendi il campo output o simile
  if (Array.isArray(data) && data[0]?.output) {
    return data[0].output;
  }
  // Fallback: mostra tutto come stringa
  return JSON.stringify(data);
}
