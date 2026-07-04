export interface Token {
  text: string;
  pinyin?: string;
  definition?: string;
  hsk?: number | null;
  isWord: boolean;
}