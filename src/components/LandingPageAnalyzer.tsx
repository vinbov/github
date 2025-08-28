// filepath: src/components/LandingPageAnalyzer.tsx
'use client';

import { useState } from 'react';
import { scrapeAndAnalyze } from '@/app/actions/scrape-actions'; // Importa la nuova server action

// ... (i tipi possono rimanere gli stessi o essere adattati se la server action restituisce un formato diverso)
type AnalysisResponse = {
  success: boolean;
  analysis?: any; // Adatta questo tipo in base alla struttura reale
  error?: string;
};


export default function LandingPageAnalyzer() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      // Chiama direttamente la server action
      const result = await scrapeAndAnalyze(url);

      if (!result.success || !result.analysis) {
        const errorMsg = !result.success && result.error ? result.error : 'Failed to start analysis.';
        throw new Error(errorMsg);
      }
      
      // La server action ora restituisce direttamente l'oggetto di analisi
      const analysisContent = result.analysis;
      if (analysisContent) {
        // Formattiamo l'oggetto JSON per una visualizzazione leggibile
        setAnalysis(JSON.stringify(analysisContent, null, 2));
      } else {
        throw new Error('Could not parse the analysis from the server action response.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">Landing Page Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="flex-grow p-2 border rounded-md text-black"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {analysis && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50 text-black">
          <h2 className="text-xl font-semibold mb-2">Analysis Result</h2>
          {/* Usiamo pre-wrap per preservare la formattazione del testo (spazi, a capo) */}
          <p className="whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
}