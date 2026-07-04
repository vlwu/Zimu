export interface Token {
  text: string;
  pinyin?: string;
  definition?: string;
  hsk?: number | null;
  isWord: boolean;
}

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface StoryData {
  storyId: string;
  title: string;
  translation: string;
  targetLevel?: number;
  tokens: Token[];
  newWords: string[];
  comprehensionQuestions?: ComprehensionQuestion[];
}