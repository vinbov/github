'use server';

import type {
  AnalyzeFacebookAdMarketingAngleInput,
  AnalyzeFacebookAdMarketingAngleOutput,
} from '@/lib/types'; 
import { analyzeFacebookAdMarketingAngle } from '@/ai/flows/analyze-facebook-ad-marketing-angle';

// Rimuovo tutte le funzioni parseOpenAIResponse, buildOpenAIPrompt, commenti e log relativi a OpenAI

const INPUT_TOKEN_THRESHOLD = 3000; // Soglia per i token di input stimati

export async function analyzeAdAngleAction(
  input: AnalyzeFacebookAdMarketingAngleInput
): Promise<AnalyzeFacebookAdMarketingAngleOutput> {
  // Chiamata diretta al flow Genkit (Gemini)
  return await analyzeFacebookAdMarketingAngle(input);
}

