import { NextRequest, NextResponse } from 'next/server';
import { analyzeLandingPage, findStructuralIssues } from '@/lib/landing-page-analyzer';

let abortController: AbortController | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, action, extractedData } = body;

  if (action === 'abort') {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    return NextResponse.json({ success: true, message: 'Analisi interrotta' });
  }

  if (action === 'extract') {
    if (!url) return NextResponse.json({ error: 'URL mancante' }, { status: 400 });
    try {
      const data = await analyzeLandingPage(url);
      const issues = findStructuralIssues(data.data);
      return NextResponse.json({ success: true, extractedData: data, issues });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (action === 'analyze') {
    if (!extractedData) return NextResponse.json({ error: 'Dati estratti mancanti' }, { status: 400 });
    abortController = new AbortController();
    try {
      const prompt = `Sei un esperto di marketing. Analizza i dati JSON di questa landing page: ${JSON.stringify(extractedData.data, null, 2)}. Fornisci la tua analisi in un oggetto JSON con queste chiavi: "messageClarity", "visualImpact", "persuasiveCopy", "socialProof", "callToAction", "contactForm", "userExperience", "recommendations".`;
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Errore nella chiamata a OpenRouter');
      }

      const data = await response.json();
      const sections = JSON.parse(data.choices[0]?.message?.content || '{}');
      return NextResponse.json({ success: true, sections, tokens: data.usage });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Analisi interrotta dall\'utente' }, { status: 499 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      abortController = null;
    }
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}