import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import { segmentChinese } from '@/lib/segmenter-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const { userId, targetHskLevel, storyLength } = await request.json();

    if (!userId || targetHskLevel === undefined) {
      return NextResponse.json({ error: 'Missing userId or targetHskLevel' }, { status: 400 });
    }

    const hskLevelParsed = parseInt(String(targetHskLevel), 10);
    if (isNaN(hskLevelParsed)) {
      return NextResponse.json({ error: 'Invalid targetHskLevel' }, { status: 400 });
    }

    // 1. Fetch user API Key & verify early
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    let geminiApiKey = userData?.geminiApiKey;

    // Use environment variable as a system-wide fallback only in local development or production,
    // but strictly block it on Vercel Preview deployments to prevent quota drainage.
    if (!geminiApiKey && process.env.GEMINI_API_KEY) {
      const isVercelPreview = process.env.VERCEL_ENV === 'preview';
      if (!isVercelPreview) {
        geminiApiKey = process.env.GEMINI_API_KEY;
      }
    }

    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: 'Missing Gemini API Key. Please configure your API key to generate custom stories.',
        code: 'MISSING_API_KEY'
      }, { status: 400 });
    }

    const displayHskLevel = hskLevelParsed === 7 ? '7-9' : String(hskLevelParsed);

    // Calculate requested story length constraints based on selected ranges
    const chosenLength = storyLength || 'short';
    let lengthRange = '80-150';
    if (chosenLength === 'medium') {
      lengthRange = '150-250';
    } else if (chosenLength === 'long') {
      lengthRange = '250-400';
    }

    // 2. Retrieve the user's previously read story IDs
    const readStoriesSnap = await db.collection('users').doc(userId).collection('readStories').get();
    const readStoryIds = new Set(readStoriesSnap.docs.map(doc => doc.id));

    // 3. Query the global shared stories collection for stories matching the target HSK level
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

    // 4. Cache Hit: Instantly segment text and serve the cached story
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
        targetLevel: foundCachedStory.targetLevel,
        tokens: segmentedTokens,
        newWords: foundCachedStory.newWords || [],
        comprehensionQuestions: foundCachedStory.comprehensionQuestions || []
      });
    }

    // 5. Cache Miss: Pull knownWords and trigger Gemini generation pipeline
    const knownWords: string[] = userData?.knownWords || [];

    // System instruction calibrated with known-word boundaries and quizzes
    const systemInstruction = `
      # Role
      You are an expert Chinese language teacher and creative writer specializing in graded readers for HSK learners.

      # Task
      Write one compelling, coherent short story in Simplified Chinese, calibrated for a student at HSK level ${displayHskLevel}.

      # Variety & Creativity (strict)
      - Avoid generic, overused graded-reader tropes — especially "someone moves to a new house/city," "someone starts a new school," or "someone meets a friend at the park." If you notice yourself defaulting to one of these, choose something else.
      - Vary the protagonist's name, gender, age, and role each time (e.g. not always "Xiao Ming"). Draw from a wide range of everyday Chinese names, and occasionally feature animals, non-human narrators, or ensemble casts instead of a single student/child.
      - Vary the setting and situation: consider markets, kitchens, trains, hospitals, offices, farms, rainy nights, festivals, competitions, arguments, mysteries, mistakes, coincidences, small victories, or minor disasters — not just home/school/park.
      - Vary the emotional tone and genre within what the vocabulary allows: humor, suspense, mild conflict, curiosity, nostalgia, surprise, or gentle absurdity are all welcome, not just pleasant neutrality.
      - Favor a story with a specific, vivid problem, decision, or twist — even a small one — over a flat description of events. Give the story a reason to exist beyond demonstrating vocabulary.
      - Sensory and concrete detail (sounds, smells, weather, small physical actions) is encouraged wherever the vocabulary allows it, to make the scene feel alive rather than abstract.

      # Vocabulary Constraints (strict)
      - Known words: the student already knows these words: [${knownWords.join(', ')}].
      - Foundation: Construct the story primarily from the known words list plus basic/common words from HSK levels BELOW level ${hskLevelParsed}.
      - New words: Introduce exactly 3 to 6 NEW words that:
        1. Belong specifically to HSK level ${displayHskLevel}.
        2. Do NOT appear in the known words list.
        3. Are essential to the story rather than arbitrarily inserted (use them because they naturally fit, not just to hit the quota).
      - Do not use any vocabulary from HSK levels ABOVE ${hskLevelParsed}.

      # Comprehension Questions (strict)
      Generate exactly 3 multiple-choice comprehension questions based on the story.
      Each question must contain:
      1. "question": A clear question in Simplified Chinese appropriate for this level.
      2. "options": Exactly 4 Chinese text options.
      3. "answerIndex": The 0-based index of the correct answer (0, 1, 2, or 3).
      4. "explanation": A brief, helpful explanation in English of why the selected answer is correct.

      # Quality Bar
      - The story must read naturally and coherently, as if written for native graded-reader materials — never force or twist the plot just to satisfy a vocabulary boundary.
      - Prefer simple, clear sentence structures appropriate for HSK ${displayHskLevel} grammar patterns.
      - The story should have a clear beginning, middle, and end (or a clear narrative arc) despite its short length.
      - Avoid proper nouns, idioms, or cultural references that would require vocabulary outside the allowed set.

      # Length
      - Total length: ${lengthRange} Chinese characters (this length is an estimate, count characters, not words; punctuation does not count toward this total).

      # Output Format
      - Return ONLY the requested JSON format matching the schema.
    `;
    
    const userPrompt = 'Please write a new story following the instructions.';

    // Initialize the Gemini client per-user inside the generation block
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    let response;
    try {
      response = await ai.models.generateContent({
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
              },
              comprehensionQuestions: {
                type: Type.ARRAY,
                description: 'Exactly 3 multiple-choice comprehension questions about the story',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: 'The question in Simplified Chinese' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Exactly 4 option choices'
                    },
                    answerIndex: { type: Type.INTEGER, description: '0-based index of the correct option' },
                    explanation: { type: Type.STRING, description: 'English explanation of the correct answer' }
                  },
                  required: ['question', 'options', 'answerIndex', 'explanation']
                }
              }
            },
            required: ['title', 'storyText', 'translation', 'newWordsIntroduced', 'comprehensionQuestions']
          }
        }
      });
    } catch (apiError: any) {
      console.error('Gemini API call failed:', apiError);
      throw apiError;
    }

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No content returned from the Gemini API.');
    }

    const storyData = JSON.parse(outputText);
    const textToSegment = storyData.storyText || '';
    const segmentedTokens = segmentChinese(textToSegment);

    // Save story to the global shared collection
    const newStoryRef = await db.collection('stories').add({
      title: storyData.title,
      text: storyData.storyText,
      translation: storyData.translation,
      targetLevel: hskLevelParsed,
      newWords: storyData.newWordsIntroduced,
      comprehensionQuestions: storyData.comprehensionQuestions || [],
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
      targetLevel: hskLevelParsed,
      tokens: segmentedTokens,
      newWords: storyData.newWordsIntroduced,
      comprehensionQuestions: storyData.comprehensionQuestions || []
    });

  } catch (error: any) {
    console.error('Error in /api/story:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}