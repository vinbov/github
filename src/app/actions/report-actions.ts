"use server";

import { callOpenRouter } from "@/lib/openrouter";

// Definisce la forma dei dati che ci aspettiamo dal client
interface MasterReportInput {
  tool1Summary: string;
  tool2Summary: string;
  tool3Summary: string;
  tool4Summary: string;
  dataForSeoSummary: string;
}

export async function generateMasterReportAction(input: MasterReportInput): Promise<string> {
  if (!input) {
    throw new Error("Dati di input per il report mancanti.");
  }

  const masterPrompt = `
    Agisci come un consulente SEO e marketing strategist di livello senior. Il tuo compito è analizzare i sommari provenienti da diversi strumenti di analisi e redigere un report strategico consolidato.

    Ecco i dati che hai a disposizione:

    1.  **Analisi Comparativa Keyword (Tool 1):**
        ${input.tool1Summary}

    2.  **Analisi Pertinenza Keyword (Tool 2):**
        ${input.tool2Summary}

    3.  **Analisi Domanda Consapevole (DataForSEO):**
        ${input.dataForSeoSummary}

    4.  **Analisi Annunci Facebook (Tool 3):**
        ${input.tool3Summary}

    5.  **Analisi Google Search Console (Tool 4):**
        ${input.tool4Summary}

    ---

    **Il tuo compito:**
    Basandoti su questi dati, scrivi un report strategico che includa:
    1.  **Executive Summary:** Un paragrafo riassuntivo con le scoperte principali e le raccomandazioni più importanti.
    2.  **Analisi SWOT Sintetica:** Basata sui dati, identifica 2 punti di forza, 2 di debolezza, 2 opportunità e 2 minacce.
    3.  **Piano d'Azione Prioritario:** Elenca i 3-5 passi successivi più importanti che il cliente dovrebbe intraprendere, spiegando il perché di ogni passo.

    Usa un tono professionale, chiaro e orientato all'azione. Formatta l'output in Markdown per una facile lettura.
  `;

  try {
    const report = await callOpenRouter(masterPrompt);
    if (!report) {
      throw new Error("L'analisi AI non ha prodotto risultati.");
    }
    return report;
  } catch (error) {
    console.error("Errore durante la generazione del report consolidato:", error);
    throw new Error("Si è verificato un errore durante la comunicazione con l'AI per il report consolidato.");
  }
}