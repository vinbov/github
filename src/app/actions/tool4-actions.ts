'use server';

import type { LandingPageAnalysis, LandingPageScrapedData } from '@/lib/types';

interface AnalyzeLandingPageInput {
  url: string;
  scrapedData: LandingPageScrapedData;
  businessType: string;
  primaryGoal: string;
  targetAudience: string;
}

// Token estimation function (similar to tool3)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const INPUT_TOKEN_THRESHOLD = 12000; // Conservative limit

export async function analyzeLandingPageAction(
  input: AnalyzeLandingPageInput,
  apiKey: string
): Promise<LandingPageAnalysis> {
  
  // Create comprehensive prompt for landing page analysis
  const promptContent = `
Analizza questa landing page utilizzando il framework Marketing 10M per l'ottimizzazione delle conversioni.

URL: ${input.url}
Tipo Business: ${input.businessType}
Obiettivo Primario: ${input.primaryGoal}
Target Audience: ${input.targetAudience}

DATI ESTRATTI DALLA PAGINA:
- Titolo: ${input.scrapedData.title}
- Headline: ${input.scrapedData.headline}
- Subheadline: ${input.scrapedData.subheadline || 'N/D'}
- Meta Description: ${input.scrapedData.metaDescription || 'N/D'}
- CTA Buttons: ${JSON.stringify(input.scrapedData.ctaButtons)}
- Forms: ${JSON.stringify(input.scrapedData.forms)}
- Testimonials: ${JSON.stringify(input.scrapedData.testimonials)}
- Social Proof: ${JSON.stringify(input.scrapedData.socialProof)}
- Trust Elements: ${JSON.stringify(input.scrapedData.trustElements)}
- Technical Data: ${JSON.stringify(input.scrapedData.technicalData)}

FRAMEWORK DI VALUTAZIONE - Marketing 10M:

🎯 M1 - Message Clarity (Chiarezza Messaggio): La value proposition è chiara e specifica? Il messaggio comunica valore in 5-8 secondi? (Punteggio 0-10)

🎨 M2 - Visual Impact (Impatto Visivo): Design professionale? Gerarchia visiva efficace? Contrasti colori appropriati? (Punteggio 0-10)

🚀 M3 - CTA Effectiveness (Efficacia CTA): CTA visibili e contrastanti? Testo action-oriented? Posizionamento strategico? (Punteggio 0-10)

🛡️ M4 - Trust Elements (Elementi Fiducia): Testimonial, logo clienti, certificazioni, garanzie presenti e credibili? (Punteggio 0-10)

🔄 M5 - User Flow (Flusso Utente): Navigazione intuitiva? Percorso verso conversione chiaro? Friction minimizzata? (Punteggio 0-10)

📱 M6 - Mobile Experience (Esperienza Mobile): Responsive design? Touch targets appropriati? Velocità caricamento mobile? (Punteggio 0-10)

👥 M7 - Social Proof (Prova Sociale): Recensioni, numeri, case studies, testimonial video credibili e rilevanti? (Punteggio 0-10)

⏰ M8 - Urgency/Scarcity (Urgenza/Scarsità): Elementi di urgenza genuini? Scarsità credibile? FOMO ben implementato? (Punteggio 0-10)

📝 M9 - Content Quality (Qualità Contenuto): Copywriting persuasivo? Benefici chiari? Addressing objections? (Punteggio 0-10)

📊 M10 - Conversion Optimization (Ottimizzazione Conversioni): Form ottimizzati? A/B test evidence? Funnel logico? (Punteggio 0-10)

ANALISI DETTAGLIATA RICHIESTA:

Per ogni problematica identificata, fornisci:
1. 📖 **Perché è un problema**: Spiegazione dettagliata dell'impatto negativo
2. ✅ **Come deve essere**: Best practices specifiche con esempi concreti  
3. 🔧 **Suggerimenti specifici**: Azioni concrete da implementare

Includi anche:
- **Punti di Forza**: Top 3 elementi che funzionano bene
- **Problemi Critici**: Top 3 issues che impattano maggiormente le conversioni
- **Raccomandazioni Priorità**: 5 azioni immediate ordinate per impatto

Rispondi con un oggetto JSON che contenga:
- Punteggi per m1MessageClarity, m2VisualImpact, m3CtaEffectiveness, m4TrustElements, m5UserFlow, m6MobileExperience, m7SocialProof, m8UrgencyScarcity, m9ContentQuality, m10ConversionOptimization.
- Un campo overallScore: la somma dei singoli punteggi (da 0 a 100).
- Un campo evaluation: valutazione qualitativa basata sul punteggio totale (85-100: Ottimo; 70-84: Buono; 50-69: Mediocre; 0-49: Scarso).
- Un array strengths: 3 punti di forza principali.
- Un array criticalIssues: 3 problemi critici principali.
- Un array priorityRecommendations: 5 raccomandazioni prioritarie.
- Un campo detailedAnalysis che includa l'analisi completa con motivazioni dettagliate per ogni elemento problematico.
- Un campo conversionProbability: "Alta", "Media", o "Bassa" basata sull'analisi.

L'intero output DEVE essere un oggetto JSON valido. Non includere testo prima o dopo l'oggetto JSON.
`;

  // Check token limit
  const estimatedInputTokens = estimateTokens(promptContent);
  if (estimatedInputTokens > INPUT_TOKEN_THRESHOLD) {
    return {
      m1MessageClarity: 0, m2VisualImpact: 0, m3CtaEffectiveness: 0, m4TrustElements: 0, 
      m5UserFlow: 0, m6MobileExperience: 0, m7SocialProof: 0, m8UrgencyScarcity: 0, 
      m9ContentQuality: 0, m10ConversionOptimization: 0,
      overallScore: 0,
      evaluation: 'Errore Token Limit',
      strengths: [],
      criticalIssues: ['Input troppo lungo per analisi'],
      priorityRecommendations: ['Ridurre contenuto della pagina per analisi'],
      detailedAnalysis: `La landing page contiene troppo contenuto per essere analizzata (stimati ${estimatedInputTokens} token di input, soglia ${INPUT_TOKEN_THRESHOLD}). Prova con una pagina più semplice.`,
      conversionProbability: 'Bassa',
    };
  }

  const payload = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: promptContent }],
    max_tokens: 1200,
    temperature: 0.3,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Errore API OpenAI (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += `: ${errorJson.error?.message || errorText}`;
      } catch (e) {
        errorMessage += `: ${errorText}`;
      }
      
      return {
        m1MessageClarity: 0, m2VisualImpact: 0, m3CtaEffectiveness: 0, m4TrustElements: 0, 
        m5UserFlow: 0, m6MobileExperience: 0, m7SocialProof: 0, m8UrgencyScarcity: 0, 
        m9ContentQuality: 0, m10ConversionOptimization: 0,
        overallScore: 0,
        evaluation: 'Errore API OpenAI',
        strengths: [],
        criticalIssues: ['Errore comunicazione con OpenAI'],
        priorityRecommendations: ['Verificare API key e connessione'],
        detailedAnalysis: errorMessage,
        conversionProbability: 'Bassa',
      };
    }

    const jsonResponse = await response.json();
    const rawAnalysisText = jsonResponse.choices?.[0]?.message?.content;
    
    const parsedResult = parseOpenAIResponse(rawAnalysisText);

    const finalResult: LandingPageAnalysis = {
      m1MessageClarity: parsedResult.m1MessageClarity ?? 0,
      m2VisualImpact: parsedResult.m2VisualImpact ?? 0,
      m3CtaEffectiveness: parsedResult.m3CtaEffectiveness ?? 0,
      m4TrustElements: parsedResult.m4TrustElements ?? 0,
      m5UserFlow: parsedResult.m5UserFlow ?? 0,
      m6MobileExperience: parsedResult.m6MobileExperience ?? 0,
      m7SocialProof: parsedResult.m7SocialProof ?? 0,
      m8UrgencyScarcity: parsedResult.m8UrgencyScarcity ?? 0,
      m9ContentQuality: parsedResult.m9ContentQuality ?? 0,
      m10ConversionOptimization: parsedResult.m10ConversionOptimization ?? 0,
      overallScore: parsedResult.overallScore ?? 0,
      evaluation: parsedResult.evaluation ?? "Valutazione non disponibile",
      strengths: parsedResult.strengths ?? [],
      criticalIssues: parsedResult.criticalIssues ?? [],
      priorityRecommendations: parsedResult.priorityRecommendations ?? [],
      detailedAnalysis: parsedResult.detailedAnalysis ?? "Analisi dettagliata non disponibile.",
      conversionProbability: parsedResult.conversionProbability ?? 'Media',
    };
    
    // Calcola overall score se mancante
    if (!finalResult.overallScore) {
      finalResult.overallScore = 
        finalResult.m1MessageClarity + finalResult.m2VisualImpact + 
        finalResult.m3CtaEffectiveness + finalResult.m4TrustElements +
        finalResult.m5UserFlow + finalResult.m6MobileExperience +
        finalResult.m7SocialProof + finalResult.m8UrgencyScarcity +
        finalResult.m9ContentQuality + finalResult.m10ConversionOptimization;
    }

    // Ricalcola evaluation se mancante
    if (finalResult.evaluation === "Valutazione non disponibile") {
      const score = finalResult.overallScore;
      if (score >= 85) finalResult.evaluation = 'Ottimo - Landing page ad alta conversione';
      else if (score >= 70) finalResult.evaluation = 'Buono - Buone possibilità di conversione';
      else if (score >= 50) finalResult.evaluation = 'Mediocre - Necessario miglioramento';
      else finalResult.evaluation = 'Scarso - Revisione completa necessaria';
    }

    return finalResult;

  } catch (error: any) {
    console.error('Errore durante la chiamata a OpenAI per analisi landing page:', error);
    return {
      m1MessageClarity: 0, m2VisualImpact: 0, m3CtaEffectiveness: 0, m4TrustElements: 0, 
      m5UserFlow: 0, m6MobileExperience: 0, m7SocialProof: 0, m8UrgencyScarcity: 0, 
      m9ContentQuality: 0, m10ConversionOptimization: 0,
      overallScore: 0,
      evaluation: 'Errore Analisi',
      strengths: [],
      criticalIssues: ['Errore durante analisi AI'],
      priorityRecommendations: ['Riprovare analisi'],
      detailedAnalysis: `Errore durante l'analisi: ${error.message}`,
      conversionProbability: 'Bassa',
    };
  }
}

function parseOpenAIResponse(rawText: string): any {
  if (!rawText) {
    return {};
  }

  try {
    // Clean the response
    const cleanedText = rawText.trim();
    let jsonStart = cleanedText.indexOf('{');
    let jsonEnd = cleanedText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No JSON found in response');
    }
    
    const jsonString = cleanedText.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Errore parsing risposta OpenAI:', error);
    console.error('Raw text:', rawText);
    return {
      error: 'Errore parsing risposta AI',
      rawResponse: rawText
    };
  }
}
