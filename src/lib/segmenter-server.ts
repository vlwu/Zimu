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
      throw new Error(`Compiled dictionary not found at "${filePath}". Please run "node scripts/compile-data.js" first.`);
    }
    const rawData = fs.readFileSync(filePath, 'utf8');
    cachedDict = JSON.parse(rawData);
  }
  return cachedDict!;
}

export function segmentChinese(text: string): Token[] {
  const dict = getDictionary();
  const tokens: Token[] = [];
  let i = 0;
  const maxWordLength = 8;

  while (i < text.length) {
    const char = text[i];

    if (/[\s\p{P}\p{S}\p{N}a-zA-Z]/u.test(char)) {
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