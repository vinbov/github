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
