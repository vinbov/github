import { NextRequest } from 'next/server';
import { scrapeAndAnalyze } from '../../actions/test-scrape-actions';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    // Chiamiamo la Server Action dal server
    const result = await scrapeAndAnalyze(url);
    
    return Response.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
