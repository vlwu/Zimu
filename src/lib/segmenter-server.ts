import fs from 'fs';
import path from 'path';
import { Token } from './types';

interface DictionaryEntry {
  t?: string; // Traditional
  p: string;  // Pinyin
  d: string;  // Definition
  h: number | null; // HSK Level
}

let cachedDict: Record<string, DictionaryEntry> | null = null;

function getDictionary(): Record<string, DictionaryEntry> {
  if (!cachedDict) {
    const filePath = path.join(process.cwd(), 'data/dictionary.json');
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: Compiled dictionary not found at "${filePath}". Running in fallback character-segmentation mode.`);
      cachedDict = {};
    } else {
      try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        cachedDict = JSON.parse(rawData);
      } catch (err) {
        console.error("⚠️ Failed to parse dictionary.json:", err);
        cachedDict = {};
      }
    }
  }
  return cachedDict!;
}

export function segmentChinese(text: string | null | undefined): Token[] {
  if (!text) {
    return [];
  }

  const dict = getDictionary();
  const tokens: Token[] = [];
  let i = 0;
  const maxWordLength = 8;

  while (i < text.length) {
    const char = text[i];

    // Safe Chinese character boundary check matching both local and Vercel environments
    if (!/[\u4e00-\u9fa5]/u.test(char)) {
      tokens.push({ text: char, isWord: false });
      i++;
      continue;
    }

    let matched = false;
    
    for (let len = Math.min(maxWordLength, text.length - i); len > 0; len--) {
      const candidate = text.substring(i, i + len);
      
      if (dict[candidate]) {
        const entry = dict[candidate];
        tokens.push({
          text: candidate,
          pinyin: entry.p,
          definition: entry.d,
          hsk: entry.h,
          isWord: true
        });
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      tokens.push({
        text: char,
        isWord: true,
        hsk: null
      });
      i++;
    }
  }

  return tokens;
}