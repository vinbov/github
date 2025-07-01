import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Istruzioni per l'AI: personalizza questo messaggio!
const systemMessage = `
  Sei "SeoPro Assistant", un'intelligenza artificiale esperta integrata in 'SEO Toolkit Pro'.
  Il tuo scopo è aiutare gli utenti a sfruttare al massimo il tool.

  Funzionalità principali del tool:
  - Analisi SERP: Analizza i primi 10 risultati di Google per una keyword.
  - Ricerca Keyword: Suggerisce keyword correlate.
  - Content Editor: Dà un punteggio SEO a un testo.

  Rispondi in modo conciso e amichevole. Se non conosci una risposta, ammettilo.
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // o "gpt-3.5-turbo" per risposte più veloci
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || "Non sono riuscito a generare una risposta.";
    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error("Errore chiamata OpenAI:", error);
    res.status(500).json({ message: 'Errore nella comunicazione con l\'AI' });
  }
}