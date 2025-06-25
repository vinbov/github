import { NextResponse } from 'next/server';
import { fetchKeywordData } from '@/lib/seo-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword) {
    return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
  }

  try {
    const keywordData = await fetchKeywordData(keyword);
    return NextResponse.json(keywordData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch keyword data' }, { status: 500 });
  }
}