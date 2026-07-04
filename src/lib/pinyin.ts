export function convertTonality(pinyinStr: string): string {
  if (!pinyinStr) return '';

  const toneMap: Record<string, string[]> = {
    a: ['a', 'ā', 'á', 'ǎ', 'à', 'a'],
    e: ['e', 'ē', 'é', 'ě', 'è', 'e'],
    i: ['i', 'ī', 'í', 'ǐ', 'ì', 'i'],
    o: ['o', 'ō', 'ó', 'ǒ', 'ò', 'o'],
    u: ['u', 'ū', 'ú', 'ǔ', 'ù', 'u'],
    ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  };

  return pinyinStr.split(' ').map(syllable => {
    // Standardize 'u:' or 'v' to 'ü'
    let s = syllable.replace(/u:/g, 'ü').replace(/U:/g, 'Ü').replace(/v/g, 'ü').replace(/V/g, 'Ü');
    
    // Extract base pinyin and tone number
    const match = s.match(/^([a-zA-ZüÜ]+)([1-5])$/);
    if (!match) return s.replace(/[1-5]/g, ''); // Fallback: just strip numbers if weird format
    
    const text = match[1];
    const tone = parseInt(match[2], 10);
    
    // Tone 5 is neutral (no mark)
    if (tone === 5) return text;
    
    let targetVowel = '';
    const lowerText = text.toLowerCase();
    
    // Pinyin tone mark placement rules priority
    if (lowerText.includes('a')) targetVowel = 'a';
    else if (lowerText.includes('e')) targetVowel = 'e';
    else if (lowerText.includes('o')) targetVowel = 'o';
    else if (lowerText.includes('iu')) targetVowel = 'u';
    else if (lowerText.includes('ui')) targetVowel = 'i';
    else {
      // Find the first vowel (since 'a', 'e', 'o' are absent, it's just 'i', 'u', or 'ü')
      const vowels = lowerText.match(/[iuü]/g);
      if (vowels) {
        targetVowel = vowels[0];
      }
    }
    
    if (targetVowel) {
      // Replace the target vowel with its toned counterpart, matching original casing
      for (let i = 0; i < text.length; i++) {
        if (text[i].toLowerCase() === targetVowel) {
          const isUpper = text[i] === text[i].toUpperCase();
          let tonedVowel = toneMap[targetVowel][tone];
          if (isUpper) tonedVowel = tonedVowel.toUpperCase();
          return text.substring(0, i) + tonedVowel + text.substring(i + 1);
        }
      }
    }
    
    return text;
  }).join(' ');
}