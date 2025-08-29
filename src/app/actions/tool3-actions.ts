"use server";
import { callOpenRouter } from "@/lib/openrouter";

export async function analyzeAdAngleAction(params: {
  adText: string;
  targetAudience: string;
  productDescription: string;
}) {
  if (!params.adText || !params.targetAudience || !params.productDescription) {
    throw new Error("Tutti i campi sono obbligatori");
  }

  const analysisPrompt = `
    Analizza il seguente testo di un annuncio pubblicitario. Fornisci un'analisi del suo "marketing angle" e suggerisci miglioramenti.

    Dettagli:
    - Testo dell'annuncio: "${params.adText}"
    - Target di riferimento: "${params.targetAudience}"
    - Descrizione del prodotto/servizio: "${params.productDescription}"

    L'analisi dovrebbe includere:
    1.  Qual è l'angolo di marketing principale utilizzato (es. urgenza, prova sociale, esclusività, soluzione a un problema)?
    2.  Punti di forza dell'annuncio.
    3.  Suggerimenti concreti per rendere l'annuncio più efficace per il target specificato.
  `;

  const result = await callOpenRouter(analysisPrompt);
  return result;
}

