"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import { generateMasterReportAction } from '@/app/actions/report-actions'; // 1. Importo la action corretta
import type { ComparisonResult, PertinenceAnalysisResult, ScrapedAd, AdWithAngleAnalysis, GscAnalyzedData } from '@/lib/types';
import type { DataForSEOKeywordMetrics } from '@/lib/dataforseo/types';

// Definisco le props che il componente accetta
interface Tool5MasterReportProps {
  tool1Data: {
    comparisonResultsCount: {
      common: number;
      mySiteOnly: number;
      competitorOnly: number;
      totalUnique: number;
    };
    rawResults: ComparisonResult[];
    activeCompetitorNames: string[];
  };
  tool2Data: {
    analysisResults: PertinenceAnalysisResult[];
    industryContext: string;
  };
  toolDataForSeoData: {
    seedKeywords: string;
    locationContext: string;
    results: DataForSEOKeywordMetrics[];
    totalIdeasFound: number;
  };
  tool3Data: {
    scrapedAds: ScrapedAd[];
    adsWithAnalysis: AdWithAngleAnalysis[];
  };
  tool4Data: {
    analyzedGscData: GscAnalyzedData | null;
    gscFiltersDisplay: string;
  };
}

export function Tool5MasterReport({
  tool1Data,
  tool2Data,
  toolDataForSeoData,
  tool3Data,
  tool4Data,
}: Tool5MasterReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');

  // 2. Questa è la funzione CORRETTA per generare il report
  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReportContent('');

    try {
      // Creo i riassunti dei dati da inviare all'AI
      const summaries = {
        tool1Summary: `Conteggi: ${tool1Data.comparisonResultsCount.common} comuni, ${tool1Data.comparisonResultsCount.mySiteOnly} solo mie, ${tool1Data.comparisonResultsCount.competitorOnly} solo competitor. Totale uniche: ${tool1Data.comparisonResultsCount.totalUnique}.`,
        tool2Summary: `Contesto: ${tool2Data.industryContext}. Trovate ${tool2Data.analysisResults.length} keyword analizzate.`,
        dataForSeoSummary: `Keywords iniziali: '${toolDataForSeoData.seedKeywords}'. Trovate ${toolDataForSeoData.totalIdeasFound} idee.`,
        tool3Summary: `Analizzati ${tool3Data.scrapedAds.length} annunci, di cui ${tool3Data.adsWithAnalysis.length} con analisi dell'angolo di marketing.`,
        tool4Summary: `Contesto filtri GSC: ${tool4Data.gscFiltersDisplay}. Analisi disponibile: ${tool4Data.analyzedGscData ? 'Sì' : 'No'}.`
      };

      // Chiamo la Server Action corretta con i dati riassunti
      const report = await generateMasterReportAction(summaries);
      setReportContent(report);

    } catch (err: any) {
      setError(err.message || "Si è verificato un errore sconosciuto durante la generazione del report.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per verificare se ci sono dati sufficienti per generare il report
  const hasEnoughData = () => {
    return tool1Data.rawResults.length > 0 || tool2Data.analysisResults.length > 0 || toolDataForSeoData.results.length > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Strategico Consolidato</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <p className="text-center text-muted-foreground mb-4">
            Questo strumento analizza i dati raccolti dagli altri tool e genera un report strategico con un piano d'azione.
          </p>
          <Button onClick={handleGenerateReport} disabled={isLoading || !hasEnoughData()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Genera Report Strategico'}
          </Button>
          {!hasEnoughData() && <p className="text-sm text-destructive mt-2">Esegui almeno un'analisi negli altri tool per abilitare il report.</p>}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Errore</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {reportContent && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Risultato del Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{reportContent}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}