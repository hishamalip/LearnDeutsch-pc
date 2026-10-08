import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookMarked, 
  Volume2, 
  RotateCw, 
  Check, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  Shuffle, 
  Layers, 
  HelpCircle, 
  Keyboard, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  Columns
} from 'lucide-react';
import { A1Item } from '../data/types';
import { A1_ITEMS } from '../data/a1Data';
import { UserProgress } from '../utils/storage';
import { speakGerman } from '../utils/audio';
import { handleUmlautKeyDown } from '../utils/umlauts';
import { VocabularyFilterCategory, matchesCategory } from '../utils/themeCategorizer';

interface VocabularyPracticeProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

export const VocabularyPractice: React.FC<VocabularyPracticeProps> = ({
  progress,
  onUpdateProgress,
}) => {
  const [mode, setMode] = useState<'flashcards' | 'flashcards_v2' | 'quiz' | 'spelling'>('flashcards');
  const [category, setCategory] = useState<VocabularyFilterCategory>('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Flashcard state
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Quiz state
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);

  // Spelling state
  const [typingInput, setTypingInput] = useState<string>('');
  const [typingAnswered, setTypingAnswered] = useState<boolean>(false);
  const [typingCorrect, setTypingCorrect] = useState<boolean>(false);

  // Compute live counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: A1_ITEMS.length,
      saved: progress.vocab.bookmarkedIds.length,
      family: 0,
      house: 0,
      food: 0,
      travel: 0,
      work: 0,
      daily_life: 0,
      health: 0,
      clothing: 0,
      nouns: 0,
      verbs: 0,
      adjectives: 0,
      numbers: 0,
      time_calendar: 0,
      phrases_idioms: 0,
    };

    A1_ITEMS.forEach(item => {
      if (counts[item.category] !== undefined) counts[item.category]++;
      if (matchesCategory(item, 'family', [])) counts.family++;
      if (matchesCategory(item, 'house', [])) counts.house++;
      if (matchesCategory(item, 'food', [])) counts.food++;
      if (matchesCategory(item, 'travel', [])) counts.travel++;
      if (matchesCategory(item, 'work', [])) counts.work++;
      if (matchesCategory(item, 'daily_life', [])) counts.daily_life++;
      if (matchesCategory(item, 'health', [])) counts.health++;
      if (matchesCategory(item, 'clothing', [])) counts.clothing++;
    });

    return counts;
  }, [progress.vocab.bookmarkedIds]);

  // Filter items based on category and search query
  const filteredItems = useMemo(() => {
    let list = A1_ITEMS;

    if (category !== 'all') {
      list = list.filter(item => matchesCategory(item, category, progress.vocab.bookmarkedIds));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.german.toLowerCase().includes(q) || 
        item.english.toLowerCase().includes(q)
      );
    }

    return list;
  }, [category, progress.vocab.bookmarkedIds, searchQuery]);

  // Shuffled indices
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const handleShuffle = useCallback(() => {
    const indices = Array.from({ length: filteredItems.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
    setQuizSelected(null);
    setQuizAnswered(false);
    setTypingInput('');
    setTypingAnswered(false);
  }, [filteredItems.length]);

  useEffect(() => {
    handleShuffle();
  }, [handleShuffle, category]);

  const currentItem: A1Item | undefined = filteredItems[shuffledIndices[currentIndex] || 0];

  const isBookmarked = currentItem ? progress.vocab.bookmarkedIds.includes(currentItem.id) : false;
  const isMastered = currentItem ? progress.vocab.masteredIds.includes(currentItem.id) : false;

  const handleToggleBookmark = useCallback(() => {
    if (!currentItem) return;
    onUpdateProgress(prev => {
      const exists = prev.vocab.bookmarkedIds.includes(currentItem.id);
      const nextBookmarks = exists
        ? prev.vocab.bookmarkedIds.filter(id => id !== currentItem.id)
        : [...prev.vocab.bookmarkedIds, currentItem.id];
      return {
        ...prev,
        vocab: {
          ...prev.vocab,
          bookmarkedIds: nextBookmarks
        }
      };
    });
  }, [currentItem, onUpdateProgress]);

  const handleMarkMastered = useCallback((mastered: boolean) => {
    if (!currentItem) return;
    onUpdateProgress(prev => {
      const currentMastered = prev.vocab.masteredIds;
      const nextMastered = mastered
        ? currentMastered.includes(currentItem.id) ? currentMastered : [...currentMastered, currentItem.id]
        : currentMastered.filter(id => id !== currentItem.id);
      return {
        ...prev,
        vocab: {
          ...prev.vocab,
          masteredIds: nextMastered
        }
      };
    });

    // Advance to next card
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [currentItem, currentIndex, filteredItems.length, onUpdateProgress]);

  const handlePronounce = useCallback((text?: string) => {
    if (!currentItem) return;
    const str = text || currentItem.german;
    speakGerman(str, progress.slowAudio ? 0.75 : 0.95);
  }, [currentItem, progress.slowAudio]);

  // Quiz distractors
  const quizOptions = useMemo(() => {
    if (!currentItem || filteredItems.length < 4) return [];
    const correct = currentItem.english;
    const distractors = filteredItems
      .filter(item => item.id !== currentItem.id && item.english !== correct)
      .map(item => item.english);
    
    const shuffled = [...distractors].sort(() => 0.5 - Math.random());
    const picked = [correct, ...shuffled.slice(0, 3)].sort(() => 0.5 - Math.random());
    return picked;
  }, [currentItem, filteredItems]);

  const handleQuizAnswer = useCallback((answer: string) => {
    if (quizAnswered || !currentItem) return;
    setQuizSelected(answer);
    setQuizAnswered(true);

    const isCorrect = answer === currentItem.english;
    if (isCorrect) {
      handleMarkMastered(true);
    }
  }, [quizAnswered, currentItem, handleMarkMastered]);

  const handleNextCard = useCallback(() => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setQuizSelected(null);
      setQuizAnswered(false);
      setTypingInput('');
      setTypingAnswered(false);
    } else {
      handleShuffle();
    }
  }, [currentIndex, filteredItems.length, handleShuffle]);

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setQuizSelected(null);
      setQuizAnswered(false);
      setTypingInput('');
      setTypingAnswered(false);
    }
  }, [currentIndex]);

  const handleCheckTyping = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentItem) return;

    if (!typingAnswered) {
      const cleanInput = typingInput.trim().toLowerCase();
      const cleanGerman = currentItem.german.trim().toLowerCase();
      const isCorrect = cleanInput === cleanGerman || cleanInput === (currentItem.nounClean || '').toLowerCase();

      setTypingCorrect(isCorrect);
      setTypingAnswered(true);

      if (isCorrect) {
        handleMarkMastered(true);
      }
    } else {
      handleNextCard();
    }
  }, [currentItem, typingAnswered, typingInput, handleMarkMastered, handleNextCard]);

  // Global Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (mode === 'spelling' && e.key === 'Enter') {
          // Handled directly on input
          return;
        }
        return;
      }

      if (mode === 'flashcards' || mode === 'flashcards_v2') {
        if (e.key === ' ' && mode === 'flashcards') {
          e.preventDefault();
          setIsFlipped(prev => !prev);
        } else if (e.key === ' ' && mode === 'flashcards_v2') {
          e.preventDefault();
          handlePronounce();
        } else if (e.key === '1') {
          e.preventDefault();
          handleMarkMastered(false);
        } else if (e.key === '2') {
          e.preventDefault();
          handleMarkMastered(true);
        } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextCard();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevCard();
        }
      } else if (mode === 'quiz') {
        if (!quizAnswered) {
          if (e.key === '1' && quizOptions[0]) handleQuizAnswer(quizOptions[0]);
          else if (e.key === '2' && quizOptions[1]) handleQuizAnswer(quizOptions[1]);
          else if (e.key === '3' && quizOptions[2]) handleQuizAnswer(quizOptions[2]);
          else if (e.key === '4' && quizOptions[3]) handleQuizAnswer(quizOptions[3]);
        } else {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNextCard();
          }
        }
      } else if (mode === 'spelling') {
        if (typingAnswered && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNextCard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, quizAnswered, quizOptions, typingAnswered, handleQuizAnswer, handleMarkMastered, handleNextCard, handlePrevCard]);

  return (
    <div className="w-full space-y-2.5">
      {/* Top Bar with Modes & Counts (Full-Width, No Hide Tips button because filters are permanent!) */}
      <div className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            Vocabulary Practice
          </span>
          <span className="text-xs font-mono text-slate-500">
            Card {currentIndex + 1} of {filteredItems.length}
          </span>
        </div>

        {/* Practice Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setMode('flashcards')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${
              mode === 'flashcards'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => setMode('flashcards_v2')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${
              mode === 'flashcards_v2'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Side-by-side German & English (Top/Bottom on mobile)"
          >
            <Columns className="w-4 h-4" />
            <span>Flashcard V2</span>
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${
              mode === 'quiz'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => setMode('spelling')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${
              mode === 'spelling'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Spelling</span>
          </button>
        </div>

        {/* Quick Shuffle */}
        <button
          onClick={handleShuffle}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Reshuffle vocabulary pool"
        >
          <Shuffle className="w-3.5 h-3.5 text-slate-400" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Main Full-Width Layout: Desktop: 30% Left + 70% Right; Mobile: Card First (order-1), Filters (order-2) */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch">
        
        {/* FILTERS PANEL (Desktop Left: order-1; Mobile Bottom: order-2, LOCKED HEIGHT md:h-[480px]) */}
        <div className="w-full md:w-[30%] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 flex flex-col justify-between md:h-[480px] animate-in fade-in order-2 md:order-1">
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 h-7 shrink-0">
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Vocabulary Filters</span>
              </div>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                {filteredItems.length} Words
              </span>
            </div>

            {/* Quick Search Input */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search German or English..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50/60"
              />
            </div>

            {/* CATEGORY & THEME DROPDOWN (Set size & smooth internal scroll - never huge or long!) */}
            <div className="space-y-1 shrink-0 relative" ref={categoryDropdownRef}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Category & Topic:
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
              >
                <span className="truncate flex items-center gap-1.5">
                  {category === 'all' && '📚 All Vocabulary'}
                  {category === 'saved' && '⭐ Saved / Bookmarked'}
                  {category === 'family' && '👥 Family & People'}
                  {category === 'house' && '🏠 Home & Living'}
                  {category === 'food' && '🍽️ Food & Dining'}
                  {category === 'travel' && '✈️ Travel & Transport'}
                  {category === 'work' && '💼 Work & Study'}
                  {category === 'daily_life' && '🎯 Daily Life & Hobbies'}
                  {category === 'health' && '🩺 Body & Health'}
                  {category === 'clothing' && '👕 Shopping & Clothing'}
                  {category === 'nouns' && '🏷️ Nouns (with articles)'}
                  {category === 'verbs' && '⚡ Verbs'}
                  {category === 'adjectives' && '🎨 Adjectives & Adverbs'}
                  {category === 'numbers' && '🔢 Numbers'}
                  {category === 'time_calendar' && '📅 Time, Days & Months'}
                  {category === 'phrases_idioms' && '💬 Phrases & Greetings'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* FLOATING DROPDOWN POPUP WITH FIXED MAX-HEIGHT (SET SIZE & INTERNAL SCROLL) */}
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto p-1 text-xs divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95">
                  {/* GROUP 1: GENERAL */}
                  <div className="p-1 space-y-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      General
                    </span>
                    <button
                      type="button"
                      onClick={() => { setCategory('all'); setIsCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                        category === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">📚 All Vocabulary</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-mono">
                        {categoryCounts.all}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCategory('saved'); setIsCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                        category === 'saved' ? 'bg-amber-50 text-amber-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">⭐ Saved / Bookmarked</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
                        {categoryCounts.saved}
                      </span>
                    </button>
                  </div>

                  {/* GROUP 2: EVERYDAY LIFE THEMES */}
                  <div className="p-1 space-y-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Everyday Life Themes
                    </span>
                    {[
                      { key: 'family' as const, label: '👥 Family & People', count: categoryCounts.family },
                      { key: 'house' as const, label: '🏠 Home & Living', count: categoryCounts.house },
                      { key: 'food' as const, label: '🍽️ Food & Dining', count: categoryCounts.food },
                      { key: 'travel' as const, label: '✈️ Travel & Transport', count: categoryCounts.travel },
                      { key: 'work' as const, label: '💼 Work & Study', count: categoryCounts.work },
                      { key: 'daily_life' as const, label: '🎯 Daily Life & Hobbies', count: categoryCounts.daily_life },
                      { key: 'health' as const, label: '🩺 Body & Health', count: categoryCounts.health },
                      { key: 'clothing' as const, label: '👕 Shopping & Clothing', count: categoryCounts.clothing },
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => { setCategory(item.key); setIsCategoryDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                          category === item.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-mono">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* GROUP 3: GRAMMAR GROUPS */}
                  <div className="p-1 space-y-0.5">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Grammar Groups
                    </span>
                    {[
                      { key: 'nouns' as const, label: '🏷️ Nouns (with articles)', count: categoryCounts.nouns },
                      { key: 'verbs' as const, label: '⚡ Verbs', count: categoryCounts.verbs },
                      { key: 'adjectives' as const, label: '🎨 Adjectives & Adverbs', count: categoryCounts.adjectives },
                      { key: 'numbers' as const, label: '🔢 Numbers', count: categoryCounts.numbers },
                      { key: 'time_calendar' as const, label: '📅 Time, Days & Months', count: categoryCounts.time_calendar },
                      { key: 'phrases_idioms' as const, label: '💬 Phrases & Greetings', count: categoryCounts.phrases_idioms },
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => { setCategory(item.key); setIsCategoryDropdownOpen(false); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                          category === item.key ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 font-mono">
                          {item.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary Card of Active Filter */}
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-1 shrink-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-indigo-900">Active Theme:</span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                  {filteredItems.length} terms
                </span>
              </div>
              <p className="text-slate-600 text-xs leading-snug">
                {category === 'all' && 'All Goethe / Telc A1 high-frequency words.'}
                {category === 'saved' && 'Your personal bookmarked words for focused practice.'}
                {category === 'family' && 'Relatives, relationships, people, and personal info.'}
                {category === 'house' && 'Rooms, furniture, apartment renting, and household items.'}
                {category === 'food' && 'Meals, groceries, dining out, drinks, and cooking.'}
                {category === 'travel' && 'Trains, airports, hotels, directions, and luggage.'}
                {category === 'work' && 'Jobs, office, communication, study, and daily career.'}
                {category === 'daily_life' && 'Hobbies, sports, entertainment, daily routines, and time.'}
                {category === 'health' && 'Body parts, illness, doctors, pharmacy, and emergency.'}
                {category === 'clothing' && 'Clothes, shoes, shopping, prices, and sizes.'}
                {['nouns', 'verbs', 'adjectives', 'numbers', 'time_calendar', 'phrases_idioms'].includes(category) && 'Essential grammatical unit practice.'}
              </p>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 shrink-0">
              <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Shortcuts:</span>
              </p>
              {mode === 'flashcards' && (
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p><strong>Space</strong> = Flip Card</p>
                  <p><strong>1</strong> = Needs Review &bull; <strong>2</strong> = Mastered</p>
                  <p><strong>Enter / &rarr;</strong> = Next Word &bull; <strong>&larr;</strong> = Prev</p>
                </div>
              )}
              {mode === 'flashcards_v2' && (
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p><strong>Space</strong> = Replay Audio</p>
                  <p><strong>1</strong> = Needs Review &bull; <strong>2</strong> = Mastered</p>
                  <p><strong>Enter / &rarr;</strong> = Next Word &bull; <strong>&larr;</strong> = Prev</p>
                </div>
              )}
              {mode === 'quiz' && (
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p><strong>1, 2, 3, 4</strong> = Select Option</p>
                  <p><strong>Enter</strong> = Next Question</p>
                </div>
              )}
              {mode === 'spelling' && (
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p><strong>Ctrl+a/o/u/s</strong> = ä / ö / ü / ß</p>
                  <p><strong>Enter</strong> = Check / Next Word</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center pt-1.5 border-t border-slate-100 shrink-0">
            A1 Core Vocabulary &bull; Always Accessible
          </p>
        </div>

        {/* RIGHT SIDE: 70% WIDTH (Desktop Right: order-2; Mobile Top: order-1) */}
        <div className="w-full md:w-[70%] flex-1 min-h-[460px] md:h-[490px] order-1 md:order-2">
          {!currentItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 h-full flex flex-col items-center justify-center">
              <BookMarked className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">No words found for this filter.</p>
              <button
                onClick={() => { setCategory('all'); setSearchQuery(''); }}
                className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : mode === 'flashcards' ? (
            /* FLASHCARDS - ROCK-SOLID ANCHORED WORD POSITION */
            <div className="space-y-2 h-full flex flex-col justify-between">
              <div
                onClick={() => setIsFlipped(prev => !prev)}
                className="relative flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between text-center cursor-pointer hover:border-indigo-300 transition-all select-none"
              >
                {/* Card Top Header */}
                <div className="w-full h-7 flex items-center justify-end text-xs shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {isMastered && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mastered
                      </span>
                    )}
                    <button
                      onClick={() => handlePronounce()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleToggleBookmark}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="Save"
                    >
                      <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* ANCHORED WORD DISPLAY AREA (FIXED HEIGHT h-[140px] - NEVER SHIFTS BETWEEN WORDS) */}
                <div className="w-full h-[140px] min-h-[140px] max-h-[140px] flex flex-col items-center justify-center space-y-1 shrink-0">
                  <div className="h-6 flex items-center justify-center">
                    {!isFlipped && currentItem.plural ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Plural: die {currentItem.plural.startsWith('-') ? `${currentItem.nounClean || ''}${currentItem.plural}` : currentItem.plural}
                      </span>
                    ) : null}
                  </div>

                  <div className="h-14 flex items-center justify-center">
                    <h2 className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${
                      isFlipped ? 'text-indigo-900' : 'text-slate-900'
                    }`}>
                      {isFlipped ? currentItem.english : currentItem.german}
                    </h2>
                  </div>

                  <div className="h-6 flex items-center justify-center">
                    {isFlipped ? (
                      <p className="text-sm font-bold text-slate-500">
                        {currentItem.german}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* ANCHORED EXAMPLE SENTENCE (STRICTLY FIXED h-[54px] - CONSTANT POSITION, NEVER JUMPS WHEN FLIPPED) */}
                <div className="w-full h-[54px] min-h-[54px] max-h-[54px] pt-1.5 border-t border-slate-100 flex flex-col justify-start text-left text-xs shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Line 1: German Sentence (Always fixed at top of this box) */}
                  <div className="h-6 flex items-center justify-between truncate">
                    <span className="truncate font-semibold text-slate-800 text-xs">
                      {currentItem.sentenceDe || '—'}
                    </span>
                    {currentItem.sentenceDe && (
                      <button
                        onClick={() => handlePronounce(currentItem.sentenceDe)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 ml-1"
                        title="Listen to sentence"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Line 2: English Sentence (Matching English word meaning color text-indigo-900) */}
                  <div className={`h-6 flex items-center truncate ${isFlipped && currentItem.sentenceEn ? 'visible' : 'invisible'}`}>
                    <span className="truncate font-semibold text-indigo-900 text-xs">
                      {currentItem.sentenceEn || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons (2x2 grid on mobile, 1 row on desktop - zero overflow) */}
              <div className="w-full pt-1.5 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2 shrink-0">
                {/* REVIEW & MASTERED BUTTONS */}
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 sm:order-2">
                  <button
                    onClick={() => handleMarkMastered(false)}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 border ${
                      !isMastered && progress.vocab.masteredIds.length > 0
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="Press 1"
                  >
                    <span>Needs Review</span>
                    <kbd className="px-1.5 py-0.2 bg-white rounded text-[10px] text-slate-500 border border-slate-300 font-mono">1</kbd>
                  </button>
                  <button
                    onClick={() => handleMarkMastered(!isMastered)}
                    className={`py-2 px-2.5 sm:px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors border ${
                      isMastered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                    }`}
                    title="Press 2"
                  >
                    <Check className={`w-3.5 h-3.5 ${isMastered ? 'text-white' : 'text-slate-400'}`} />
                    <span>Mastered</span>
                    <kbd className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isMastered 
                        ? 'bg-emerald-700 text-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>2</kbd>
                  </button>
                </div>

                {/* PREV & NEXT NAVIGATION */}
                <div className="grid grid-cols-2 gap-1.5 sm:contents">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                    className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors sm:order-1"
                    title="Previous Card (Left Arrow)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="py-2 px-3 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs sm:order-3"
                    title="Next Card (Enter / Right Arrow)"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <kbd className="px-1.5 py-0.2 bg-indigo-800 text-indigo-100 rounded text-[10px] font-mono hidden sm:inline">Enter</kbd>
                  </button>
                </div>
              </div>
            </div>
          ) : mode === 'flashcards_v2' ? (
            /* FLASHCARDS V2: DUAL VIEW (SIDE-BY-SIDE ON DESKTOP, TOP-BOTTOM ON MOBILE) */
            <div className="space-y-2 h-full flex flex-col justify-between">
              <div className="relative flex-1 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs flex flex-col justify-between overflow-hidden">
                {/* Card Top Header */}
                <div className="w-full h-8 px-4 sm:px-5 flex items-center justify-end border-b border-slate-100 bg-slate-50/70 text-xs shrink-0">
                  <div className="flex items-center gap-1">
                    {isMastered && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mastered
                      </span>
                    )}
                    <button
                      onClick={() => handlePronounce()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                      title="Listen to German"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleToggleBookmark}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-white transition-colors"
                      title="Save"
                    >
                      <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dual View Content: Mobile = Top German / Bottom English; Desktop = Left German / Right English */}
                <div className="flex-1 flex flex-col md:flex-row items-stretch overflow-hidden">
                  {/* GERMAN SECTION (Left side on Desktop, Top side on Mobile) */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between text-center bg-slate-50/40 border-b md:border-b-0 md:border-r border-slate-200">
                    <div className="my-auto py-2 flex flex-col items-center justify-center space-y-1">
                      <div className="h-6 flex items-center justify-center">
                        {currentItem.plural ? (
                          <p className="text-xs text-slate-500 font-mono">
                            Plural: die {currentItem.plural.startsWith('-') ? `${currentItem.nounClean || ''}${currentItem.plural}` : currentItem.plural}
                          </p>
                        ) : null}
                      </div>
                      <div className="h-14 flex items-center justify-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                          {currentItem.german}
                        </h2>
                      </div>
                      <div className="h-6 flex items-center justify-center" />
                    </div>

                    {/* German Example (Identical fixed height & symmetric border) */}
                    <div className="h-12 min-h-[48px] max-h-12 pt-2 border-t border-slate-200 text-left text-xs flex items-center justify-between shrink-0">
                      <span className="truncate font-semibold text-slate-800 text-xs">
                        {currentItem.sentenceDe || '—'}
                      </span>
                      {currentItem.sentenceDe ? (
                        <button
                          onClick={() => handlePronounce(currentItem.sentenceDe)}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors ml-1.5 shrink-0"
                          title="Listen to German sentence"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-6 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* ENGLISH SECTION (Right side on Desktop, Bottom side on Mobile) */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between text-center bg-white">
                    <div className="my-auto py-2 flex flex-col items-center justify-center space-y-1">
                      <div className="h-6 flex items-center justify-center" />
                      <div className="h-14 flex items-center justify-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-indigo-900 tracking-tight leading-tight">
                          {currentItem.english}
                        </h2>
                      </div>
                      <div className="h-6 flex items-center justify-center" />
                    </div>

                    {/* English Example (Identical fixed height & symmetric border & matching word color text-indigo-900) */}
                    <div className="h-12 min-h-[48px] max-h-12 pt-2 border-t border-slate-200 text-left text-xs flex items-center justify-between shrink-0">
                      <span className="truncate font-semibold text-indigo-900 text-xs">
                        {currentItem.sentenceEn || '—'}
                      </span>
                      {/* Symmetry spacer matching audio button width */}
                      <div className="w-6 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons (2x2 grid on mobile, 1 row on desktop - zero overflow) */}
              <div className="w-full pt-1.5 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-2 shrink-0">
                {/* REVIEW & MASTERED BUTTONS */}
                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 sm:order-2">
                  <button
                    onClick={() => handleMarkMastered(false)}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 border ${
                      !isMastered && progress.vocab.masteredIds.length > 0
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                    title="Press 1"
                  >
                    <span>Needs Review</span>
                    <kbd className="px-1.5 py-0.2 bg-white rounded text-[10px] text-slate-500 border border-slate-300 font-mono">1</kbd>
                  </button>
                  <button
                    onClick={() => handleMarkMastered(!isMastered)}
                    className={`py-2 px-2.5 sm:px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors border ${
                      isMastered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                    }`}
                    title="Press 2"
                  >
                    <Check className={`w-3.5 h-3.5 ${isMastered ? 'text-white' : 'text-slate-400'}`} />
                    <span>Mastered</span>
                    <kbd className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isMastered 
                        ? 'bg-emerald-700 text-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>2</kbd>
                  </button>
                </div>

                {/* PREV & NEXT NAVIGATION */}
                <div className="grid grid-cols-2 gap-1.5 sm:contents">
                  <button
                    onClick={handlePrevCard}
                    disabled={currentIndex === 0}
                    className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors sm:order-1"
                    title="Previous Card (Left Arrow)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="py-2 px-3 sm:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs sm:order-3"
                    title="Next Card (Enter / Right Arrow)"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <kbd className="px-1.5 py-0.2 bg-indigo-800 text-indigo-100 rounded text-[10px] font-mono hidden sm:inline">Enter</kbd>
                  </button>
                </div>
              </div>
            </div>
          ) : mode === 'quiz' ? (
            /* QUIZ WITH NUMBERED OPTIONS 1, 2, 3, 4 AND KEYBOARD SELECTION */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select option using keys 1, 2, 3, 4:</span>
                <button
                  onClick={() => handlePronounce()}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Audio
                </button>
              </div>

              <div className="text-center py-2">
                <h2 className="text-3xl font-black text-slate-900">
                  {currentItem.german}
                </h2>
                {currentItem.sentenceDe && (
                  <p className="text-xs text-slate-500 max-w-md mx-auto pt-1 italic">
                    {currentItem.sentenceDe}
                  </p>
                )}
              </div>

              {/* Numbered options 1, 2, 3, 4 */}
              <div className="grid sm:grid-cols-2 gap-2">
                {quizOptions.map((opt, idx) => {
                  const isSelected = quizSelected === opt;
                  const isOptionCorrect = opt === currentItem.english;

                  let btnClass = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800';
                  if (quizAnswered) {
                    if (isOptionCorrect) {
                      btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    } else if (isSelected && !isOptionCorrect) {
                      btnClass = 'border-rose-400 bg-rose-50 text-rose-900 font-bold';
                    } else {
                      btnClass = 'border-slate-200 bg-slate-50/50 opacity-50 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuizAnswer(opt)}
                      disabled={quizAnswered}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${btnClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {quizAnswered && isOptionCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {quizAnswered && isSelected && !isOptionCorrect && (
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dedicated fixed-height slot for Quiz Action (h-[42px]) so option positions NEVER shift */}
              <div className="h-[42px] shrink-0 flex items-center justify-center">
                {quizAnswered ? (
                  <button
                    onClick={handleNextCard}
                    className="w-full h-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <kbd className="px-1.5 py-0.2 bg-indigo-800 text-indigo-100 text-[10px] rounded font-mono ml-1">Enter</kbd>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Press 1, 2, 3, or 4 on your keyboard
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SPELLING */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3 h-full flex flex-col justify-between">
              <div className="text-center py-2 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Type the German word:</span>
                <h2 className="text-3xl font-black text-indigo-950">
                  {currentItem.english}
                </h2>
              </div>

              <form onSubmit={handleCheckTyping} className="space-y-3 max-w-md mx-auto w-full">
                <div className="space-y-1">
                  <input
                    type="text"
                    autoFocus
                    readOnly={typingAnswered}
                    value={typingInput}
                    onChange={(e) => setTypingInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (typingAnswered) {
                          handleNextCard();
                        } else if (typingInput.trim()) {
                          handleCheckTyping();
                        }
                        return;
                      }
                      if (!typingAnswered) {
                        handleUmlautKeyDown(e, typingInput, setTypingInput);
                      }
                    }}
                    placeholder="Type German word..."
                    className="w-full px-3.5 py-2.5 text-center text-base font-bold rounded-xl border border-slate-300 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
                  />
                </div>

                {!typingAnswered && (
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] text-slate-400 mr-1">Click keys:</span>
                    {['ä', 'ö', 'ü', 'ß'].map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => setTypingInput(prev => prev + char)}
                        className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                )}

                {typingAnswered && (
                  <div className={`p-2.5 rounded-xl text-xs ${
                    typingCorrect 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}>
                    <p className="font-bold">
                      {typingCorrect ? 'Richtig! Correct!' : `Correct German: ${currentItem.german}`}
                    </p>
                  </div>
                )}

                {!typingAnswered ? (
                  <button
                    type="submit"
                    disabled={!typingInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Check Spelling</span>
                    <kbd className="px-1.5 py-0.2 bg-indigo-800 text-indigo-100 text-[10px] rounded font-mono ml-1">Enter</kbd>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextCard}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Next Word</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <kbd className="px-1.5 py-0.2 bg-slate-800 text-slate-200 text-[10px] rounded font-mono ml-1">Enter</kbd>
                  </button>
                )}
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
