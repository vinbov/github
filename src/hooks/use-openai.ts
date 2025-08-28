import { useState } from 'react';

interface AnalysisResult {
  messageClarity: string;
  visualImpact: string;
  persuasiveCopy: string;
  socialProof: string;
  callToAction: string;
  contactForm: string;
  userExperience: string;
  recommendations: string;
}

export function useOpenAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAnalysis = async (prompt: string, screenshot?: string): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Importa la Server Action dinamicamente
      const { scrapeAndAnalyze } = await import('@/app/actions/scrape-actions');
      
      // Nota: la Server Action attuale non supporta screenshot, 
      // per ora usiamo solo l'URL dal prompt se presente
      const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) {
        throw new Error('Nessun URL valido trovato nel prompt');
      }
      
      const result = await scrapeAndAnalyze(urlMatch[0]);
      
      if (!result.success) {
        throw new Error(result.error || 'Errore durante l\'analisi');
      }
      
      // Parsing strutturato della risposta
      const analysisResult: AnalysisResult = {
        messageClarity: JSON.stringify(result.analysis, null, 2),
        visualImpact: "",
        persuasiveCopy: "",
        socialProof: "",
        callToAction: "",
        contactForm: "",
        userExperience: "",
        recommendations: ""
      };
      
      return analysisResult;
    } catch (err: any) {
      setError(err.message || "Errore durante l'analisi");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateAnalysis,
    loading,
    error,
  };
}