// filepath: src/lib/openrouter.ts
import 'server-only';

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

export async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("ERRORE: La chiave OPENROUTER_API_KEY non è stata trovata in .env.local");
    throw new Error("Chiave API OpenRouter mancante");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            Sei "SeoPro Assistant", un'intelligenza artificiale esperta integrata in 'SEO Toolkit Pro'.
            Il tuo scopo è aiutare gli utenti a sfruttare al massimo il tool.
            Rispondi in modo conciso e amichevole. Se non conosci una risposta, ammettilo.
          `
        },
        {
          role: "user",
          content: prompt,
        },
      ],
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