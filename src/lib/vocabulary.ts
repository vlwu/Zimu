import fs from 'fs';
import path from 'path';

export interface DictEntry {
  hanzi: string;
  level: number;
}

// Global server-side cache to prevent repetitive disk I/O on every API call
let cachedVocabMap: Map<string, DictEntry> | null = null;

/**
 * Loads vocabulary from dictionary.json, or falls back to parsing hsk.csv.
 */
export function loadVocabulary(): Map<string, DictEntry> {
  if (cachedVocabMap) {
    return cachedVocabMap;
  }

  const vocabMap = new Map<string, DictEntry>();

  try {
    // 1. Try to load from the compiled dictionary.json file
    const jsonPath = path.join(process.cwd(), 'data', 'dictionary.json');
    if (fs.existsSync(jsonPath)) {
      const jsonStr = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(jsonStr);

      if (Array.isArray(data)) {
        // Format: Array of objects [{ hanzi: "我", level: 1 }]
        for (const item of data) {
          const hanzi = item.hanzi || item.Hanzi;
          const levelStr = item.level ?? item.Level ?? item.l;
          if (hanzi) {
            vocabMap.set(hanzi, {
              hanzi,
              level: Number(levelStr) || 1,
            });
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        // Format: Map of Hanzi keys {"我": { "level": 1 }} or {"我": [1, "wǒ"]}
        for (const [hanzi, val] of Object.entries(data)) {
          let level = 1;
          if (val && typeof val === 'object') {
            if (Array.isArray(val)) {
              level = Number(val[0]) || 1;
            } else {
              const rawLevel = (val as any).level ?? (val as any).Level ?? (val as any).l ?? (val as any).level_3_0;
              level = Number(rawLevel) || 1;
            }
          } else if (typeof val === 'number') {
            level = val;
          }
          vocabMap.set(hanzi, { hanzi, level });
        }
      }
    }
  } catch (err) {
    console.warn('Unable to load dictionary.json. Falling back to hsk.csv:', err);
  }

  // 2. CSV Fallback parsing if JSON load is empty or fails
  if (vocabMap.size === 0) {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'hsk.csv');
      if (fs.existsSync(csvPath)) {
        const csvStr = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvStr.split(/\r?\n/);
        
        // Skip header: Hanzi,Level,WritingLevel,Traditional,Freq,Examples
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',');
          if (parts.length >= 2) {
            const hanzi = parts[0].trim();
            const levelStr = parts[1].trim();
            const level = Number(levelStr) || 1;
            if (hanzi && hanzi !== 'Hanzi') {
              vocabMap.set(hanzi, { hanzi, level });
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to parse fallback hsk.csv:', err);
    }
  }

  cachedVocabMap = vocabMap;
  return vocabMap;
}