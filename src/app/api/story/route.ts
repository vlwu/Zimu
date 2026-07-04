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

    // 1. Retrieve the user's previously read story IDs
    const readStoriesSnap = await db.collection('users').doc(userId).collection('readStories').get();
    const readStoryIds = new Set(readStoriesSnap.docs.map(doc => doc.id));

    // 2. Query the global shared stories collection for stories matching the target HSK level
    const cachedStoriesSnap = await db.collection('stories')
      .where('targetLevel', '==', hskLevelParsed)
      .get();

    let foundCachedStory = null;
    let cachedStoryId = '';

    for (const doc of cachedStoriesSnap.docs) {
      if (!readStoryIds.has(doc.id)) {
        foundCachedStory = doc.data();
        cachedStoryId = doc.id;
        break;
      }
    }

    // 3. Cache Hit: Instantly segment text and serve the cached story
    if (foundCachedStory) {
      const textToSegment = foundCachedStory.text || '';
      const segmentedTokens = segmentChinese(textToSegment);

      // Record this story in the user's readStories history
      await db.collection('users').doc(userId).collection('readStories').doc(cachedStoryId).set({
        readAt: new Date().toISOString()
      });

      return NextResponse.json({
        storyId: cachedStoryId,
        title: foundCachedStory.title,
        translation: foundCachedStory.translation,
        tokens: segmentedTokens,
        newWords: foundCachedStory.newWords || []
      });
    }

    // 4. Cache Miss: Pull knownWords and trigger Gemini generation pipeline
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
      # Role
      You are an expert Chinese language teacher specializing in graded readers for HSK learners.

      # Task
      Write one compelling, coherent short story in Simplified Chinese, calibrated for a student at HSK level ${hskLevelParsed}.

      # Vocabulary Constraints (strict)
      - Known words: the student already knows these words: [${knownWords.join(', ')}].
      - Foundation: Construct the story primarily from the known words list plus basic/common words from HSK levels BELOW level ${hskLevelParsed}.
      - New words: Introduce exactly 3 to 6 NEW words that:
        1. Belong specifically to HSK level ${hskLevelParsed}.
        2. Do NOT appear in the known words list.
        3. Are essential to the story rather than arbitrarily inserted (use them because they naturally fit, not just to hit the quota).
      - Do not use any vocabulary from HSK levels ABOVE ${hskLevelParsed}.

      # Quality Bar
      - The story must read naturally and coherently, as if written for native graded-reader materials — never force or twist the plot just to satisfy a vocabulary boundary.
      - Prefer simple, clear sentence structures appropriate for HSK ${hskLevelParsed} grammar patterns.
      - The story should have a clear beginning, middle, and end (or a clear narrative arc) despite its short length.
      - Avoid proper nouns, idioms, or cultural references that would require vocabulary outside the allowed set.

      # Length
      - Total length: 80-150 Chinese characters (count characters, not words; punctuation does not count toward this total).

      # Output Format
      - Return ONLY the story text in Simplified Chinese.
      - Do not include pinyin, translations, titles, explanations, or any commentary before or after the story.
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

    // Save story to the global shared collection
    const newStoryRef = await db.collection('stories').add({
      title: storyData.title,
      text: storyData.storyText,
      translation: storyData.translation,
      targetLevel: hskLevelParsed,
      newWords: storyData.newWordsIntroduced,
      createdAt: new Date().toISOString()
    });
    const newStoryId = newStoryRef.id;

    // Record this newly generated story in the user's read history
    await db.collection('users').doc(userId).collection('readStories').doc(newStoryId).set({
      readAt: new Date().toISOString()
    });

    return NextResponse.json({
      storyId: newStoryId,
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