import { NextRequest, NextResponse } from 'next/server';
import { analyzeLandingPage } from '@/lib/landing-page-analyzer';
import { analyzeLandingPageWithGemini } from '@/ai/flows/analyze-landing-page';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL richiesto' },
        { status: 400 }
      );
    }

    // Analizza la landing page con Puppeteer per estrarre gli elementi rilevanti
    const { data: landingData, screenshot } = await analyzeLandingPage(url);
    // Prepara l'input per il flow Gemini
    const input = {
      url,
      scrapedData: landingData,
      businessType: landingData.businessType || 'general',
      primaryGoal: landingData.primaryGoal || 'conversion',
      targetAudience: landingData.targetAudience || 'general',
    };
    // Chiamata al flow Gemini
    const analysis = await analyzeLandingPageWithGemini(input);
    return NextResponse.json({
      analysis,
      screenshot
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Errore nell'analisi della landing page" },
      { status: 500 }
    );
  }
}