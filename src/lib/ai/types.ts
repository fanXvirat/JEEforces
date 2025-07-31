// src/lib/ai/types.ts
export interface Topic {
    name: string;
    subject: string;
}

export enum CardType {
    CONCEPT = 'CONCEPT',
    PROBLEM = 'PROBLEM',
    FLASHCARD = 'FLASHCARD',
    MEME = 'MEME',
    MNEMONIC = 'MNEMONIC',
    TRUE_OR_FALSE = 'TRUE_OR_FALSE',
    SEQUENCE_SORT = 'SEQUENCE_SORT',
    FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
    QUIZ = 'QUIZ',
}

export interface ConceptContent {
    title: string;
    explanation: string;
    analogy: string;
}

export interface ProblemContent {
    problemStatement: string;
    hint: string;
    solution: string;
}

export interface FlashcardContent {
    question: string;
    answer: string;
}

export interface MemeContent {
    title: string;
    description: string;
    imageUrl?: string;
}

export interface MnemonicContent {
    concept: string;
    mnemonic: string;
}

export interface TrueOrFalseContent {
    statement: string;
    isTrue: boolean;
}

export interface SequenceSortContent {
    instruction: string;
    items: string[];
    sequenceSolution: string[];
}

export interface FillInTheBlankContent {
    sentence: string;
    answers: string[];
}

export interface QuizContent {
    question: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface Comment {
    username: string;
    text: string;
}

export interface CardContent {
    id: string;
    type: CardType;
    content: ConceptContent | ProblemContent | FlashcardContent | MemeContent | MnemonicContent | TrueOrFalseContent | SequenceSortContent | FillInTheBlankContent | QuizContent;
    comments?: Comment[];
}