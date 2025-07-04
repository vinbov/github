"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ScrapedAd, AdWithAngleAnalysis, ApifyRawAdItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { analyzeAdAngleAction } from '@/app/actions/tool3-actions';
import { TableScrapedAds } from './table-scraped-ads';
import { TableAngleAnalysis } from './table-angle-analysis';
import { exportToCSV } from '@/lib/csv';
import { PlayIcon, Download, AlertCircle, Bot, SearchCode, Loader2, FileText, PackageX, CheckSquare, Square, StopCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';


const generateId = () => Math.random().toString(36).substr(2, 9);

interface Tool3ScraperProps {
  apifyToken: string;
  setApifyToken: (value: string) => void;
  apifyActorId: string;
  setApifyActorId: (value: string) => void;
  fbAdsUrl: string;
  setFbAdsUrl: (value: string) => void;
  maxAdsToProcess: number;
  setMaxAdsToProcess: (value: number) => void;
  scrapedAds: ScrapedAd[];
  setScrapedAds: React.Dispatch<React.SetStateAction<ScrapedAd[]>>;
  adsWithAnalysis: AdWithAngleAnalysis[];
  setAdsWithAnalysis: React.Dispatch<React.SetStateAction<AdWithAngleAnalysis[]>>;
}

export function Tool3Scraper({
  apifyToken,
  setApifyToken,
  apifyActorId,
  setApifyActorId,
  fbAdsUrl,
  setFbAdsUrl,
  maxAdsToProcess,
  setMaxAdsToProcess,
  scrapedAds,
  setScrapedAds,
  adsWithAnalysis,
  setAdsWithAnalysis,
}: Tool3ScraperProps) {
  const [isLoadingScraping, setIsLoadingScraping] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [apifyStatus, setApifyStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedAdIds, setSelectedAdIds] = useState<Set<string>>(new Set());
  
  const [totalAdsInCurrentBatch, setTotalAdsInCurrentBatch] = useState(0);
  const [adsProcessedInCurrentBatch, setAdsProcessedInCurrentBatch] = useState(0);

  const isAnalysisStoppedRef = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  const runScraping = async () => {
    if (!apifyToken) { setError("Inserisci il tuo Apify API Token."); return; }
    if (!apifyActorId) { setError("Inserisci l'Apify Actor ID."); return; }
    if (!fbAdsUrl || !fbAdsUrl.startsWith("http")) { setError("Inserisci un URL valido per la Facebook Ads Library."); return; }

    setIsLoadingScraping(true);
    setLoadingMessage("Avvio scraping con Apify...");
    setApifyStatus("Stato: Inizializzazione...");
    setError(null);
    setScrapedAds([]); 
    setAdsWithAnalysis([]); 
    setSelectedAdIds(new Set());
    setAdsProcessedInCurrentBatch(0);
    setTotalAdsInCurrentBatch(0);


    const apifyInputPayload = {
      urls: [{ url: fbAdsUrl }],
      count: 100, 
      "scrapePageAds.activeStatus": "all",
      "scrapePageAds.adType": "all", // Include tutti i tipi di ads (video, foto, carousel, etc.)
      "scrapePageAds.mediaType": "all", // Tutti i media (video, immagini, etc.)
      "scrapePageAds.platforms": ["facebook", "instagram", "messenger", "audience_network"], // Specificamente tutti i placement
      period: "",
      "scrapePageAds.includeContent": true, // Forza l'inclusione del contenuto
      "scrapePageAds.includeInactive": true // Assicurati che includa anche quelle non attive
    };
    const apiUrl = `https://api.apify.com/v2/acts/${apifyActorId}/run-sync-get-dataset-items?token=${apifyToken}&format=json&clean=true`;

    try {
      setLoadingMessage("Esecuzione Actor Apify (potrebbe richiedere tempo)...");
      setApifyStatus("Stato: Invocazione API Apify...");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apifyInputPayload)
      });

      const responseText = await response.text();
      if (!response.ok) {
        let errorMsg = `Errore API Apify (${response.status})`;
        try { const errorJson = JSON.parse(responseText); errorMsg += `: ${errorJson.error?.message || responseText}`; } 
        catch (e) { errorMsg += `: ${responseText}`; }
        throw new Error(errorMsg);
      }

      const items: ApifyRawAdItem[] = JSON.parse(responseText);
      if (!Array.isArray(items)) throw new Error("La risposta dell'API Apify non è un array come atteso.");
      
      if (items.length === 0) {
        setLoadingMessage("Scraping completato. Nessun dato trovato.");
        setApifyStatus("Stato: Completato - Nessun dato.");
        toast({ title: "Nessun Annuncio", description: "Nessun annuncio trovato per i criteri specificati." });
        setIsLoadingScraping(false);
        return;
      }
      
      setLoadingMessage("Processazione risultati...");
      setApifyStatus("Stato: Processazione dati...");

      // Debug logging per vedere la struttura dei dati
      console.log("🔍 Debug Apify Data Structure:", JSON.stringify(items.slice(0, 2), null, 2));

      // Log aggiuntivo per identificare annunci Instagram specifici
      items.slice(0, 5).forEach((item, index) => {
        const platforms = item.snapshot?.platforms || [];
        const isInstagram = platforms.includes('instagram') || 
                          item.snapshot?.instagram_actor_name || 
                          item.snapshot?.instagram_text;
        
        if (isInstagram) {
          console.log(`🔍 Annuncio Instagram rilevato #${index}:`, {
            platforms: platforms,
            instagram_fields: {
              actor_name: item.snapshot?.instagram_actor_name,
              instagram_text: item.snapshot?.instagram_text,
              story_text: item.snapshot?.story_text,
              text: item.snapshot?.text,
              body: item.snapshot?.body?.text,
              caption: item.snapshot?.caption
            }
          });
        }
      });

      const processedAdsCollector: ScrapedAd[] = [];
      let adsCounter = 0;
      
      // Helper function per estrarre testo da strutture diverse
      const extractAdText = (item: any, card?: any): string => {
        const sources = [
          // Card-based text sources
          card?.body,
          card?.text,
          card?.caption,
          card?.description,
          card?.creative_body,
          // Snapshot-based text sources  
          item.snapshot?.body?.text,
          item.snapshot?.text,
          item.snapshot?.caption,
          item.snapshot?.description,
          item.snapshot?.creative_body,
          item.snapshot?.ad_creative_body,
          item.snapshot?.post_text,
          item.snapshot?.content,
          // Instagram-specific text sources
          item.snapshot?.instagram_actor_name,
          item.snapshot?.actor_name,
          item.snapshot?.instagram_text,
          item.snapshot?.story_text,
          // Alternative nested structures
          item.snapshot?.story?.text,
          item.snapshot?.story?.body,
          item.snapshot?.creative?.body,
          item.snapshot?.creative?.text,
          item.snapshot?.creative?.caption,
          item.snapshot?.media?.caption,
          item.snapshot?.media?.text,
          // Fallback to any text field
          item.text,
          item.body,
          item.description,
          item.caption
        ];
        
        const foundText = sources.find(text => text && typeof text === 'string' && text.trim().length > 0) || "";
        
        // Debug logging per vedere cosa stiamo estraendo
        if (foundText && console) {
          console.log("🔍 Testo estratto:", foundText.substring(0, 100) + (foundText.length > 100 ? "..." : ""));
        }
        
        return foundText;
      };

      // Helper function per estrarre titolo
      const extractAdTitle = (item: any, card?: any): string => {
        const sources = [
          card?.title,
          card?.headline,
          item.snapshot?.title,
          item.snapshot?.headline,
          item.snapshot?.creative_link_title,
          item.snapshot?.page_name,
          item.snapshot?.byline,
          item.title,
          "N/D"
        ];
        
        return sources.find(title => title && typeof title === 'string' && title.trim().length > 0) || "N/D";
      };

      // Helper function per estrarre immagine/video
      const extractAdImage = (item: any, card?: any): string => {
        const sources = [
          card?.resized_image_url,
          card?.original_image_url,
          card?.image_url,
          item.snapshot?.videos?.[0]?.video_preview_image_url,
          item.snapshot?.videos?.[0]?.video_hd_url,
          item.snapshot?.videos?.[0]?.video_sd_url,
          item.snapshot?.images?.[0]?.url,
          item.snapshot?.images?.[0]?.original_image_url,
          item.snapshot?.creative_image_url,
          item.snapshot?.page_profile_picture_url,
          item.image_url,
          item.snapshot?.media?.[0]?.image_url,
          item.snapshot?.media?.[0]?.video_preview_image_url
        ];
        
        return sources.find(url => url && typeof url === 'string' && url.trim().length > 0) || "";
      };

      // Helper function per estrarre link
      const extractAdLink = (item: any, card?: any): string => {
        const sources = [
          card?.link_url,
          card?.cta_url,
          item.snapshot?.link_url,
          item.snapshot?.cta_url,
          item.snapshot?.creative_link_url,
          item.snapshot?.page_profile_uri,
          item.url,
          item.link_url
        ];
        
        return sources.find(url => url && typeof url === 'string' && url.trim().length > 0) || "";
      };
      
      for (const item of items) {
        // Process cards se presenti
        const snapshotCards = item.snapshot?.cards;
        if (snapshotCards && snapshotCards.length > 0) {
          for (const card of snapshotCards) {
            if (adsCounter >= maxAdsToProcess) break;
            
            const adText = extractAdText(item, card);
            const adTitle = extractAdTitle(item, card);
            const adImage = extractAdImage(item, card);
            const adLink = extractAdLink(item, card);
            
            // Solo aggiungi se abbiamo almeno testo o immagine
            if (adText || adImage) {
              processedAdsCollector.push({
                id: generateId(),
                testo: adText || "[Contenuto visivo - possibile Instagram Story/Reel]",
                titolo: adTitle,
                link: adLink,
                immagine: adImage
              });
              adsCounter++;            }
          }
        } 
        
        // Process snapshot diretto
        if (item.snapshot && adsCounter < maxAdsToProcess) {
          const adText = extractAdText(item);
          const adTitle = extractAdTitle(item);
          const adImage = extractAdImage(item);
          const adLink = extractAdLink(item);
          
          // Solo aggiungi se abbiamo almeno testo o immagine e non è un duplicato (logic di base)
          if ((adText || adImage) && !processedAdsCollector.find(existing => 
            existing.testo === adText && existing.titolo === adTitle && existing.immagine === adImage
          )) {
            processedAdsCollector.push({
              id: generateId(),
              testo: adText || "[Contenuto visivo - possibile Instagram Story/Reel]",
              titolo: adTitle,
              link: adLink,
              immagine: adImage
            });
            adsCounter++;
          }
        }
        
        if (adsCounter >= maxAdsToProcess) break;
      }
      
      setScrapedAds(processedAdsCollector); 
      setAdsWithAnalysis(processedAdsCollector.map(ad => ({...ad}))); 
      setLoadingMessage("Scraping completato!");
      setApifyStatus("Stato: Completato.");
      toast({ title: "Scraping Completato", description: `${processedAdsCollector.length} annunci recuperati.` });

    } catch (e: any) {
      console.error("Errore durante lo scraping (Tool 3):", e);
      setError(`Errore scraping: ${e.message}`);
      setApifyStatus(`Stato: Errore - ${e.message.substring(0,100)}`);
      toast({ title: "Errore Scraping", description: e.message, variant: "destructive" });
    } finally {
      setIsLoadingScraping(false);
    }
  };

  const handleToggleAdSelection = (adId: string) => {
    setSelectedAdIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(adId)) {
        newSelectedIds.delete(adId);
      } else {
        newSelectedIds.add(adId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAllAds = () => {
    setSelectedAdIds(new Set(scrapedAds.map(ad => ad.id)));
  };

  const handleDeselectAllAds = () => {
    setSelectedAdIds(new Set());
  };

  const handleStopAnalysis = () => {
    console.log("Tool3: handleStopAnalysis - Richiesta interruzione analisi.");
    isAnalysisStoppedRef.current = true;
    setLoadingMessage("Interruzione analisi angle in corso... Attendi il completamento delle chiamate attive.");
    // Non disabilitare il pulsante di stop qui, l'utente potrebbe volerlo cliccare di nuovo
    // se l'interruzione sembra lenta (anche se non avrà effetto ulteriore).
    // La disabilitazione del pulsante "Analizza" e la gestione di isLoadingAnalysis si occuperanno del resto.
  };


  const runAngleAnalysis = async () => {
    console.log("Tool3: runAngleAnalysis - Inizio. Annunci selezionati:", selectedAdIds.size);
    if (selectedAdIds.size === 0) {
      setError("Nessun annuncio selezionato per l'analisi.");
      toast({ title: "Nessuna Selezione", description: "Seleziona almeno un annuncio per l'analisi.", variant: "default" });
      console.log("Tool3: runAngleAnalysis - Nessun annuncio selezionato.");
      return;
    }
    
    isAnalysisStoppedRef.current = false;
    setIsLoadingAnalysis(true);
    setLoadingMessage(`Analisi angle in corso per ${selectedAdIds.size} annunci selezionati con Gemini...`);
    setError(null);
    setAdsProcessedInCurrentBatch(0);
    setTotalAdsInCurrentBatch(selectedAdIds.size);


    const adsToAnalyze = adsWithAnalysis.filter(ad => selectedAdIds.has(ad.id));
    console.log("Tool3: runAngleAnalysis - Annunci da analizzare:", adsToAnalyze.length, adsToAnalyze);
    
    const analysisPromises = adsToAnalyze.map(async (ad, index) => {
      if (isAnalysisStoppedRef.current) {
        console.log(`Tool3: runAngleAnalysis - Analisi interrotta prima di processare ad ID: ${ad.id}`);
        setAdsProcessedInCurrentBatch(prev => prev + 1);
        return { ...ad, analysisError: "Analisi interrotta dall'utente prima dell'esecuzione." };
      }
      
      console.log(`Tool3: runAngleAnalysis - Preparazione analisi per ad ID: ${ad.id} (indice: ${index})`);
      if (ad.angleAnalysis || ad.analysisError) {
        console.log(`Tool3: runAngleAnalysis - Ad ID: ${ad.id} già processato o con errore precedente, skipping.`);
        setAdsProcessedInCurrentBatch(prev => prev + 1);
        setLoadingMessage(`Analisi angle: ${adsProcessedInCurrentBatch + 1} di ${totalAdsInCurrentBatch} completati...`);
        return Promise.resolve(ad); 
      }
      try {
        console.log(`Tool3: runAngleAnalysis - Chiamata ad analyzeAdAngleAction per ad ID: ${ad.id}`);
        const analysisResult = await analyzeAdAngleAction({
          adText: ad.testo,
          adTitle: ad.titolo,
        });
        
        console.log(`Tool3: runAngleAnalysis - Risultato da analyzeAdAngleAction per ad ID: ${ad.id}:`, analysisResult);
        setAdsProcessedInCurrentBatch(prev => prev + 1);
        setLoadingMessage(`Analisi angle: ${adsProcessedInCurrentBatch + 1} di ${totalAdsInCurrentBatch} completati...`);
        return { ...ad, angleAnalysis: analysisResult, analysisError: undefined };
      } catch (e: any) {
        console.error(`Tool3: runAngleAnalysis - Errore analisi angle per ad ID "${ad.id}":`, e);
        setAdsProcessedInCurrentBatch(prev => prev + 1);
        setLoadingMessage(`Analisi angle: ${adsProcessedInCurrentBatch + 1} di ${totalAdsInCurrentBatch} completati (con errori)...`);
        return { ...ad, angleAnalysis: undefined, analysisError: e.message || "Errore sconosciuto durante analisi AI con Gemini" };
      }
    });

    try {
      console.log("Tool3: runAngleAnalysis - In attesa di Promise.all per le analisi...");
      const results = await Promise.all(analysisPromises);
      console.log("Tool3: runAngleAnalysis - Risultati da Promise.all:", results);
      
      setAdsWithAnalysis(prevAdsWithAnalysis => {
        const updatedAdsMap = new Map(prevAdsWithAnalysis.map(ad => [ad.id, ad]));
        results.forEach(resultFromPromise => {
            if (resultFromPromise && updatedAdsMap.has(resultFromPromise.id)) {
                 updatedAdsMap.set(resultFromPromise.id, resultFromPromise);
            }
        });
        const finalUpdatedAds = Array.from(updatedAdsMap.values());
        console.log("Tool3: runAngleAnalysis - Nuovo stato adsWithAnalysis:", finalUpdatedAds);
        return finalUpdatedAds;
      });

      if (isAnalysisStoppedRef.current) {
        setLoadingMessage(`Analisi angle interrotta. ${adsProcessedInCurrentBatch} di ${totalAdsInCurrentBatch} annunci processati.`);
        toast({ title: "Analisi Angle Interrotta", description: `L'analisi 7C è stata interrotta. ${adsProcessedInCurrentBatch} annunci sono stati processati.` });
      } else {
        setLoadingMessage("Analisi angle completata!");
        toast({ title: "Analisi Angle Completata", description: `L'analisi 7C di ${totalAdsInCurrentBatch} annunci è terminata.` });
      }

    } catch (e: any) {
      console.error("Tool3: runAngleAnalysis - Errore durante Promise.all o aggiornamento stato:", e);
      setError(`Errore durante l'analisi degli angle (Gemini): ${e.message}`);
      toast({ title: "Errore Analisi Angle (Gemini)", description: e.message, variant: "destructive" });
    } finally {
      console.log("Tool3: runAngleAnalysis - Blocco finally eseguito.");
      setIsLoadingAnalysis(false);
      // isAnalysisStoppedRef.current = false; // Resettare qui o all'inizio della prossima run? Meglio all'inizio.
    }
  };
  
  const handleDownloadCSV = () => {
    const dataToDownload = adsWithAnalysis.length > 0 ? adsWithAnalysis : scrapedAds;
    if (dataToDownload.length === 0) {
      toast({ title: "Nessun dato", description: "Nessun risultato da scaricare.", variant: "destructive" });
      return;
    }
    const headers = [
      "Testo Ad", "Titolo Ad", "Link Ad", "Immagine Ad URL", 
      "7C_C1_Chiarezza", "7C_C2_Coinvolgimento", "7C_C3_Concretezza", "7C_C4_CoerenzaTarget", 
      "7C_C5_Credibilita", "7C_C6_CTA", "7C_C7_Contesto",
      "7C_PunteggioTotale", "7C_Valutazione", "7C_AnalisiApprofondita", "Errore Analisi"
    ];    const csvRows = dataToDownload.map(item => {
      // Controllo tipo sicuro per accedere alle proprietà di analisi
      const withAnalysis = item as AdWithAngleAnalysis;
      return {
        "Testo Ad": item.testo,
        "Titolo Ad": item.titolo,
        "Link Ad": item.link,
        "Immagine Ad URL": item.immagine,
        "7C_C1_Chiarezza": withAnalysis.angleAnalysis?.c1Clarity || "",
        "7C_C2_Coinvolgimento": withAnalysis.angleAnalysis?.c2Engagement || "",
        "7C_C3_Concretezza": withAnalysis.angleAnalysis?.c3Concreteness || "",
        "7C_C4_CoerenzaTarget": withAnalysis.angleAnalysis?.c4Coherence || "",
        "7C_C5_Credibilita": withAnalysis.angleAnalysis?.c5Credibility || "",
        "7C_C6_CTA": withAnalysis.angleAnalysis?.c6CallToAction || "",
        "7C_C7_Contesto": withAnalysis.angleAnalysis?.c7Context || "",
        "7C_PunteggioTotale": withAnalysis.angleAnalysis?.totalScore || "",
        "7C_Valutazione": withAnalysis.angleAnalysis?.evaluation || "",
        "7C_AnalisiApprofondita": withAnalysis.angleAnalysis?.detailedAnalysis || "",
        "Errore Analisi": withAnalysis.analysisError || (withAnalysis.angleAnalysis?.error || ""),
      };
    });
    exportToCSV("fb_ads_analysis_report.csv", headers, csvRows);
  };
  
  const openAngleAnalysisDetailPage = () => {
    const analyzedAds = adsWithAnalysis.filter(ad => ad.angleAnalysis || ad.analysisError);
    if (analyzedAds.length === 0 ) {
      toast({ title: "Dati Insufficienti", description: "Esegui prima lo scraping e l'analisi degli angle per almeno un annuncio.", variant: "destructive"});
      return;
    }
    localStorage.setItem('tool3AngleAnalysisData', JSON.stringify(analyzedAds));
    router.push('/tool3/angle-analysis');
  };

  const progressValue = isLoadingAnalysis 
    ? (totalAdsInCurrentBatch > 0 ? (adsProcessedInCurrentBatch / totalAdsInCurrentBatch) * 100 : 0)
    : (isLoadingScraping ? 25 : 0);


  return (
    <div className="space-y-8">
      <header className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--sky-600))' }}>Facebook Ads Library Scraper (via Apify)</h2>
        <p className="text-muted-foreground mt-2">Estrai dati dalla Facebook Ads Library e analizza gli angle di marketing con Gemini.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Configurazione Scraping & Analisi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="apifyTokenTool3" className="block text-sm font-medium text-foreground mb-1">Apify API Token</label>
            <Input type="password" id="apifyTokenTool3" value={apifyToken} onChange={(e) => setApifyToken(e.target.value)} placeholder="Il tuo token API Apify" />
          </div>
          <div>
            <label htmlFor="apifyActorIdTool3" className="block text-sm font-medium text-foreground mb-1">Apify Actor ID</label>
            <Input type="text" id="apifyActorIdTool3" value={apifyActorId} onChange={(e) => setApifyActorId(e.target.value)} />
          </div>
          <div>
            <label htmlFor="fbAdsUrlTool3" className="block text-sm font-medium text-foreground mb-1">URL Facebook Ads Library</label>
            <Input type="url" id="fbAdsUrlTool3" value={fbAdsUrl} onChange={(e) => setFbAdsUrl(e.target.value)} placeholder="Es: https://www.facebook.com/ads/library/?q=nomepagina..." />
          </div>
          <div>
            <label htmlFor="maxAdsToProcessTool3" className="block text-sm font-medium text-foreground mb-1">Numero Annunci da Recuperare (max 100)</label>
            <Input type="number" id="maxAdsToProcessTool3" value={maxAdsToProcess} onChange={(e) => setMaxAdsToProcess(Math.min(100, Math.max(1, parseInt(e.target.value))))} min="1" max="100" />
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <Button onClick={runScraping} disabled={isLoadingScraping || isLoadingAnalysis} className="action-button bg-sky-600 hover:bg-sky-700 text-white text-lg">
          {isLoadingScraping ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <SearchCode className="mr-2 h-5 w-5" />}
          {isLoadingScraping ? "Scraping..." : "Avvia Scraping"}
        </Button>
      </div>

      {(isLoadingScraping || isLoadingAnalysis) && (
        <div className="text-center my-6">
          <p className="text-sky-600 text-lg mb-1">{loadingMessage}</p>
          {isLoadingScraping && <p className="text-sm text-muted-foreground">{apifyStatus}</p>}
          <Progress value={progressValue} className="w-3/4 mx-auto mt-2" />
          {isLoadingAnalysis && (
            <Button onClick={handleStopAnalysis} variant="destructive" size="sm" className="mt-3">
                <StopCircle className="mr-2 h-4 w-4" /> Interrompi Analisi
            </Button>
          )}
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="my-4">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Errore</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
      )}
      
      {scrapedAds.length > 0 && !isLoadingScraping && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-2xl">Risultati Scraping Facebook Ads</CardTitle>
            <CardDescription>
              {scrapedAds.length} annunci recuperati. Seleziona quelli che vuoi analizzare. 
              Annunci selezionati: {selectedAdIds.size} / {scrapedAds.length}
            </CardDescription>
            <div className="flex space-x-2 mt-2">
                <Button onClick={handleSelectAllAds} size="sm" variant="outline" disabled={isLoadingAnalysis}>
                    <CheckSquare className="mr-2 h-4 w-4"/> Seleziona Tutti
                </Button>
                <Button onClick={handleDeselectAllAds} size="sm" variant="outline" disabled={isLoadingAnalysis || selectedAdIds.size === 0}>
                    <Square className="mr-2 h-4 w-4"/> Deseleziona Tutti
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TableScrapedAds 
                ads={scrapedAds} 
                selectedAdIds={selectedAdIds}
                onToggleAdSelection={handleToggleAdSelection}
            />
            <div className="text-center mt-8">
              <Button 
                onClick={runAngleAnalysis} 
                disabled={isLoadingAnalysis || selectedAdIds.size === 0} 
                className="action-button bg-purple-600 hover:bg-purple-700 text-white text-lg"
                title={selectedAdIds.size === 0 ? "Seleziona almeno un annuncio per l'analisi" : "Analizza angle degli annunci selezionati con Gemini"}
              >
                {isLoadingAnalysis ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Bot className="mr-2 h-5 w-5" />}
                {isLoadingAnalysis ? "Analisi Angle (Gemini)..." : `Analizza ${selectedAdIds.size} Annunci Selezionati (7C con Gemini)`} 
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {adsWithAnalysis.filter(ad => ad.angleAnalysis || ad.analysisError).length > 0 && !isLoadingAnalysis && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Risultati Analisi Angle (Metodo 7C con Gemini)</CardTitle>
              <CardDescription>
                Visualizzati i risultati per {adsWithAnalysis.filter(ad => ad.angleAnalysis || ad.analysisError).length} annunci.
              </CardDescription>
            </div>
            <Button variant="link" onClick={openAngleAnalysisDetailPage} className="detail-button">
                Visualizza Report Dettagliato <FileText className="ml-2 h-4 w-4"/>
            </Button>
          </CardHeader>
          <CardContent>
             <TableAngleAnalysis adsWithAnalysis={adsWithAnalysis.filter(ad => ad.angleAnalysis || ad.analysisError).slice(0,10)} /> 
             {adsWithAnalysis.filter(ad => ad.angleAnalysis || ad.analysisError).length > 10 && <p className="text-sm text-muted-foreground text-center mt-2">Mostrati i primi 10 risultati. Clicca su "Visualizza Report Dettagliato" per vederli tutti.</p>}
          </CardContent>
        </Card>
      )}

      {(scrapedAds.length > 0 || adsWithAnalysis.length > 0) && !isLoadingScraping && !isLoadingAnalysis && (
         <div className="text-center mt-6">
            <Button onClick={handleDownloadCSV} variant="outline">
              Scarica Risultati Completi (CSV) <Download className="ml-2 h-4 w-4" />
            </Button>
          </div>
      )}

    </div>
  );
}