"use server";

// 1. Importa da 'puppeteer-core' e importa il pacchetto chromium
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "fs/promises";
import path from "path";

async function callOpenRouter(prompt: string): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    throw new Error("La variabile d'ambiente OPENROUTER_API_KEY non è impostata.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Errore API OpenRouter: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices.length > 0 && data.choices[0].message) {
    return data.choices[0].message.content;
  } else {
    throw new Error("Struttura della risposta non valida dall'API di OpenRouter");
  }
}

export async function scrapeAndAnalyze(url: string) {
  if (!url) {
    return {
      success: false,
      error: "URL non fornito"
    };
  }

  let browser = null;

  try {
    // 2. Configura Puppeteer per l'ambiente serverless di Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
      ),
      headless: true,
    });

    const page = await browser.newPage();
    
    // Imposta user agent per evitare blocchi
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Crea la directory per gli screenshot se non esiste
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    // Crea uno screenshot della pagina
    const filename = `${Date.now()}-${new URL(url).hostname}.png`;
    const screenshotFilePath = path.join(screenshotsDir, filename);
    await page.screenshot({ path: screenshotFilePath as `${string}.png`, fullPage: true });
    const screenshotPath = `/screenshots/${filename}`;

    // Extract page data
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
        bodyText: document.body?.innerText?.trim().substring(0, 4000) || ''
      };
    });

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
      ${JSON.stringify(pageData)}
      ---
    `;
    
    const analysisJsonString = await callOpenRouter(analysisPrompt);

    await browser.close();

    const analysisObject = JSON.parse(analysisJsonString);

    return { 
      screenshotPath, 
      analysis: analysisObject
    };
  } catch (error) {
    console.error("Errore durante lo scraping o l'analisi:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze the page'
    };
  }
}
