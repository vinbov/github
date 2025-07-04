import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { z } from 'zod';
import { analyzeContentWithOpenRouter } from '@/lib/openrouter';

// Applica il plugin stealth a puppeteer una sola volta
puppeteer.use(StealthPlugin());

// Schema di validazione per l'URL in ingresso
const urlSchema = z.object({
  url: z.string().url({ message: "Invalid URL provided." }),
});

// Funzione per lo scraping della pagina con Puppeteer
async function scrapePageContent(url: string): Promise<string> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Estrai solo il testo visibile per l'analisi
    const textContent = await page.evaluate(() => document.body.innerText);
    return textContent;
  } finally {
    await browser.close();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = urlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request body', details: validation.error.flatten() }, { status: 400 });
    }

    const { url } = validation.data;

    // 1. Esegui lo scraping del contenuto testuale della pagina
    const pageContent = await scrapePageContent(url);

    // Limita la lunghezza per evitare di superare i limiti dell'API e ridurre i costi
    const truncatedContent = pageContent.substring(0, 20000);

    // 2. Invia il contenuto a OpenRouter per l'analisi
    const analysisResult = await analyzeContentWithOpenRouter(truncatedContent);

    // 3. Restituisci il risultato dell'analisi
    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error('API Error in analyze-landing-page:', error);
    // Restituisci un messaggio di errore generico al client
    return NextResponse.json({ error: error.message || 'An unknown server error occurred' }, { status: 500 });
  }
}