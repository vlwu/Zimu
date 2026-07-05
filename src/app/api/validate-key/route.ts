import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const { geminiApiKey } = await request.json();
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    // Lightweight test call to validate the key
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say ok',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Gemini key validation failed:', error);
    return NextResponse.json({ 
      error: error.message || 'Invalid API Key. Please verify and try again.' 
    }, { status: 400 });
  }
}