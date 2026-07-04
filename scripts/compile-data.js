const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CEDICT_PATH = path.join(__dirname, '../data/cc-cedict.u8');
const HSK_PATH = path.join(__dirname, '../data/hsk3.csv'); // Adjust filename if different
const OUTPUT_PATH = path.join(__dirname, '../data/dictionary.json'); // Outside of /src to bypass the bundler!

async function parseHSK() {
  const hskMap = new Map();
  if (!fs.existsSync(HSK_PATH)) {
    console.warn("⚠️ HSK CSV not found. Skipping HSK boundaries.");
    return hskMap;
  }

  const fileStream = fs.createReadStream(HSK_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  let hanziIndex = -1;
  let levelIndex = -1;

  for await (const line of rl) {
    if (!line.trim()) continue;

    const parts = line.split(',');

    if (isHeader) {
      const headers = parts.map(h => h.trim());
      hanziIndex = headers.indexOf('Hanzi');
      levelIndex = headers.indexOf('Level');

      if (hanziIndex === -1 || levelIndex === -1) {
        console.warn("⚠️ Could not find expected 'Hanzi' or 'Level' headers. Defaulting to columns 0 and 1.");
        hanziIndex = 0;
        levelIndex = 1;
      }
      isHeader = false;
      continue;
    }

    if (parts.length > Math.max(hanziIndex, levelIndex)) {
      const word = parts[hanziIndex]?.trim();
      const levelRaw = parts[levelIndex]?.trim();
      const levelParsed = parseInt(levelRaw?.replace(/\D/g, '') || '', 10);

      if (word && !isNaN(levelParsed)) {
        hskMap.set(word, levelParsed);
      }
    }
  }
  console.log(`Parsed ${hskMap.size} HSK vocabulary entries.`);
  return hskMap;
}

async function parseCedictAndCompile() {
  const hskMap = await parseHSK();
  const dictionary = {};

  if (!fs.existsSync(CEDICT_PATH)) {
    console.error("❌ CC-CEDICT .u8 file not found at data/cc-cedict.u8");
    return;
  }

  const fileStream = fs.createReadStream(CEDICT_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const lineRegex = /^([^\s]+) ([^\s]+) \[(.+?)\] \/(.+)\/$/;

  for await (const line of rl) {
    if (line.startsWith('#') || !line.trim()) continue;

    const match = line.match(lineRegex);
    if (match) {
      const [_, traditional, simplified, pinyin, definitionsStr] = match;
      const definitions = definitionsStr.split('/').filter(d => d.trim().length > 0);
      const hskLevel = hskMap.get(simplified) || null;

      dictionary[simplified] = {
        t: traditional !== simplified ? traditional : undefined,
        p: pinyin,
        d: definitions.slice(0, 3).join('; '),
        h: hskLevel
      };
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dictionary));
  console.log(`✅ Success! Compiled dictionary to ${OUTPUT_PATH}`);
}

parseCedictAndCompile();