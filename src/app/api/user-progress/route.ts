import { NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';
import { segmentChinese } from '@/lib/segmenter-server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Easy-to-tune configuration parameters for adaptive learning and auto-progression
const AUTO_PROGRESS_CONFIG = {
  // Number of times a word must be correctly recalled/encountered to graduate to "knownWords"
  WORD_MASTERY_THRESHOLD: 3,
  
  // Percentage of vocabulary known at the current HSK level to trigger automatic progression (80%)
  LEVEL_ADVANCEMENT_VOCAB_RATIO: 0.80,
  
  // Number of stories completed at the current level to trigger level advancement (3 stories)
  LEVEL_ADVANCEMENT_STORY_COUNT: 3,
};

// Helper to load parsed dictionary.json on demand
function loadDictionary() {
  const filePath = path.join(process.cwd(), 'data/dictionary.json');
  if (fs.existsSync(filePath)) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  }
  return {};
}

// Unified progression engine that assesses and updates both user known words and HSK levels
async function evaluateUserProgression(userId: string) {
  try {
    const docRef = db.collection('users').doc(userId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;

    const userData = docSnap.data();
    let knownWords: string[] = userData?.knownWords || [];
    let targetHskLevel = userData?.targetHskLevel || 3;
    
    let knownWordsChanged = false;
    let levelUpgraded = false;

    // 1. Fetch card statistics to check if any have graduated to the knownWords pool
    const flashcardsSnap = await docRef.collection('flashcards').get();
    const dictionary = loadDictionary();

    for (const cardDoc of flashcardsSnap.docs) {
      const cardData = cardDoc.data();
      const word = cardDoc.id;
      const repetition = cardData.repetition || 0;

      // Add to knownWords if mastery threshold is crossed and not yet there
      if (repetition >= AUTO_PROGRESS_CONFIG.WORD_MASTERY_THRESHOLD && !knownWords.includes(word)) {
        if (dictionary[word]) {
          knownWords.push(word);
          knownWordsChanged = true;
        }
      }
    }

    // Save updated knownWords list if changes occurred
    if (knownWordsChanged) {
      await docRef.set({ knownWords }, { merge: true });
    }

    // 2. Assess HSK Level advancement conditions
    const currentLearningLevel = targetHskLevel;

    if (currentLearningLevel < 7) {
      // Calculate total words in level
      let totalWordsAtLevel = 0;
      for (const [_, entry] of Object.entries(dictionary)) {
        if ((entry as any).h === currentLearningLevel) {
          totalWordsAtLevel++;
        }
      }

      // Calculate user's known words in level
      let knownWordsAtLevel = 0;
      for (const word of knownWords) {
        if (dictionary[word]?.h === currentLearningLevel) {
          knownWordsAtLevel++;
        }
      }

      // Count completed stories at current target level
      let completedStoriesCount = 0;
      const readStoriesSnap = await docRef.collection('readStories').get();
      for (const storyDocRef of readStoriesSnap.docs) {
        if (storyDocRef.data().completed) {
          const storyDoc = await db.collection('stories').doc(storyDocRef.id).get();
          if (storyDoc.exists && storyDoc.data()?.targetLevel === currentLearningLevel) {
            completedStoriesCount++;
          }
        }
      }

      const vocabRatio = totalWordsAtLevel > 0 ? (knownWordsAtLevel / totalWordsAtLevel) : 0;

      const qualifiesForLevelUp = 
        vocabRatio >= AUTO_PROGRESS_CONFIG.LEVEL_ADVANCEMENT_VOCAB_RATIO ||
        completedStoriesCount >= AUTO_PROGRESS_CONFIG.LEVEL_ADVANCEMENT_STORY_COUNT;

      if (qualifiesForLevelUp) {
        targetHskLevel = currentLearningLevel + 1;
        await docRef.set({ targetHskLevel }, { merge: true });
        levelUpgraded = true;
      }
    }

    return {
      knownWords,
      targetHskLevel,
      knownWordsChanged,
      levelUpgraded,
    };
  } catch (err) {
    console.error('Error in evaluateUserProgression:', err);
    return null;
  }
}

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
    let nickname: string | null = null;

    if (docSnap.exists) {
      const data = docSnap.data();
      knownWords = data?.knownWords || [];
      targetHskLevel = data?.targetHskLevel || 3;
      geminiApiKey = data?.geminiApiKey || null;
      nickname = data?.nickname || null;
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
      completed: doc.data().completed || false,
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
          completed: item.completed,
        });
      }
    }

    return NextResponse.json({
      knownWords,
      targetHskLevel,
      geminiApiKey,
      nickname,
      flashcardProgress,
      storyHistory,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/user-progress:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown GET Server Error',
      stack: error.stack,
      envCheck: {
        hasProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
        hasClientEmail: !!(process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL),
        hasPrivateKey: !!(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
      }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, action, word, level, key, interval, repetition, efactor, dueDate, storyId, nickname, backupData } = await request.json();

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
      return NextResponse.json({ success: true });
    } 
    else if (action === 'removeKnownWord') {
      if (!word) return NextResponse.json({ error: 'Missing word' }, { status: 400 });
      
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const knownWords: string[] = docSnap.data()?.knownWords || [];
        const updatedWords = knownWords.filter(w => w !== word);
        await docRef.set({ knownWords: updatedWords }, { merge: true });
      }
      return NextResponse.json({ success: true });
    } 
    else if (action === 'updateLevel') {
      if (level === undefined) return NextResponse.json({ error: 'Missing level' }, { status: 400 });
      await docRef.set({ targetHskLevel: level }, { merge: true });
      return NextResponse.json({ success: true });
    } 
    else if (action === 'updateApiKey') {
      await docRef.set({ geminiApiKey: key || null }, { merge: true });
      return NextResponse.json({ success: true });
    } 
    else if (action === 'updateNickname') {
      await docRef.set({ nickname: nickname || null }, { merge: true });
      return NextResponse.json({ success: true });
    }
    else if (action === 'resetFlashcards') {
      await db.recursiveDelete(docRef.collection('flashcards'));
      return NextResponse.json({ success: true });
    }
    else if (action === 'resetKnownWords') {
      if (level === undefined) return NextResponse.json({ error: 'Missing level' }, { status: 400 });
      const filePath = path.join(process.cwd(), 'data/dictionary.json');
      let resetWords: string[] = [];
      if (fs.existsSync(filePath)) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const dict = JSON.parse(rawData);
        
        for (const [w, entry] of Object.entries(dict)) {
          const hsk = (entry as any).h;
          if (hsk && hsk <= level) {
            resetWords.push(w);
          }
        }
      }
      const targetHskLevel = level < 7 ? level + 1 : 7;
      await docRef.set({ knownWords: resetWords, targetHskLevel }, { merge: true });
      return NextResponse.json({ success: true, count: resetWords.length, knownWords: resetWords, targetHskLevel });
    }
    else if (action === 'deleteAccount') {
      try {
        await adminAuth.deleteUser(userId);
      } catch (authErr: any) {
        console.warn('Auth user deletion skipped or failed:', authErr.message);
      }
      await db.recursiveDelete(docRef);
      return NextResponse.json({ success: true });
    }
    else if (action === 'importBackup') {
      if (!backupData) {
        return NextResponse.json({ error: 'Missing backupData' }, { status: 400 });
      }
      const { knownWords: bKnownWords = [], targetHskLevel: bTargetHskLevel = 3, flashcardProgress: bFlashcardProgress = {} } = backupData;

      // Update user base metrics
      await docRef.set({
        knownWords: bKnownWords,
        targetHskLevel: bTargetHskLevel
      }, { merge: true });

      // Clean existing flashcards
      await db.recursiveDelete(docRef.collection('flashcards'));

      // Recreate all imported flashcard records in a single batch
      const batch = db.batch();
      for (const [w, card] of Object.entries(bFlashcardProgress)) {
        const cardRef = docRef.collection('flashcards').doc(w);
        batch.set(cardRef, {
          word: w,
          interval: (card as any).interval || 1,
          repetition: (card as any).repetition || 0,
          efactor: (card as any).efactor || 2.5,
          dueDate: (card as any).dueDate || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await batch.commit();

      return NextResponse.json({ success: true });
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

      // Run automatic progression logic
      const progressionResult = await evaluateUserProgression(userId);

      return NextResponse.json({ success: true, progressionResult });
    } 
    else if (action === 'completeStory') {
      if (!storyId) return NextResponse.json({ error: 'Missing storyId' }, { status: 400 });
      
      const storyRef = docRef.collection('readStories').doc(storyId);
      await storyRef.set({
        completed: true,
        completedAt: new Date().toISOString()
      }, { merge: true });

      // Retrieve the completed story details to identify the newly introduced HSK words
      const storyDoc = await db.collection('stories').doc(storyId).get();
      if (storyDoc.exists) {
        const storyData = storyDoc.data();
        const newWords = storyData?.newWords || [];

        // Increment correct encounter count for introduced words
        for (const newWord of newWords) {
          const cardRef = docRef.collection('flashcards').doc(newWord);
          const cardSnap = await cardRef.get();
          
          let prevRep = 0;
          let prevEfactor = 2.5;
          let prevInterval = 1;

          if (cardSnap.exists) {
            const data = cardSnap.data();
            prevRep = data?.repetition || 0;
            prevEfactor = data?.efactor || 2.5;
            prevInterval = data?.interval || 1;
          }

          const rep = prevRep + 1;
          const intervalVal = Math.round(prevInterval * prevEfactor);
          const nextDueDate = new Date(Date.now() + intervalVal * 24 * 60 * 60 * 1000).toISOString();

          await cardRef.set({
            word: newWord,
            interval: intervalVal,
            repetition: rep,
            efactor: prevEfactor,
            dueDate: nextDueDate,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // Evaluate progression parameters
      const progressionResult = await evaluateUserProgression(userId);

      return NextResponse.json({ success: true, progressionResult });
    }
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in POST /api/user-progress:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown POST Server Error',
      stack: error.stack,
      envCheck: {
        hasProjectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
        hasClientEmail: !!(process.env.FIREBASE_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL),
        hasPrivateKey: !!(process.env.FIREBASE_PRIVATE_KEY || process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY),
      }
    }, { status: 500 });
  }
}