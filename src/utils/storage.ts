export interface UserProgress {
  derDieDas: {
    correct: number;
    total: number;
    streak: number;
    bestStreak: number;
    missedNounIds: string[];
    masteredNounIds: string[];
  };
  vocab: {
    testedCount: number;
    correctCount: number;
    masteredIds: string[];
    bookmarkedIds: string[];
  };
  sentences: {
    completedCount: number;
    completedIds: string[];
    streak: number;
    bestStreak: number;
  };
  soundEnabled: boolean;
  slowAudio: boolean;
  showTips: boolean;
  activeLevel: string;
}

const STORAGE_KEY = 'deutschmeister_a1_v1';

export const defaultProgress: UserProgress = {
  derDieDas: {
    correct: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    missedNounIds: [],
    masteredNounIds: [],
  },
  vocab: {
    testedCount: 0,
    correctCount: 0,
    masteredIds: [],
    bookmarkedIds: [],
  },
  sentences: {
    completedCount: 0,
    completedIds: [],
    streak: 0,
    bestStreak: 0,
  },
  soundEnabled: true,
  slowAudio: false,
  showTips: true,
  activeLevel: 'A1',
};

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    return { ...defaultProgress, ...parsed };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // quota exceeded or private mode
  }
}
