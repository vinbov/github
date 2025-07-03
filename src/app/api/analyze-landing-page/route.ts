import { NextRequest, NextResponse } from 'next/server';
import { analyzeLandingPage, findStructuralIssues } from '@/lib/landing-page-analyzer';

// Variabile per gestire l'interruzione
let abortController: AbortController | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, action, extractedData } = body;

  // Gestione dell'interruzione
  if (action === 'abort') {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    return NextResponse.json({ success: true, message: 'Analisi interrotta' });
  }

  // Azione 1: Estrazione dei dati dalla pagina web
  if (action === 'extract') {
    if (!url) {
      return NextResponse.json({ error: 'URL mancante' }, { status: 400 });
    }
    try {
      console.log(`Inizio estrazione per: ${url}`);
      const data = await analyzeLandingPage(url);
      const issues = findStructuralIssues(data.data);
      console.log(`Estrazione completata. Trovati ${issues.length} problemi.`);
      
      return NextResponse.json({
        success: true,
        extractedData: data,
        issues: issues,
      });
    } catch (error: any) {
      console.error("Errore nell'API (extract):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Azione 2: Analisi con l'intelligenza artificiale
  if (action === 'analyze') {
    if (!extractedData) {
      return NextResponse.json({ error: 'Dati estratti mancanti' }, { status: 400 });
    }
    
    abortController = new AbortController();
    
    try {
      const prompt = `
        Sei un esperto di marketing specializzato nell'analisi di landing page.
        Analizza i seguenti dati estratti da una landing page e fornisci una valutazione dettagliata.
        URL della pagina: ${url}
        Dati estratti: ${JSON.stringify(extractedData.data, null, 2)}

        Organizza la tua risposta in un oggetto JSON con le seguenti chiavi:
        - "messageClarity": "Analisi dell'headline, sub-headline e proposta di valore.",
        - "visualImpact": "Analisi dell'immagine hero e impatto visivo.",
        - "persuasiveCopy": "Analisi del testo persuasivo e focus sui benefici.",
        - "socialProof": "Analisi delle testimonianze, loghi, certificazioni.",
        - "callToAction": "Analisi dei CTA, posizionamento e testo.",
        - "contactForm": "Analisi del form di contatto.",
        - "userExperience": "Analisi dell'UX e performance.",
        - "recommendations": "Un paragrafo con i 3 suggerimenti più importanti per migliorare la pagina."
      `;

      console.log('Invio richiesta a OpenRouter con Gemini 2.5 Pro per analisi...');
      const response = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }, // Chiediamo esplicitamente un JSON
          max_tokens: 4000,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Errore nella chiamata a OpenRouter');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      let sections = {};
      try {
        sections = JSON.parse(content);
      } catch (e) {
        console.error("La risposta dell'AI non era un JSON valido:", content);
        throw new Error("La risposta dell'AI non è in un formato JSON valido.");
      }

      console.log('Analisi AI completata.');
      return NextResponse.json({
        success: true,
        sections: sections,
        tokens: data.usage,
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Analisi AI interrotta.');
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