import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, FileSpreadsheet, Play, Zap } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

// Definiamo tipi chiari per i dati
type AnalysisSection = 'messageClarity' | 'visualImpact' | 'persuasiveCopy' | 'socialProof' | 'callToAction' | 'contactForm' | 'userExperience';
type Analysis = Record<AnalysisSection | 'recommendations', string>;
type Issue = { category: string; severity: string; issue: string };
type ExtractedElement = { type: string; text: string; category: string; details: string; importance: string };
type TokenUsage = { prompt: number; completion: number; total: number };

// Definiamo lo stato del componente per una gestione più pulita
type ComponentState = 
  | { name: 'idle' }
  | { name: 'extracting' }
  | { name: 'extraction_failed'; error: string }
  | { name: 'extracted'; issues: Issue[]; elements: ExtractedElement[]; extractedData: any }
  | { name: 'analyzing'; issues: Issue[]; elements: ExtractedElement[] }
  | { name: 'analysis_failed'; issues: Issue[]; elements: ExtractedElement[]; extractedData: any; error: string }
  | { name: 'complete'; issues: Issue[]; elements: ExtractedElement[]; analysis: Analysis; tokenUsage: TokenUsage };

export interface Tool5MasterReportProps {
  landingPageUrl: string;
}

export function Tool5MasterReport({ landingPageUrl }: Tool5MasterReportProps) {
  const [state, setState] = useState<ComponentState>({ name: 'idle' });

  // Funzione per avviare l'estrazione
  const extractData = async () => {
    setState({ name: 'extracting' });
    try {
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: landingPageUrl, action: 'extract' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore sconosciuto durante l'estrazione");
      }

      const data = await response.json();
      const elements = prepareElementsForTable(data.extractedData?.data);
      setState({
        name: 'extracted',
        issues: data.issues || [],
        elements,
        extractedData: data.extractedData,
      });
    } catch (err: any) {
      setState({ name: 'extraction_failed', error: err.message });
    }
  };

  // Funzione per avviare l'analisi AI
  const runAiAnalysis = async () => {
    if (state.name !== 'extracted' && state.name !== 'analysis_failed') return;
    
    const { issues, elements, extractedData } = state;
    setState({ name: 'analyzing', issues, elements });

    try {
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: landingPageUrl, extractedData, action: 'analyze' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore sconosciuto durante l'analisi AI");
      }

      const data = await response.json();
      const analysisResult: Analysis = {
        messageClarity: data.sections?.messageClarity || "",
        visualImpact: data.sections?.visualImpact || "",
        persuasiveCopy: data.sections?.persuasiveCopy || "",
        socialProof: data.sections?.socialProof || "",
        callToAction: data.sections?.callToAction || "",
        contactForm: data.sections?.contactForm || "",
        userExperience: data.sections?.userExperience || "",
        recommendations: data.sections?.recommendations || data.analysis || ""
      };
      const tokenUsage: TokenUsage = {
        prompt: data.tokens?.prompt_tokens || 0,
        completion: data.tokens?.completion_tokens || 0,
        total: data.tokens?.total_tokens || 0,
      };

      setState({ name: 'complete', issues, elements, analysis: analysisResult, tokenUsage });
    } catch (err: any) {
      setState({ name: 'analysis_failed', issues, elements, extractedData, error: err.message });
    }
  };

  // useEffect avvia l'estrazione solo una volta
  useEffect(() => {
    if (landingPageUrl) {
      extractData();
    }
  }, [landingPageUrl]);

  // Memoizziamo le funzioni di download per evitare ricreazioni inutili
  const downloadExcelReport = useMemo(() => () => {
    if ('elements' in state && state.elements.length > 0) {
      const wb = XLSX.utils.book_new();
      const wsElements = XLSX.utils.json_to_sheet(state.elements);
      XLSX.utils.book_append_sheet(wb, wsElements, "Elementi Estratti");
      if (state.issues.length > 0) {
        const wsIssues = XLSX.utils.json_to_sheet(state.issues.map(i => ({ Categoria: getCategoryName(i.category), Severita: i.severity, Problema: i.issue })));
        XLSX.utils.book_append_sheet(wb, wsIssues, "Problemi Rilevati");
      }
      XLSX.writeFile(wb, `report-elementi-${new URL(landingPageUrl).hostname}-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  }, [state, landingPageUrl]);

  // Render condizionale basato sullo stato
  switch (state.name) {
    case 'extracting':
    case 'analyzing':
      return <LoadingCard title={state.name === 'extracting' ? "Estrazione in corso..." : "Analisi AI in corso..."} description="Stiamo analizzando la tua landing page..." />;
    
    case 'extraction_failed':
      return <ErrorCard error={state.error} onRetry={extractData} />;

    case 'extracted':
    case 'analysis_failed':
      return (
        <ExtractionResultCard
          issues={state.issues}
          elements={state.elements}
          onAnalyzeClick={runAiAnalysis}
          onDownloadClick={downloadExcelReport}
          error={state.name === 'analysis_failed' ? state.error : undefined}
        />
      );

    case 'complete':
      return (
        <FullReportCard
          url={landingPageUrl}
          analysis={state.analysis}
          tokenUsage={state.tokenUsage}
          onDownloadClick={downloadExcelReport}
        />
      );

    default:
      return null;
  }
}

// Componenti di UI per mantenere il render pulito
const LoadingCard = ({ title, description }: { title: string; description: string }) => (
  <Card className="w-full"><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></CardContent></Card>
);

const ErrorCard = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="w-full"><CardHeader><CardTitle className="text-red-600">Errore</CardTitle></CardHeader><CardContent><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Si è verificato un errore</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></CardContent><CardFooter><Button onClick={onRetry}>Riprova</Button></CardFooter></Card>
);

const ExtractionResultCard = ({ issues, elements, onAnalyzeClick, onDownloadClick, error }: { issues: Issue[], elements: ExtractedElement[], onAnalyzeClick: () => void, onDownloadClick: () => void, error?: string }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Estrazione Completata</CardTitle>
      <CardDescription>Abbiamo estratto {elements.length} elementi e rilevato {issues.length} problemi.</CardDescription>
    </CardHeader>
    <CardContent>
      {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Errore Analisi AI</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <h3 className="font-bold mb-2">Problemi Rilevati</h3>
      {issues.length > 0 ? (
        <ul className="space-y-1 list-disc pl-5">
          {issues.map((issue, i) => <li key={i}>{getSeverityIcon(issue.severity)} <strong>{getCategoryName(issue.category)}:</strong> {issue.issue}</li>)}
        </ul>
      ) : <p>Nessun problema strutturale rilevato.</p>}
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" onClick={onDownloadClick}><FileSpreadsheet className="mr-2 h-4 w-4" /> Scarica Report Excel</Button>
      <Button onClick={onAnalyzeClick}><Play className="mr-2 h-4 w-4" /> Avvia Analisi AI Completa</Button>
    </CardFooter>
  </Card>
);

const FullReportCard = ({ url, analysis, tokenUsage, onDownloadClick }: { url: string, analysis: Analysis, tokenUsage: TokenUsage, onDownloadClick: () => void }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Analisi Completa della Landing Page</CardTitle>
      <CardDescription>Valutazione di {url}</CardDescription>
      <div className="text-xs text-gray-500 mt-1 flex items-center"><Zap className="w-4 h-4 mr-1" />Consumo token: {tokenUsage.total}</div>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="recommendations">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">Raccomandazioni</TabsTrigger>
          <TabsTrigger value="messageClarity">Messaggio</TabsTrigger>
          <TabsTrigger value="visualImpact">Impatto Visivo</TabsTrigger>
          <TabsTrigger value="callToAction">CTA</TabsTrigger>
        </TabsList>
        <TabsContent value="recommendations" className="mt-4"><div className="whitespace-pre-wrap p-4 bg-slate-50 rounded-lg">{analysis.recommendations}</div></TabsContent>
        <TabsContent value="messageClarity" className="mt-4"><div className="whitespace-pre-wrap">{analysis.messageClarity}</div></TabsContent>
        <TabsContent value="visualImpact" className="mt-4"><div className="whitespace-pre-wrap">{analysis.visualImpact}</div></TabsContent>
        <TabsContent value="callToAction" className="mt-4"><div className="whitespace-pre-wrap">{analysis.callToAction}</div></TabsContent>
      </Tabs>
    </CardContent>
    <CardFooter>
      <Button variant="outline" onClick={onDownloadClick}><FileSpreadsheet className="mr-2 h-4 w-4" /> Scarica Report Excel</Button>
    </CardFooter>
  </Card>
);

// Funzioni di utilità
function prepareElementsForTable(data: any): ExtractedElement[] {
  if (!data) return [];
  const allElements: ExtractedElement[] = [];
  data.headlines?.h1?.forEach((text: string) => allElements.push({ type: 'Headline (H1)', text, category: 'messageClarity', details: 'Titolo principale', importance: 'Alta' }));
  data.headlines?.h2?.forEach((text: string) => allElements.push({ type: 'Sottotitolo (H2)', text, category: 'messageClarity', details: 'Sottotitolo', importance: 'Media' }));
  data.ctas?.forEach((cta: any) => allElements.push({ type: 'CTA', text: cta.text, category: 'callToAction', details: cta.isAboveTheFold ? 'Above the fold' : 'Below the fold', importance: 'Alta' }));
  data.contactForms?.forEach((form: any, index: number) => allElements.push({ type: 'Form di contatto', text: `Form #${index + 1}`, category: 'contactForm', details: `Campi: ${form.fields.map((f: any) => f.type).join(', ')}`, importance: 'Alta' }));
  data.socialProof?.testimonials?.forEach((testimonial: any) => allElements.push({ type: 'Testimonianza', text: testimonial.text.substring(0, 100) + '...', category: 'socialProof', details: 'Testimonianza', importance: 'Media' }));
  return allElements;
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = { messageClarity: 'Chiarezza Messaggio', visualImpact: 'Impatto Visivo', callToAction: 'Call to Action' };
  return names[category] || category;
}

function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡' };
  return icons[severity] || '⚪';
}