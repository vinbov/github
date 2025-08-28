import genkit from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeLandingPageInputSchema = z.object({
  url: z.string(),
  scrapedData: z.any(),
  businessType: z.string(),
  primaryGoal: z.string(),
  targetAudience: z.string(),
});
export type AnalyzeLandingPageInput = z.infer<typeof AnalyzeLandingPageInputSchema>;

const LandingPageAnalysisSchema = z.object({
  m1MessageClarity: z.number(),
  m2VisualImpact: z.number(),
  m3CtaEffectiveness: z.number(),
  m4TrustElements: z.number(),
  m5UserFlow: z.number(),
  m6MobileExperience: z.number(),
  m7SocialProof: z.number(),
  m8UrgencyScarcity: z.number(),
  m9ContentQuality: z.number(),
  m10ConversionOptimization: z.number(),
  overallScore: z.number(),
  evaluation: z.string(),
  strengths: z.array(z.string()),
  criticalIssues: z.array(z.string()),
  priorityRecommendations: z.array(z.string()),
  detailedAnalysis: z.string(),
  conversionProbability: z.string(),
});
export type LandingPageAnalysis = z.infer<typeof LandingPageAnalysisSchema>;

export const analyzeLandingPageWithGeminiPrompt = genkit.definePrompt({
  name: 'analyzeLandingPageWithGeminiPrompt',
  input: { schema: AnalyzeLandingPageInputSchema },
  output: { schema: LandingPageAnalysisSchema },
  model: 'googleai/gemini-2.5-pro',
  prompt: `Analizza la seguente landing page e i suoi dati estratti secondo il framework 10M (10 Metrics):\n\nURL: {{{url}}}\nBusiness Type: {{{businessType}}}\nPrimary Goal: {{{primaryGoal}}}\nTarget Audience: {{{targetAudience}}}\n\nDati estratti:\n{{{JSON.stringify(scrapedData)}}}\n\nFramework di valutazione:\nM1: Chiarezza messaggio (0-10)\nM2: Impatto visivo (0-10)\nM3: Efficacia CTA (0-10)\nM4: Elementi fiducia (0-10)\nM5: Flusso utente (0-10)\nM6: Esperienza mobile (0-10)\nM7: Prova sociale (0-10)\nM8: Urgenza/scarsità (0-10)\nM9: Qualità contenuto (0-10)\nM10: Ottimizzazione conversioni (0-10)\n\nRispondi con un oggetto JSON che contenga:\n- Punteggi per m1MessageClarity, m2VisualImpact, m3CtaEffectiveness, m4TrustElements, m5UserFlow, m6MobileExperience, m7SocialProof, m8UrgencyScarcity, m9ContentQuality, m10ConversionOptimization.\n- overallScore: somma dei punteggi (0-100).\n- evaluation: valutazione qualitativa (85-100: Ottimo; 70-84: Buono; 50-69: Mediocre; 0-49: Scarso).\n- strengths: array con 3 punti di forza.\n- criticalIssues: array con 3 problemi critici.\n- priorityRecommendations: array con 5 raccomandazioni prioritarie.\n- detailedAnalysis: analisi dettagliata.\n- conversionProbability: "Alta", "Media" o "Bassa".\n\nL'intero output DEVE essere un oggetto JSON valido. Non includere testo prima o dopo l'oggetto JSON.`,
  config: { temperature: 0.3 },
});

export async function analyzeLandingPageWithGemini(input: AnalyzeLandingPageInput): Promise<LandingPageAnalysis> {
  const { output } = await analyzeLandingPageWithGeminiPrompt(input);
  return output!;
} 