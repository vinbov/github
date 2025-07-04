import { NextRequest, NextResponse } from 'next/server';
import { analyzeLandingPage, type LandingPageData } from '@/lib/landing-page-analyzer';

// --- TIPI E FUNZIONE SPOSTATI QUI ---
type Issue = { category: string; severity: 'critical' | 'high' | 'medium'; issue: string };

function findStructuralIssues(data: LandingPageData): Issue[] {
  const issues: Issue[] = [];
  if (data.headlines.h1.length === 0) issues.push({ category: 'messageClarity', severity: 'critical', issue: 'Manca un titolo H1.' });
  if (data.headlines.h1.length > 1) issues.push({ category: 'messageClarity', severity: 'high', issue: `Ci sono ${data.headlines.h1.length} H1. Dovrebbe essercene solo uno.` });
  if (!data.title) issues.push({ category: 'messageClarity', severity: 'high', issue: 'Manca il meta-titolo della pagina.' });
  if (data.ctas.length === 0) issues.push({ category: 'callToAction', severity: 'critical', issue: 'Nessuna Call-to-Action trovata.' });
  const ctasAboveFold = data.ctas.filter(cta => cta.isAboveTheFold).length;
  if (ctasAboveFold === 0 && data.ctas.length > 0) issues.push({ category: 'callToAction', severity: 'high', issue: 'Nessuna CTA è visibile "above the fold".' });
  if (data.contactForms.length === 0) issues.push({ category: 'contactForm', severity: 'medium', issue: 'Nessun form di contatto trovato.' });
  else if (data.contactForms[0].fields.length > 6) issues.push({ category: 'contactForm', severity: 'medium', issue: `Il form ha troppi campi (${data.contactForms[0].fields.length}).` });
  if (data.socialProof.testimonials.length === 0 && data.socialProof.logos.length === 0) issues.push({ category: 'socialProof', severity: 'medium', issue: 'Nessuna prova sociale evidente trovata.' });
  return issues;
}
// --- FINE SEZIONE SPOSTATA ---

let abortController: AbortController | null = null;

export async function POST(req: NextRequest) {
  // ... il resto del file rimane invariato ...
// ... existing code...
  const body = await req.json();
  const { url, action, extractedData } = body;

  // Gestione dell'interruzione da parte dell'utente
  if (action === 'abort') {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    return NextResponse.json({ success: true, message: 'Analisi interrotta' });
  }

  // Azione 1: Estrazione dei dati dalla pagina web
  if (action === 'extract') {
    if (!url) return NextResponse.json({ error: 'URL mancante' }, { status: 400 });
    try {
      const data = await analyzeLandingPage(url);
      const issues = findStructuralIssues(data.data);
      return NextResponse.json({ success: true, extractedData: data, issues });
    } catch (error: any) {
      console.error("Errore nell'API (extract):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Azione 2: Analisi con l'intelligenza artificiale (Gemini via OpenRouter)
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
      console.error("Errore nell'API (analyze):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
      abortController = null;
    }
  }

  return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
}