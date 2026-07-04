import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import { segmentChinese } from '@/lib/segmenter-server';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { userId, targetHskLevel } = await request.json();

    if (!userId || targetHskLevel === undefined) {
      return NextResponse.json({ error: 'Missing userId or targetHskLevel' }, { status: 400 });
    }

    const hskLevelParsed = parseInt(String(targetHskLevel), 10);
    if (isNaN(hskLevelParsed)) {
      return NextResponse.json({ error: 'Invalid targetHskLevel' }, { status: 400 });
    }

    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    const knownWords: string[] = userDoc.exists ? (userDoc.data()?.knownWords || []) : [];
    const knownWordsSet = new Set(knownWords);

    // Dynamic state to enforce stricter negative constraints in retries
    let forbiddenWordsUsed: string[] = [];
    let attempts = 0;
    const maxAttempts = 4; // 1 initial generation + up to 3 validation retries

    let storyData: any = null;
    let segmentedTokens: any[] = [];

    // System instruction calibrated with known-word boundaries
    const systemInstruction = `
      You are an expert Chinese language teacher. 
      Write a compelling short story (80-150 characters) in Simplified Chinese calibrated for a student studying HSK level ${hskLevelParsed}.
      
      Vocabulary rules:
      - The user already knows these words: [${knownWords.join(', ')}].
      - Write the story using MOSTLY the known words list and basic words from HSK levels BELOW level ${hskLevelParsed}.
      - You must introduce exactly 3 to 6 NEW words belonging to HSK level ${hskLevelParsed} that are NOT in the known words list.
      - Ensure the story reads naturally. Do not construct nonsensical text just to force vocabulary boundaries.
    `;

    while (attempts < maxAttempts) {
      attempts++;

      // Adjust prompt content based on validation feedback from prior runs
      const userPrompt = attempts === 1
        ? 'Please write a new story following the instructions.'
        : `Your previous response included out-of-level vocabulary words that are too advanced for the student. Please rewrite the story. Crucially, do NOT use any of these forbidden words: [${forbiddenWordsUsed.join(', ')}]. Make sure all characters used strictly align with HSK level ${hskLevelParsed} or below, or the known words list.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
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

      storyData = JSON.parse(outputText);
      const textToSegment = storyData.storyText || '';
      segmentedTokens = segmentChinese(textToSegment);

      // Validation Step: Scan all generated tokens
      const outOfLevelWordsFound: string[] = [];

      for (const token of segmentedTokens) {
        if (token.isWord) {
          // Identify unapproved words strictly above the target HSK level
          if (token.hsk && token.hsk > hskLevelParsed && !knownWordsSet.has(token.text)) {
            outOfLevelWordsFound.push(token.text);
          }
        }
      }

      const uniqueForbidden = Array.from(new Set(outOfLevelWordsFound));

      // Check against tolerance threshold (maximum of 2 unapproved out-of-level words allowed)
      if (uniqueForbidden.length <= 2) {
        break; // Validation check passed
      } else {
        // Collect identified words to append to the strict prompt on retry
        forbiddenWordsUsed = Array.from(new Set([...forbiddenWordsUsed, ...uniqueForbidden]));
        console.warn(`[Attempt ${attempts}/${maxAttempts}] Validation failed. ${uniqueForbidden.length} unapproved out-of-level words found: ${uniqueForbidden.join(', ')}. Retrying...`);
      }
    }

    if (!storyData || !storyData.storyText) {
      throw new Error('Failed to generate valid story text after maximum attempts.');
    }

    // Save story to Firestore
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