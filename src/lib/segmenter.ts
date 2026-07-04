const punctuation = new Set([
  "，", "。", "？", "！", "、", "；", "：", "“", "”", "（", "）", "《", "》", "—", "…", " "
]);

/**
 * Tokenizes Chinese text based on dictionary vocabulary.
 */
export function segmentText(text: string, vocabKeys: Iterable<string>): string[] {
  const dictSet = new Set<string>();
  
  // Load words from dictionary keys
  for (const key of vocabKeys) {
    dictSet.add(key);
  }
  
  // Load standard punctuation symbols
  punctuation.forEach(symbol => dictSet.add(symbol));

  const result: string[] = [];
  let i = 0;
  const len = text.length;
  const maxWordLen = 8; // Support compound words matching the dictionary size

  while (i < len) {
    let matched = false;
    for (let wLen = Math.min(maxWordLen, len - i); wLen > 1; wLen--) {
      const candidate = text.substring(i, i + wLen);
      if (dictSet.has(candidate)) {
        result.push(candidate);
        i += wLen;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(text[i]);
      i++;
    }
  }

  return result;
}

/**
 * Checks if a string contains purely Chinese characters.
 */
export function isChineseWord(word: string): boolean {
  return /^[\u4e00-\u9fa5]+$/.test(word);
}