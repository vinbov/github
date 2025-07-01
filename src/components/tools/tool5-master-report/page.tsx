"use client";

import { Tool5MasterReport } from '@/components/tools/tool5-master-report/tool5-master-report';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Tool5MasterReportPage() {
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [landingPageScreenshot, setLandingPageScreenshot] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Opzionale: servizio per catturare screenshot automaticamente
      // const screenshot = await captureScreenshot(landingPageUrl);
      // setLandingPageScreenshot(screenshot);
      
      setShowAnalysis(true);
    } catch (error) {
      console.error('Errore nel processare la landing page:', error);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLandingPageScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Analisi Landing Page</h1>
      
      {!showAnalysis ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="landingPageUrl">URL della Landing Page</Label>
            <Input
              id="landingPageUrl"
              placeholder="https://esempio.com/landing-page"
              value={landingPageUrl}
              onChange={(e) => setLandingPageUrl(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot della Landing Page (opzionale)</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
            />
            <p className="text-sm text-gray-500">
              Uno screenshot aiuta l'AI a fornire un'analisi visiva più accurata
            </p>
          </div>
          
          <Button type="submit">Analizza Landing Page</Button>
        </form>
      ) : (
        <>
          <Button 
            variant="outline" 
            onClick={() => setShowAnalysis(false)} 
            className="mb-4"
          >
            Analizza un'altra landing page
          </Button>
          
          <Tool5MasterReport
            landingPageUrl={landingPageUrl}
            landingPageScreenshot={landingPageScreenshot}
          />
        </>
      )}
    </div>
  );
}