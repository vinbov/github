'use server';

import type {
  AnalyzeFacebookAdMarketingAngleInput,
  AnalyzeFacebookAdMarketingAngleOutput,
} from '@/lib/types'; 
import { analyzeFacebookAdMarketingAngle } from '@/ai/flows/analyze-facebook-ad-marketing-angle';

// Funzione per stimare approssimativamente i token.
// Nota: Questa è una stima MOLTO grezza. Un tokenizer reale sarebbe più preciso.
// Per l'italiano, il rapporto caratteri/token può essere diverso dall'inglese.
// Usiamo un divisore conservativo.
function estimateTokensApprox(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.0); // Stima: 1 token ogni 3 caratteri (più conservativo)
}

// Funzione per parsare la risposta dall'API OpenAI
function parseOpenAIResponse(responseText: string | undefined): Partial<AnalyzeFacebookAdMarketingAngleOutput> {
  if (!responseText) {
    return {
      evaluation: 'Errore OpenAI',
      detailedAnalysis: 'Nessuna risposta ricevuta dal modello OpenAI.',
      totalScore: 0,
      c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
    };
  }

  const parts = responseText.split('|||');
  const result: Partial<AnalyzeFacebookAdMarketingAngleOutput> = {
    c1Clarity: 0, c2Engagement: 0, c3Concreteness: 0, c4Coherence: 0, c5Credibility: 0, c6CallToAction: 0, c7Context: 0,
    totalScore: 0,
    evaluation: "Errore Parsing Risposta AI",
    detailedAnalysis: `Risposta grezza dall'AI: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`,
  };

  if (parts.length < 10) {
    console.warn('Formato risposta Angle Analysis non standard da OpenAI:', responseText);
    result.detailedAnalysis = `Formato risposta non standard. Risposta grezza: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`;
    return result;
  }

  try {
    const scoreKeys: (keyof AnalyzeFacebookAdMarketingAngleOutput)[] = ['c1Clarity', 'c2Engagement', 'c3Concreteness', 'c4Coherence', 'c5Credibility', 'c6CallToAction', 'c7Context'];
    
    for (let i = 0; i < 7; i++) {
      const cPart = parts[i].split(':');
      const scoreValue = cPart[1] ? parseInt(cPart[1].trim(), 10) : 0;
      const key = scoreKeys[i];
      if (key) {
        (result as any)[key] = isNaN(scoreValue) ? 0 : scoreValue;
      }
    }

    const totalScorePart = parts[7].split(':');
    result.totalScore = totalScorePart[1] ? parseInt(totalScorePart[1].trim(), 10) : 0;
    if (isNaN(result.totalScore)) result.totalScore = 0;

    const evaluationPart = parts[8].split(':');
    result.evaluation = evaluationPart[1] ? evaluationPart[1].trim() : 'Valutazione non disponibile';
    
    result.detailedAnalysis = parts.slice(9).join('|||').trim(); 

    if (result.detailedAnalysis.toLowerCase().startsWith('analisi approfondita:')) {
        result.detailedAnalysis = result.detailedAnalysis.substring('analisi approfondita:'.length).trim();
    }

  } catch (e) {
    console.error('Errore durante il parsing della risposta OpenAI:', e, 'Risposta:', responseText);
  }
  return result;
}


function buildOpenAIPrompt(adText: string, adTitle?: string): string {
  return `
Analizza il seguente testo pubblicitario (e titolo, se presente) usando il framework "Metodo 7C".
Testo Ad: "${(adText || "").replace(/"/g, '""')}"
Titolo Ad (se applicabile): "${(adTitle || 'N/A').replace(/"/g, '""')}"

Framework di valutazione copy AD – Metodo 7C:
🎯 C1 Chiarezza: Il messaggio è comprensibile in meno di 5 secondi? (Punteggio 0-2)
🧲 C2 Coinvolgimento (Hook): Il primo rigo attira l'attenzione o incuriosisce? (Punteggio 0-2)
💎 C3 Concretezza (Benefit chiari): È chiaro il vantaggio per l'utente? È concreto, misurabile? (Punteggio 0-2)
👤 C4 Coerenza col target: Usa un tono e un linguaggio adatto al pubblico (immagina un pubblico generico se non specificato)? (Punteggio 0-2)
🧠 C5 Credibilità: Ci sono elementi di fiducia (numeri, testimonianze, dati, specificità)? (Punteggio 0-2)
🚀 C6 Call To Action (CTA): L'invito all'azione è chiaro, diretto e contestuale? (Punteggio 0-2)
📱 C7 Contesto (platform-fit): Il testo sembra ottimizzato per una piattaforma social come Facebook/Instagram (concisione, emoji appropriate, hashtag se pertinenti)? (Punteggio 0-2)

Per ciascuna "C", fornisci un punteggio da 0 a 2: 0 = assente, 1 = presente ma debole, 2 = presente e forte.

Rispondi OBBLIGATORIAMENTE con il seguente formato ESATTO, separando ogni parte con "|||":
C1:[punteggio C1]|||C2:[punteggio C2]|||C3:[punteggio C3]|||C4:[punteggio C4]|||C5:[punteggio C5]|||C6:[punteggio C6]|||C7:[punteggio C7]|||Punteggio Totale:[somma dei punteggi C1-C7]|||Valutazione:[valutazione qualitativa basata sul punteggio totale, es. "Ottimo", "Buono", "Debole", "Scarso"]|||Analisi Approfondita: [La tua analisi dettagliata qui, che includa: 1. Sintesi di Marketing (messaggio principale e angle). 2. Punti di Forza (cosa funziona bene). 3. Punti Deboli (cosa migliorare). 4. Linee Guida (2-3 suggerimenti concreti).]

Esempio di valutazione: 12-14 Ottimo; 9-11 Buono; 6-8 Debole; 0-5 Scarso.
L'Analisi Approfondita DEVE contenere le 4 sezioni indicate.
`;
}

const INPUT_TOKEN_THRESHOLD = 3000; // Soglia per i token di input stimati

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Chiamata diretta al flow Genkit (Gemini)
  return await analyzeFacebookAdMarketingAngle(input);
}

