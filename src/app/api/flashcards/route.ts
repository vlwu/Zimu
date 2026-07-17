import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { userId, targetHskLevel, knownWords = [], trackedWords = [], limit = 15 } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. Load dictionary.json (with fallback if missing on Vercel)
    const filePath = path.join(process.cwd(), 'data/dictionary.json');
    let dictionary: Record<string, any> = {};
    
    if (fs.existsSync(filePath)) {
      try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        dictionary = JSON.parse(rawData);
      } catch (err) {
        console.error('Failed to parse dictionary.json:', err);
      }
    } else {
      console.warn(`⚠️ Warning: Compiled dictionary not found at "${filePath}". Running in offline mode.`);
    }

    // 2. Combine knownWords and words up to targetHskLevel
    const eligibleWords = new Set<string>();

    // Add known words to the pool (always add, even if dictionary is offline)
    for (const word of knownWords) {
      eligibleWords.add(word);
    }

    // Add dictionary words up to targetHskLevel
    const maxLevel = targetHskLevel || 3;
    for (const [word, entry] of Object.entries(dictionary)) {
      const hsk = (entry as any).h;
      if (hsk && hsk <= maxLevel) {
        eligibleWords.add(word);
      }
    }

    // Create a mapping of trackedWords for fast lookup
    const trackedMap = new Map<string, any>();
    for (const item of trackedWords) {
      trackedMap.set(item.word, item);
    }

    // 3. Separate eligible pool into Due and New
    const now = new Date();
    const dueCards: any[] = [];
    const newCards: string[] = [];

    for (const word of eligibleWords) {
      const tracking = trackedMap.get(word);
      if (tracking) {
        const dueDate = new Date(tracking.dueDate);
        if (dueDate <= now) {
          dueCards.push({
            word,
            ...tracking,
            dueDateParsed: dueDate,
          });
        }
      } else {
        newCards.push(word);
      }
    }

    // Sort due cards by dueDate ascending (oldest/most overdue first)
    dueCards.sort((a, b) => a.dueDateParsed.getTime() - b.dueDateParsed.getTime());

    // 4. Draw up to `limit` cards, prioritizing due ones
    const selectedCardsList: any[] = [];

    // Add due cards
    for (const card of dueCards) {
      if (selectedCardsList.length >= limit) break;
      const dictEntry = dictionary[card.word] || {};
      selectedCardsList.push({
        word: card.word,
        traditional: dictEntry.t || card.word,
        pinyin: dictEntry.p || '',
        definition: dictEntry.d || 'Definition not found (dictionary offline)',
        hsk: dictEntry.h || null,
        progress: {
          interval: card.interval,
          repetition: card.repetition,
          efactor: card.efactor,
          dueDate: card.dueDate,
        },
      });
    }

    // If need more cards, draw from new cards
    if (selectedCardsList.length < limit && newCards.length > 0) {
      // Shuffle new cards to get a random selection
      const shuffledNew = [...newCards].sort(() => 0.5 - Math.random());
      for (const word of shuffledNew) {
        if (selectedCardsList.length >= limit) break;
        const dictEntry = dictionary[word] || {};
        selectedCardsList.push({
          word,
          traditional: dictEntry.t || word,
          pinyin: dictEntry.p || '',
          definition: dictEntry.d || 'Definition not found (dictionary offline)',
          hsk: dictEntry.h || null,
          progress: null, // Indicates a new card
        });
      }
    }

    return NextResponse.json({ cards: selectedCardsList });

  } catch (error: any) {
    console.error('Error in /api/flashcards:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}