import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import { segmentChinese } from '@/lib/segmenter-server';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { userId, targetHskLevel } = await request.json();

    if (!userId || !targetHskLevel) {
      return NextResponse.json({ error: 'Missing userId or targetHskLevel' }, { status: 400 });
    }

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    const knownWords: string[] = userDoc.exists ? (userDoc.data()?.knownWords || []) : [];

    const systemInstruction = `
      You are an expert Chinese language teacher. 
      Write a compelling short story (80-150 characters) in Simplified Chinese calibrated for a student studying HSK level ${targetHskLevel}.
      
      Vocabulary rules:
      - The user already knows these words: [${knownWords.join(', ')}].
      - Write the story using MOSTLY the known words list and basic words from HSK levels BELOW level ${targetHskLevel}.
      - You must introduce exactly 3 to 6 NEW words belonging to HSK level ${targetHskLevel} that are NOT in the known words list.
      - Ensure the story reads naturally. Do not construct nonsensical text just to force vocabulary boundaries.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Please write a new story following the instructions.',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            storyText: { type: Type.STRING, description: 'The story written in Simplified Chinese' },
            translation: { type: Type.STRING, description: 'Natural English translation of the story' },
            newWordsIntroduced: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The 3-6 new HSK vocabulary words introduced in the story'
            }
          },
          required: ['title', 'storyText', 'translation', 'newWordsIntroduced']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No content returned from the Gemini API.');
    }

    const storyData = JSON.parse(outputText);
    const segmentedTokens = segmentChinese(storyData.storyText);

    const savedStoryRef = await db.collection('users').doc(userId).collection('stories').add({
      title: storyData.title,
      text: storyData.storyText,
      translation: storyData.translation,
      newWordsIntroduced: storyData.newWordsIntroduced,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      storyId: savedStoryRef.id,
      title: storyData.title,
      translation: storyData.translation,
      tokens: segmentedTokens,
      newWords: storyData.newWordsIntroduced
    });

  } catch (error: any) {
    console.error('Error generating story:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}