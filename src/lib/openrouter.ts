// filepath: src/lib/openrouter.ts
import 'server-only';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function analyzeContentWithOpenRouter(pageContent: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "model": "google/gemini-2.5-pro",
      "messages": [
        {
          "role": "system",
          "content": "You are an expert in digital marketing and conversion rate optimization. Analyze the provided landing page content, identify strengths, weaknesses, and suggest concrete improvements."
        },
        {
          "role": "user",
          "content": `Please analyze the following landing page content: ${pageContent}`
        }
      ],
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

// La funzione ora accetta sia una stringa semplice che un array di messaggi
export async function callOpenRouter(messages: Message[] | string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("ERRORE: La chiave OPENROUTER_API_KEY non è stata trovata in .env.local");
    throw new Error("Chiave API OpenRouter mancante");
  }

  // Se riceve una stringa, la trasforma in un array di messaggi standard
  const finalMessages = typeof messages === 'string' 
    ? [{ role: 'user', content: messages }] 
    : messages;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://seotoolkitpro.app",
      "X-Title": "SEO Toolkit Pro",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: finalMessages,
      max_tokens: 2048,
      response_format: finalMessages.some(m => m.content.includes("JSON")) ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Errore nella chiamata a OpenRouter:", response.status, errorBody);
    throw new Error(`Errore API OpenRouter: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Nessuna risposta ricevuta dall'AI.";
}