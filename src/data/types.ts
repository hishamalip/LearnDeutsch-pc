export type Gender = 'der' | 'die' | 'das';

export type Category = 
  | 'all'
  | 'nouns'
  | 'verbs'
  | 'adjectives'
  | 'numbers'
  | 'time_calendar'
  | 'phrases_idioms';

export interface A1Item {
  id: string;
  german: string;
  english: string;
  category: string;
  fullQuestion: string;
  fullAnswer: string;
  gender?: Gender;
  nounClean?: string;
  plural?: string;
  ruleTip?: string;
  sentenceDe?: string;
  sentenceEn?: string;
}

export interface A1Noun {
  id: string;
  itemId: string;
  noun: string;
  article: Gender;
  plural: string;
  english: string;
  ruleTip: string;
  exampleDe?: string;
  exampleEn?: string;
}

export interface SentenceExercise {
  id: string;
  german: string;
  english: string;
  words: string[];
  rule: string;
  ruleDesc: string;
  sourceWord: string;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ActiveTool = 'articles' | 'vocab' | 'sentences' | 'dictionary' | 'stats';
