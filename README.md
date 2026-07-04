# Zimu (字幕)

**Learn Chinese by reading, not memorizing.**

Zimu generates short stories calibrated to your exact HSK vocabulary level, so new words are learned in context instead of on flashcards. Every story is built from words you already know, plus a small number of new ones at the edge of your ability — the way comprehensible-input research suggests language actually sticks.

The name comes from 字幕 (zìmù), "subtitles" — text that carries meaning alongside it.

## Why

Most Chinese apps drill vocabulary in isolation. Zimu instead:

- Tracks the words you actually know, not just "HSK level 3"
- Generates stories that use mostly known vocabulary, with a handful of new words introduced naturally
- Lets you tap any word for a definition and pinyin, without leaving the story
- Grows your known-word list as you read, which shapes what the next story looks like

No decks. No streaks. Just reading that gets a little harder, one story at a time.

## Data sources

- **CC-CEDICT** — Chinese-English dictionary data, used for word lookups and definitions. Licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Source: [mdbg.net/chinese/dictionary?page=cedict](https://www.mdbg.net/chinese/dictionary?page=cedict)
- **HSK 3.0 vocabulary lists** — used to define level boundaries and validate generated stories against a target vocabulary.

Attribution for CC-CEDICT is required by its license and will be included in the app itself once there's a UI to include it in.

## How it works (planned pipeline)

1. Pull the user's known-word list plus the target HSK level
2. Prompt Gemini to write a short story using mostly known words, introducing a handful of new ones
3. Segment the returned text (via `jieba`) and validate every word against the allowed vocabulary
4. Regenerate if validation fails; otherwise save the story
5. User reads, taps unfamiliar words, marks new vocabulary as known
6. Known-word list updates, shaping the next story

## Roadmap

- [x] Project setup (accounts, data sources)
- [x] Firebase project scaffolding
- [x] HSK word list + CC-CEDICT parsing
- [x] Story generation + vocabulary validator
- [x] Reading UI (pinyin toggle, tap-to-define)
- [x] Known-word tracking
- [x] Comprehension checks
- [x] Multi-user support (accounts, story caching, cost controls)

## Getting started

Setup instructions will go here once the app is scaffolded.

## License

Project code license: TBD.
CC-CEDICT data is used under CC BY-SA 4.0 with attribution.
