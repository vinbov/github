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