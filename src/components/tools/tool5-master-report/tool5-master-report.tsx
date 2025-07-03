import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, FileSpreadsheet, Play, StopCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import * as XLSX from 'xlsx';

export interface Tool5MasterReportProps {
  landingPageUrl: string;
  landingPageScreenshot: string;
}

export function Tool5MasterReport({ 
  landingPageUrl, 
  landingPageScreenshot
}: Tool5MasterReportProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{prompt: number; completion: number; total: number} | null>(null);
  
  // Nuovi stati per supportare il flusso in due fasi
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractionComplete, setExtractionComplete] = useState<boolean>(false);
  const [issues, setIssues] = useState<Array<{category: string; severity: string; issue: string}>>([]);
  const [aiAnalysisInProgress, setAiAnalysisInProgress] = useState<boolean>(false);
  const [elements, setElements] = useState<any[]>([]);
  
  const [analysis, setAnalysis] = useState<{
    messageClarity: string;
    visualImpact: string;
    persuasiveCopy: string;
    socialProof: string;
    callToAction: string;
    contactForm: string;
    userExperience: string;
    recommendations: string;
  } | null>(null);

  useEffect(() => {
    const extractLandingPageData = async () => {
      if (!landingPageUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fase 1: Estrazione dati HTML (senza AI)
        const response = await fetch('/api/analyze-landing-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: landingPageUrl,
            action: 'extract'
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Errore nell'estrazione dei dati");
        }
        
        const data = await response.json();
        setExtractedData(data.extractedData);
        setIssues(data.issues || []);
        
        // Prepara gli elementi per la visualizzazione in tabella e scaricamento in Excel
        prepareElementsForTable(data.extractedData.data);
        
        setExtractionComplete(true);
        
      } catch (err: any) {
        setError(err.message || "Errore durante l'analisi");
      } finally {
        setLoading(false);
      }
    };
    
    extractLandingPageData();
  }, [landingPageUrl]);
  
  const prepareElementsForTable = (data: any) => {
    const allElements = [];
    
    // Aggiungi headlines
    data.headlines.h1.forEach((text: string) => {
      allElements.push({
        type: 'Headline (H1)',
        text: text,
        category: 'messageClarity',
        details: 'Titolo principale',
        importance: 'Alta'
      });
    });
    
    data.headlines.h2.forEach((text: string) => {
      allElements.push({
        type: 'Sottotitolo (H2)',
        text: text,
        category: 'messageClarity',
        details: 'Sottotitolo',
        importance: 'Media'
      });
    });
    
    // Aggiungi CTA
    data.ctas.forEach((cta: any) => {
      allElements.push({
        type: 'CTA',
        text: cta.text,
        category: 'callToAction',
        details: cta.isAboveTheFold ? 'Above the fold' : 'Below the fold',
        importance: cta.isAboveTheFold ? 'Alta' : 'Media'
      });
    });
    
    // Aggiungi form
    data.contactForms.forEach((form: any, index: number) => {
      allElements.push({
        type: 'Form di contatto',
        text: `Form #${index + 1} con ${form.fields.length} campi`,
        category: 'contactForm',
        details: `Campi: ${form.fields.map((f: any) => f.type).join(', ')}`,
        importance: 'Alta'
      });
    });
    
    // Aggiungi social proof
    data.socialProof.testimonials.forEach((testimonial: any, index: number) => {
      allElements.push({
        type: 'Testimonianza',
        text: testimonial.text.substring(0, 100) + (testimonial.text.length > 100 ? '...' : ''),
        category: 'socialProof',
        details: `Testimonianza #${index + 1}`,
        importance: 'Media'
      });
    });
    
    data.socialProof.logos.forEach((logo: any, index: number) => {
      allElements.push({
        type: 'Logo cliente',
        text: logo.alt || `Logo #${index + 1}`,
        category: 'socialProof',
        details: `Src: ${logo.src}`,
        importance: 'Media'
      });
    });
    
    // Aggiungi immagini principali
    data.mainImages.forEach((image: any, index: number) => {
      allElements.push({
        type: 'Immagine',
        text: image.alt || `Immagine #${index + 1}`,
        category: 'visualImpact',
        details: image.isAboveTheFold ? 'Above the fold' : 'Below the fold',
        importance: image.isAboveTheFold ? 'Alta' : 'Media'
      });
    });
    
    // Aggiungi sezioni benefit
    data.benefitSections.forEach((section: any, index: number) => {
      allElements.push({
        type: 'Sezione benefit',
        text: `Sezione benefit #${index + 1}`,
        category: 'persuasiveCopy',
        details: 'Contiene informazioni sui benefici del prodotto/servizio',
        importance: 'Alta'
      });
    });
    
    setElements(allElements);
  };
  
  const runAiAnalysis = async () => {
    if (!extractedData) return;
    
    setAiAnalysisInProgress(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: landingPageUrl,
          extractedData: extractedData,
          action: 'analyze'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nell'analisi AI");
      }
      
      const data = await response.json();
      
      setTokenUsage({
        prompt: data.tokens.prompt_tokens,
        completion: data.tokens.completion_tokens,
        total: data.tokens.total_tokens
      });
      
      // Aggiorna l'analisi per la visualizzazione
      const analysisResult = {
        messageClarity: data.sections?.messageClarity || data.analysis,
        visualImpact: data.sections?.visualImpact || "",
        persuasiveCopy: data.sections?.persuasiveCopy || "",
        socialProof: data.sections?.socialProof || "",
        callToAction: data.sections?.callToAction || "",
        contactForm: data.sections?.contactForm || "",
        userExperience: data.sections?.userExperience || "",
        recommendations: data.sections?.recommendations || ""
      };
      
      setAnalysis(analysisResult);
      
    } catch (err: any) {
      setError(err.message || "Errore durante l'analisi AI");
    } finally {
      setAiAnalysisInProgress(false);
    }
  };
  
  const abortAnalysis = async () => {
    try {
      await fetch('/api/analyze-landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'abort'
        }),
      });
      
      setAiAnalysisInProgress(false);
      setError("Analisi interrotta dall'utente");
    } catch (err) {
      console.error("Errore nell'interruzione dell'analisi:", err);
    }
  };
  
  const downloadExcelReport = () => {
    if (!elements || elements.length === 0) return;
    
    // Crea un nuovo workbook
    const wb = XLSX.utils.book_new();
    
    // Crea un worksheet per gli elementi
    const ws = XLSX.utils.json_to_sheet(elements);
    
    // Aggiungi il worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Elementi Landing Page");
    
    // Crea un secondo worksheet per i problemi rilevati
    if (issues && issues.length > 0) {
      const issuesFormatted = issues.map(issue => ({
        Categoria: getCategoryName(issue.category),
        Severità: getSeverityText(issue.severity),
        Problema: issue.issue
      }));
      const wsIssues = XLSX.utils.json_to_sheet(issuesFormatted);
      XLSX.utils.book_append_sheet(wb, wsIssues, "Problemi Rilevati");
    }
    
    // Scarica il file Excel
    XLSX.writeFile(wb, `landing-page-elements-${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const downloadIssuesReport = () => {
    if (!issues || issues.length === 0) return;
    
    const issuesByCategory = issues.reduce((acc, issue) => {
      acc[issue.category] = acc[issue.category] || [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, any[]>);
    
    let reportContent = `# Problemi Rilevati nella Landing Page: ${landingPageUrl}\n\n`;
    reportContent += `Data analisi: ${new Date().toLocaleString()}\n\n`;
    
    Object.keys(issuesByCategory).forEach(category => {
      const categoryName = getCategoryName(category);
      reportContent += `## ${categoryName}\n\n`;
      
      issuesByCategory[category].forEach(issue => {
        const severityIcon = getSeverityIcon(issue.severity);
        reportContent += `- ${severityIcon} ${issue.issue}\n`;
      });
      
      reportContent += '\n';
    });
    
    reportContent += `\n## Riepilogo\n\n`;
    reportContent += `- Problemi critici: ${issues.filter(i => i.severity === 'critical').length}\n`;
    reportContent += `- Problemi gravi: ${issues.filter(i => i.severity === 'high').length}\n`;
    reportContent += `- Problemi medi: ${issues.filter(i => i.severity === 'medium').length}\n`;
    
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-issues-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  function getCategoryName(category: string): string {
    const categories: Record<string, string> = {
      messageClarity: 'Chiarezza del Messaggio',
      visualImpact: 'Impatto Visivo',
      persuasiveCopy: 'Copy Persuasivo',
      socialProof: 'Prova Sociale',
      callToAction: 'Call-to-Action',
      contactForm: 'Form di Contatto',
      userExperience: 'Esperienza Utente'
    };
    return categories[category] || category;
  }
  
  function getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    };
    return icons[severity] || '⚪';
  }
  
  function getSeverityText(severity: string): string {
    const texts: Record<string, string> = {
      critical: 'Critico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Basso'
    };
    return texts[severity] || 'Sconosciuto';
  }
  
  const cancelOperation = () => {
    if (aiAnalysisInProgress) {
      abortAnalysis();
    } else {
      setLoading(false);
      setError("Operazione annullata dall'utente");
    }
  };
  
  if (loading) return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisi in corso...</CardTitle>
        <CardDescription>
          Stiamo estraendo i dati dalla landing page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" onClick={cancelOperation}>
          <StopCircle className="mr-2 h-4 w-4" />
          Interrompi Operazione
        </Button>
      </CardFooter>
    </Card>
  );
  
  if (error) return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-red-600">Errore nell'analisi</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="mt-2">Riprova con un altro URL o contatta l'assistenza.</p>
      </CardContent>
    </Card>
  );
  
  if (extractionComplete && !analysis) {
    // Mostra elementi estratti in una tabella e permette di scaricarli
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Elementi HTML Estratti dalla Landing Page</CardTitle>
          <CardDescription>
            Abbiamo estratto {elements.length} elementi e rilevato {issues.length} potenziali problemi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Elementi principali rilevati</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 border">Tipo</th>
                    <th className="p-2 border">Testo</th>
                    <th className="p-2 border">Categoria</th>
                    <th className="p-2 border">Dettagli</th>
                    <th className="p-2 border">Importanza</th>
                  </tr>
                </thead>
                <tbody>
                  {elements.slice(0, 10).map((element, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="p-2 border">{element.type}</td>
                      <td className="p-2 border">{element.text}</td>
                      <td className="p-2 border">{getCategoryName(element.category)}</td>
                      <td className="p-2 border">{element.details}</td>
                      <td className="p-2 border">{element.importance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {elements.length > 10 && (
                <p className="mt-2 text-sm text-gray-500">
                  Mostrati i primi 10 elementi di {elements.length}. Scarica il report completo per vedere tutti gli elementi.
                </p>
              )}
            </div>

            <h3 className="text-lg font-medium mt-6">Problemi rilevati</h3>
            {issues.length > 0 ? (
              <div className="space-y-4">
                {['critical', 'high', 'medium', 'low'].map(severity => {
                  const filteredIssues = issues.filter(issue => issue.severity === severity);
                  if (filteredIssues.length === 0) return null;
                  
                  return (
                    <div key={severity} className="space-y-2">
                      <h3 className="font-medium">
                        {getSeverityIcon(severity)} {severity === 'critical' ? 'Problemi Critici' : 
                          severity === 'high' ? 'Problemi Gravi' : 
                          severity === 'medium' ? 'Problemi Medi' : 
                          'Problemi Minori'}
                      </h3>
                      <ul className="pl-6 space-y-1">
                        {filteredIssues.map((issue, index) => (
                          <li key={index} className="list-disc">
                            <span className="font-medium">{getCategoryName(issue.category)}:</span> {issue.issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Non sono stati rilevati problemi evidenti nella struttura della landing page.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div>
            <Button variant="outline" onClick={downloadExcelReport} className="mr-2">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Scarica Excel Completo
            </Button>
            <Button variant="outline" onClick={downloadIssuesReport} disabled={issues.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Scarica Report Problemi
            </Button>
          </div>
          <div className="flex">
            <Button onClick={cancelOperation} variant="destructive" className="mr-2">
              <StopCircle className="mr-2 h-4 w-4" />
              Interrompi Operazione
            </Button>
            <Button onClick={runAiAnalysis} disabled={aiAnalysisInProgress}>
              <Play className="mr-2 h-4 w-4" />
              Avvia Analisi AI Completa
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  if (aiAnalysisInProgress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Analisi AI in corso...</CardTitle>
          <CardDescription>
            Stiamo elaborando un'analisi approfondita della landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={abortAnalysis}>
            <StopCircle className="mr-2 h-4 w-4" />
            Interrompi Analisi
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analisi Completa della Landing Page</CardTitle>
        <CardDescription>
          Valutazione di {landingPageUrl} basata sui 7 elementi critici di una landing page efficace
        </CardDescription>
        {tokenUsage && (
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            Consumo token: {tokenUsage.total} 
            (Prompt: {tokenUsage.prompt}, Risposta: {tokenUsage.completion})
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messageClarity" className="w-full">
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value="messageClarity">Messaggio</TabsTrigger>
            <TabsTrigger value="visualImpact">Impatto Visivo</TabsTrigger>
            <TabsTrigger value="persuasiveCopy">Copy</TabsTrigger>
            <TabsTrigger value="socialProof">Prova Sociale</TabsTrigger>
            <TabsTrigger value="callToAction">CTA</TabsTrigger>
            <TabsTrigger value="contactForm">Form</TabsTrigger>
            <TabsTrigger value="userExperience">UX</TabsTrigger>
          </TabsList>

          <TabsContent value="messageClarity" className="space-y-4">
            <h3 className="text-lg font-bold">Chiarezza del Messaggio e Proposta di Valore</h3>
            <div className="whitespace-pre-wrap">{analysis?.messageClarity}</div>
          </TabsContent>

          <TabsContent value="visualImpact" className="space-y-4">
            <h3 className="text-lg font-bold">Impatto Visivo (Hero Section)</h3>
            <div className="whitespace-pre-wrap">{analysis?.visualImpact}</div>
          </TabsContent>

          <TabsContent value="persuasiveCopy" className="space-y-4">
            <h3 className="text-lg font-bold">Testo Persuasivo e Benefici</h3>
            <div className="whitespace-pre-wrap">{analysis?.persuasiveCopy}</div>
          </TabsContent>

          <TabsContent value="socialProof" className="space-y-4">
            <h3 className="text-lg font-bold">Prova Sociale</h3>
            <div className="whitespace-pre-wrap">{analysis?.socialProof}</div>
          </TabsContent>

          <TabsContent value="callToAction" className="space-y-4">
            <h3 className="text-lg font-bold">Call-to-Action</h3>
            <div className="whitespace-pre-wrap">{analysis?.callToAction}</div>
          </TabsContent>

          <TabsContent value="contactForm" className="space-y-4">
            <h3 className="text-lg font-bold">Modulo di Contatto</h3>
            <div className="whitespace-pre-wrap">{analysis?.contactForm}</div>
          </TabsContent>

          <TabsContent value="userExperience" className="space-y-4">
            <h3 className="text-lg font-bold">Esperienza Utente e Performance</h3>
            <div className="whitespace-pre-wrap">{analysis?.userExperience}</div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-slate-50 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Raccomandazioni per Miglioramenti</h3>
          <div className="whitespace-pre-wrap">{analysis?.recommendations}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={downloadExcelReport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Scarica Report Elementi
        </Button>
        <Button variant="destructive" onClick={cancelOperation}>
          <StopCircle className="mr-2 h-4 w-4" />
          Interrompi Operazione
        </Button>
      </CardFooter>
    </Card>
  );
}