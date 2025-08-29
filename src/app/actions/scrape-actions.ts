"use server";

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs/promises";
import path from "path";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Funzione per la chiamata API, ora con limiti espliciti
async function callOpenRouter(messages: Message[] | string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Chiave API OpenRouter mancante");

  const finalMessages = typeof messages === 'string' ? [{ role: 'user', content: messages }] : messages;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: finalMessages,
      max_tokens: 2048, // 1. FORZA una risposta breve per rientrare nel piano gratuito
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Errore API OpenRouter: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "{}";
}

export async function scrapeAndAnalyze(url: string) {
  if (!url) {
    return { success: false, error: "URL non fornito." };
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
      ),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const publicDir = path.join(process.cwd(), "public");
    await fs.mkdir(publicDir, { recursive: true });
    const screenshotPathRelative = `/screenshots/${Date.now()}.png`;
    const screenshotPathFull = path.join(publicDir, screenshotPathRelative);
    await page.screenshot({ path: screenshotPathFull as `${string}.png` });

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
      screenshotPath: screenshotPathRelative, 
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
