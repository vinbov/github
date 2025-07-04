'use server';

import type { LandingPageAnalysis, LandingPageScrapedData } from '@/lib/types';
import { analyzeLandingPageWithGemini } from '@/ai/flows/analyze-landing-page';

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
  input: AnalyzeLandingPageInput
): Promise<LandingPageAnalysis> {
  // Chiamata diretta al flow Genkit (Gemini)
  return await analyzeLandingPageWithGemini(input);
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
