import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { segmentChinese } from '@/lib/segmenter-server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch user profile doc
    const docRef = db.collection('users').doc(userId);
    const docSnap = await docRef.get();

    let knownWords: string[] = [];
    let targetHskLevel = 3;
    let geminiApiKey: string | null = null;

    if (docSnap.exists) {
      const data = docSnap.data();
      knownWords = data?.knownWords || [];
      targetHskLevel = data?.targetHskLevel || 3;
      geminiApiKey = data?.geminiApiKey || null;
    }

    // Fetch flashcard progress
    const flashcardProgress: Record<string, any> = {};
    const flashcardsSnap = await docRef.collection('flashcards').get();
    flashcardsSnap.forEach((doc) => {
      flashcardProgress[doc.id] = doc.data();
    });

    // Fetch read stories history
    const readStoriesSnap = await docRef.collection('readStories').get();
    const readStoryItems = readStoriesSnap.docs.map(doc => ({
      storyId: doc.id,
      readAt: doc.data().readAt || '',
    }));

    // Sort readStoryItems by readAt descending
    readStoryItems.sort((a, b) => b.readAt.localeCompare(a.readAt));

    const storyHistory: any[] = [];
    const recentReadItems = readStoryItems.slice(0, 50);

    for (const item of recentReadItems) {
      const storyDoc = await db.collection('stories').doc(item.storyId).get();
      if (storyDoc.exists) {
        const sData = storyDoc.data();
        const text = sData?.text || '';
        const tokens = sData?.tokens || segmentChinese(text);
        storyHistory.push({
          storyId: item.storyId,
          title: sData?.title || 'Untitled Story',
          translation: sData?.translation || '',
          targetLevel: sData?.targetLevel || targetHskLevel,
          tokens: tokens,
          newWords: sData?.newWords || [],
          comprehensionQuestions: sData?.comprehensionQuestions || [],
        });
      }
    }

    return NextResponse.json({
      knownWords,
      targetHskLevel,
      geminiApiKey,
      flashcardProgress,
      storyHistory,
    });

  } catch (error: any) {
    console.error('Error in GET /api/user-progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, action, word, level, key, interval, repetition, efactor, dueDate } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(userId);

    if (action === 'addKnownWord') {
      if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 });
      
      const docSnap = await docRef.get();
      let knownWords: string[] = [];
      if (docSnap.exists) {
        knownWords = docSnap.data()?.knownWords || [];
      }
      if (!knownWords.includes(word)) {
        knownWords.push(word);
        await docRef.set({ knownWords }, { merge: true });
      }
    } 
    else if (action === 'removeKnownWord') {
      if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 });
      
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const knownWords: string[] = docSnap.data()?.knownWords || [];
        const updatedWords = knownWords.filter(w => w !== word);
        await docRef.set({ knownWords: updatedWords }, { merge: true });
      }
    } 
    else if (action === 'updateLevel') {
      if (level === undefined) return NextResponse.json({ error: 'Missing level' }, { status: 400 });
      await docRef.set({ targetHskLevel: level }, { merge: true });
    } 
    else if (action === 'updateApiKey') {
      await docRef.set({ geminiApiKey: key || null }, { merge: true });
    } 
    else if (action === 'saveFlashcard') {
      if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 });
      const cardRef = docRef.collection('flashcards').doc(word);
      await cardRef.set({
        word,
        interval,
        repetition,
        efactor,
        dueDate,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } 
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in POST /api/user-progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}