"use server";

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
// RIMOSSO: fs e path non sono più necessari per lo screenshot
import { callOpenRouter } from "@/lib/openrouter";

export async function scrapeAndAnalyze(url: string) {
  if (!url) {
    return { success: false, error: "URL non fornito." };
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: null,
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
      ),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // MODIFICATO: Genera lo screenshot come stringa Base64 invece di un file.
    // Questa è la modifica chiave che risolve l'errore EROFS.
    const screenshotBase64 = await page.screenshot({ encoding: "base64" });
    const screenshotDataUrl = `data:image/png;base64,${screenshotBase64}`;

    const pageData = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        headings: {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()).filter(Boolean),
          h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim()).filter(Boolean),
          h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim()).filter(Boolean)
        },
        links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href')
        })).filter(link => link.text && link.href && link.href.charAt(0) !== '#'),
        images: Array.from(document.querySelectorAll('img[src]')).map(img => ({
          alt: img.getAttribute('alt') || '',
          src: img.getAttribute('src')
        })),
        bodyText: document.body?.innerText?.trim() || ''
      };
    });

    // 2. RIDUCI la quantità di dati inviati all'AI
    const truncatedPageData = {
      ...pageData,
      links: pageData.links.slice(0, 20), // Invia solo i primi 20 link
      images: pageData.images.slice(0, 10), // Invia solo le prime 10 immagini
      bodyText: pageData.bodyText.substring(0, 4000) // Tronca il testo del corpo
    };

    const analysisPrompt = `
      Agisci come un consulente esperto di landing page con 30 anni di esperienza nel marketing a risposta diretta.
      Analizza i dati della landing page forniti utilizzando il metodo "Oggi Vinci Tu" e la FCB Grid.

      Rispondi ESCLUSIVAMENTE con un oggetto JSON valido che abbia la seguente struttura:
      {
        "preliminaryAnalysis": {
          "fcbQuadrant": "Identifica il quadrante FCB (es. 'Funzionale - Alto Coinvolgimento') e motiva la scelta.",
          "strategyCoherence": "Valuta la coerenza tra prodotto e strategia.",
          "targetAudience": "Determina se il target è definito correttamente."
        },
        "structureAndFlow": {
          "aboveTheFold": { "score": 0, "notes": "Verifica problema, soluzione e immagine." },
          "attractionRules": { "score": 0, "notes": "Analizza headline e prima impressione." },
          "interestRules": { "score": 0, "notes": "Valuta verità incontrovertibili e interesse progressivo." },
          "trustForging": { "score": 0, "notes": "Esamina testimonianze e credibilità." },
          "desireRules": { "score": 0, "notes": "Controlla ancoraggio, scarsità e urgenza." },
          "actionRules": { "score": 0, "notes": "Valuta UX del form e CTA." }
        },
        "criticalIssues": [
          "Identifica il primo problema più critico.",
          "Identifica il secondo problema più critico.",
          "Identifica il terzo problema più critico."
        ],
        "priorityOptimizations": [
          { "optimization": "Prima ottimizzazione prioritaria.", "estimatedImpact": "Alto/Medio/Basso" },
          { "optimization": "Seconda ottimizzazione prioritaria.", "estimatedImpact": "Alto/Medio/Basso" },
          { "optimization": "Terza ottimizzazione prioritaria.", "estimatedImpact": "Alto/Medio/Basso" }
        ]
      }

      Dati della pagina da analizzare:
      ---
      ${JSON.stringify(truncatedPageData)}
      ---
    `;
    
    const analysisJsonString = await callOpenRouter(analysisPrompt);

    const analysisObject = JSON.parse(analysisJsonString);

    return { 
      // MODIFICATO: Restituisce la stringa Base64 al client.
      screenshotPath: screenshotDataUrl, 
      analysis: analysisObject
    };
  } catch (error) {
    console.error("Errore durante lo scraping o l'analisi:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
