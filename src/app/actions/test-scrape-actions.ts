"use server";

// Test semplice per verificare che le Server Actions funzionino
export async function testFunction() {
  return { success: true, message: "Test function works!" };
}

export async function scrapeAndAnalyze(url: string) {
  try {
    console.log('scrapeAndAnalyze called with URL:', url);
    
    // Test semplice senza puppeteer prima
    if (!url || typeof url !== 'string') {
      throw new Error('URL non valido');
    }

    // Simuliamo una risposta per ora
    const mockData = {
      title: "Test Page",
      description: "Test description",
      headings: {
        h1: ["Test H1"],
        h2: ["Test H2"],
        h3: []
      },
      links: [],
      images: [],
      text: "Test content"
    };

    console.log('scrapeAndAnalyze returning data:', mockData);

    return {
      success: true,
      analysis: mockData
    };

  } catch (error: any) {
    console.error('Error in scrapeAndAnalyze:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze the page'
    };
  }
}
