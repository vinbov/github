// Servizio per inviare prompt al nostro backend che contatta OpenAI

const API_URL = "/api/chat"; // Chiama il nostro nuovo endpoint locale

export async function askGptSearch(prompt: string): Promise<string> {
  console.log("[askGptSearch] Chiamata al backend con prompt:", prompt);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }), // Invia solo il prompt
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Errore di comunicazione con il server");
    }

    const data = await res.json();
    return data.response; // La risposta dell'AI sarà direttamente qui

  } catch (err: any) {
    console.error("[askGptSearch] Errore:", err);
    return "[Errore nella comunicazione con l'AI: " + (err?.message || "dettagli non disponibili") + "]";
  }
}