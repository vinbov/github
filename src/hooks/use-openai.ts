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
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          screenshot,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella chiamata API');
      }
      
      const data = await response.json();
      
      // Parsing strutturato della risposta
      const analysisResult: AnalysisResult = {
        messageClarity: data.sections?.messageClarity || data.analysis,
        visualImpact: data.sections?.visualImpact || "",
        persuasiveCopy: data.sections?.persuasiveCopy || "",
        socialProof: data.sections?.socialProof || "",
        callToAction: data.sections?.callToAction || "",
        contactForm: data.sections?.contactForm || "",
        userExperience: data.sections?.userExperience || "",
        recommendations: data.sections?.recommendations || ""
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