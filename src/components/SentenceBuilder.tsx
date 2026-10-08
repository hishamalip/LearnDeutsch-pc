import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Puzzle, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Flame, 
  Undo2, 
  Info, 
  Check, 
  Lightbulb, 
  Sparkles,
  Keyboard,
  MousePointer,
  ChevronDown,
  Filter
} from 'lucide-react';
import { SentenceExercise } from '../data/types';
import { A1_SENTENCES } from '../data/a1Data';
import { UserProgress } from '../utils/storage';
import { speakGerman } from '../utils/audio';
import { handleUmlautKeyDown } from '../utils/umlauts';

interface SentenceBuilderProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onOpenRulesModal: () => void;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  progress,
  onUpdateProgress,
  onOpenRulesModal,
}) => {
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('all');
  const [isRuleDropdownOpen, setIsRuleDropdownOpen] = useState<boolean>(false);
  const ruleDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ruleDropdownRef.current && !ruleDropdownRef.current.contains(e.target as Node)) {
        setIsRuleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Input method: 'tiles' or 'typing'
  const [inputMode, setInputMode] = useState<'tiles' | 'typing'>('tiles');
  
  // Tiles state
  const [bankTiles, setBankTiles] = useState<{ id: string; word: string }[]>([]);
  const [builtTiles, setBuiltTiles] = useState<{ id: string; word: string }[]>([]);
  
  // Typed text state
  const [typedSentence, setTypedSentence] = useState<string>('');

  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const showTips = progress.showTips ?? true;

  // Available rule filters from data
  const ruleCategories = useMemo(() => {
    const rules = Array.from(new Set(A1_SENTENCES.map(s => s.rule)));
    return ['all', ...rules];
  }, []);

  const filteredSentences = useMemo(() => {
    if (selectedRuleFilter === 'all') return A1_SENTENCES;
    return A1_SENTENCES.filter(s => s.rule === selectedRuleFilter);
  }, [selectedRuleFilter]);

  // Shuffled indices
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  const handleShuffleList = useCallback(() => {
    const indices = Array.from({ length: filteredSentences.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
  }, [filteredSentences.length]);

  useEffect(() => {
    handleShuffleList();
  }, [handleShuffleList, selectedRuleFilter]);

  const currentExercise: SentenceExercise | undefined = filteredSentences[shuffledIndices[currentIndex] || 0];

  // Initialize word tiles for current exercise
  useEffect(() => {
    if (!currentExercise) return;
    const tiles = currentExercise.words.map((w, idx) => ({
      id: `${currentExercise.id}_${idx}_${w}`,
      word: w,
    }));
    const scrambled = [...tiles].sort(() => 0.5 - Math.random());
    setBankTiles(scrambled);
    setBuiltTiles([]);
    setTypedSentence('');
    setIsAnswered(false);
    setIsCorrect(false);
  }, [currentExercise]);

  const handleToggleTips = () => {
    onUpdateProgress(prev => ({
      ...prev,
      showTips: !prev.showTips,
    }));
  };

  const handleTileClickFromBank = (tile: { id: string; word: string }) => {
    if (isAnswered) return;
    setBankTiles(prev => prev.filter(t => t.id !== tile.id));
    setBuiltTiles(prev => [...prev, tile]);
  };

  const handleTileClickFromBuilt = (tile: { id: string; word: string }) => {
    if (isAnswered) return;
    setBuiltTiles(prev => prev.filter(t => t.id !== tile.id));
    setBankTiles(prev => [...prev, tile]);
  };

  const handleClear = () => {
    if (isAnswered || !currentExercise) return;
    const all = [...bankTiles, ...builtTiles];
    setBankTiles(all.sort(() => 0.5 - Math.random()));
    setBuiltTiles([]);
    setTypedSentence('');
  };

  const handleUndo = () => {
    if (isAnswered || builtTiles.length === 0) return;
    const last = builtTiles[builtTiles.length - 1];
    setBuiltTiles(prev => prev.slice(0, -1));
    setBankTiles(prev => [...prev, last]);
  };

  const handleHint = () => {
    if (isAnswered || !currentExercise) return;
    const nextTargetWord = currentExercise.words[builtTiles.length];
    if (!nextTargetWord) return;

    const matchInBank = bankTiles.find(t => t.word === nextTargetWord);
    if (matchInBank) {
      handleTileClickFromBank(matchInBank);
    } else {
      handleClear();
    }
  };

  // Relaxed normalization: ignores capitalization, periods, commas, questions, exclamation marks!
  const normalizeSentence = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleCheck = useCallback(() => {
    if (isAnswered || !currentExercise) return;

    let userSentence = '';
    if (inputMode === 'typing' && typedSentence.trim()) {
      userSentence = typedSentence;
    } else if (builtTiles.length > 0) {
      userSentence = builtTiles.map(t => t.word).join(' ');
    } else if (typedSentence.trim()) {
      userSentence = typedSentence;
    }

    if (!userSentence.trim()) return;

    const targetSentence = currentExercise.words.join(' ');
    const correct = normalizeSentence(userSentence) === normalizeSentence(targetSentence);

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      onUpdateProgress(prev => {
        const nextCompleted = prev.sentences.completedIds.includes(currentExercise.id)
          ? prev.sentences.completedIds
          : [...prev.sentences.completedIds, currentExercise.id];
        const nextStreak = prev.sentences.streak + 1;

        return {
          ...prev,
          sentences: {
            ...prev.sentences,
            completedCount: prev.sentences.completedCount + 1,
            completedIds: nextCompleted,
            streak: nextStreak,
            bestStreak: Math.max(prev.sentences.bestStreak, nextStreak),
          }
        };
      });
    } else {
      onUpdateProgress(prev => ({
        ...prev,
        sentences: {
          ...prev.sentences,
          streak: 0,
        }
      }));
    }
  }, [isAnswered, currentExercise, inputMode, typedSentence, builtTiles, onUpdateProgress]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredSentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleShuffleList();
    }
  }, [currentIndex, filteredSentences.length, handleShuffleList]);

  // Global Enter key: Enter checks sentence if not answered, and advances to next word if already answered!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (!isAnswered) {
          if (typedSentence.trim() || builtTiles.length > 0) {
            e.preventDefault();
            handleCheck();
          }
        } else {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, typedSentence, builtTiles.length, handleCheck, handleNext]);

  const handlePronounce = (text?: string) => {
    if (!currentExercise) return;
    speakGerman(text || currentExercise.german, progress.slowAudio ? 0.75 : 0.95);
  };

  if (!currentExercise) {
    return (
      <div className="text-center py-10 w-full">
        <p className="text-slate-500">Loading sentence builder...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Top Bar with Modes, Live Stats, and Tips Toggle (Full-Width) */}
      <div className="w-full bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Sentence Builder
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Exercise {currentIndex + 1} of {filteredSentences.length}
          </span>
        </div>

        {/* Input Method Switcher: Tiles vs Type */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setInputMode('tiles')}
            className={`flex items-center gap-1 px-2.5 py-0.5 font-bold rounded-md transition-all ${
              inputMode === 'tiles'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-3 h-3" />
            <span>Tiles Mode</span>
          </button>
          <button
            onClick={() => setInputMode('typing')}
            className={`flex items-center gap-1 px-2.5 py-0.5 font-bold rounded-md transition-all ${
              inputMode === 'typing'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3 h-3" />
            <span>Typing Mode</span>
          </button>
        </div>

        {/* Compact Rule Selector when Tips are Hidden */}
        {!showTips && (
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedRuleFilter}
              onChange={(e) => setSelectedRuleFilter(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              {ruleCategories.map((rule) => (
                <option key={rule} value={rule}>
                  {rule === 'all' ? `All Rules (${A1_SENTENCES.length})` : rule}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Streak: {progress.sentences.streak}</span>
          </div>

          {/* Hide Tips / Show Tips Button */}
          <button
            onClick={handleToggleTips}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
              showTips
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={showTips ? 'Hide the tips panel' : 'Show the tips panel'}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${showTips ? 'fill-amber-400 text-amber-600' : 'text-slate-400'}`} />
            <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
          </button>

          <button
            onClick={handleShuffleList}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Reshuffle exercises"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenRulesModal}
            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Word Order Rules Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Full-Width Layout: 30% Left (Dropdown Filter & Educational Tips) + 70% Right (Builder Workspace) */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch">
        
        {/* LEFT SIDE: 30% WIDTH (Desktop Left: order-1; Mobile Bottom: order-2) */}
        {showTips && (
          <div className="w-full md:w-[30%] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 flex flex-col justify-between md:h-[480px] animate-in fade-in order-2 md:order-1">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 h-7 shrink-0">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span>Word Order Guide (V2)</span>
                </div>
                <button
                  onClick={handleToggleTips}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Hide Tips
                </button>
              </div>

              {/* 1. RESULT/RULE FILTER CUSTOM DROPDOWN (Set size & smooth internal scroll) */}
              <div className="space-y-0.5 shrink-0 relative" ref={ruleDropdownRef}>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Grammar Rule Filter:
                </label>
                <button
                  type="button"
                  onClick={() => setIsRuleDropdownOpen(prev => !prev)}
                  className="w-full pl-2.5 pr-8 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="truncate">
                    {selectedRuleFilter === 'all' 
                      ? `All Rules (${A1_SENTENCES.length})` 
                      : `${selectedRuleFilter} (${A1_SENTENCES.filter(s => s.rule === selectedRuleFilter).length})`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isRuleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRuleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-xl max-h-52 overflow-y-auto p-1 text-xs">
                    {ruleCategories.map((rule) => {
                      const count = rule === 'all'
                        ? A1_SENTENCES.length
                        : A1_SENTENCES.filter(s => s.rule === rule).length;
                      const isSelected = selectedRuleFilter === rule;

                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() => {
                            setSelectedRuleFilter(rule);
                            setIsRuleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate mr-2">
                            {rule === 'all' ? 'All Rules' : rule}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-mono ${
                            isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. SECTION FOCUS TIP (DYNAMIC PER ACTIVE SENTENCE - FULL TEXT NEVER CUT OFF!) */}
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 text-xs flex flex-col justify-between shrink-0 space-y-1">
                <span className="font-bold text-xs flex items-center gap-1 text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Active Focus: {currentExercise.rule}
                </span>
                <p className="text-xs leading-snug text-slate-700">
                  {currentExercise.ruleDesc}
                </p>
              </div>

              {/* 3. CORE SYNTAX LAWS (CLEAN UNIFIED REFERENCE) */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5 text-xs">
                <div>
                  <span className="font-bold text-emerald-900 text-xs">1. V2 Law: </span>
                  <span className="text-slate-600 text-xs leading-snug">Verb is <strong>strictly Position 2</strong> (subject inverts if time leads).</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">2. Sentence Bracket: </span>
                  <span className="text-slate-600 text-xs leading-snug">Modals send infinitives/prefixes to the <strong>very end</strong>.</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs">3. Questions: </span>
                  <span className="text-slate-600 text-xs leading-snug">Ja/Nein = Verb 1st; W-Fragen = W-word (1) + Verb (2).</span>
                </div>
              </div>

              {/* 4. KEYBOARD SHORTCUTS HINT */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-800 text-xs">Shortcuts:</p>
                <p><strong>Enter</strong> = Check / Next Word &bull; <strong>Ctrl+a/o/u/s</strong> = ä/ö/ü/ß</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center pt-1.5 border-t border-slate-100 shrink-0">
              A1 Syntax & Structure
            </p>
          </div>
        )}

        {/* RIGHT SIDE: 70% WIDTH (Desktop Right: order-2; Mobile Top: order-1) */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 flex flex-col justify-between min-h-[420px] md:h-[480px] transition-all order-1 md:order-2 ${
          showTips ? 'w-full md:w-[70%] flex-1' : 'w-full'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-1.5 h-6 shrink-0">
            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200/60 truncate">
              {currentExercise.rule}
            </span>
            <button
              onClick={() => handlePronounce()}
              className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-semibold text-xs"
            >
              <Volume2 className="w-3.5 h-3.5" /> Listen
            </button>
          </div>

          {/* Target English Sentence (Anchored h-[48px]) */}
          <div className="text-center h-[48px] flex flex-col justify-center items-center shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Construct or Type in German:
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate max-w-full">
              {currentExercise.english}
            </h2>
          </div>

          {/* INPUT / CONSTRUCTION ZONE (Anchored h-[58px]) */}
          <div className="h-[58px] flex items-center justify-center shrink-0">
            {inputMode === 'typing' ? (
              <input
                type="text"
                autoFocus
                disabled={isAnswered}
                value={typedSentence}
                onChange={(e) => setTypedSentence(e.target.value)}
                onKeyDown={(e) => {
                  handleUmlautKeyDown(e, typedSentence, setTypedSentence);
                }}
                placeholder="Type German sentence... (Ctrl+a=ä, Ctrl+o=ö, Ctrl+u=ü, Ctrl+s=ß)"
                className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
              />
            ) : (
              <div className={`w-full h-full p-1.5 px-2.5 rounded-xl border-2 border-dashed transition-all flex flex-wrap items-center gap-1.5 overflow-hidden ${
                isAnswered
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-rose-400 bg-rose-50/40'
                  : 'border-slate-300 bg-slate-50/60'
              }`}>
                {builtTiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic mx-auto">
                    Click word tiles below to arrange them in order...
                  </p>
                ) : (
                  builtTiles.map((tile, idx) => (
                    <button
                      key={tile.id}
                      onClick={() => handleTileClickFromBuilt(tile)}
                      disabled={isAnswered}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center gap-1"
                    >
                      <span className="text-[9px] text-slate-400 font-mono">{idx + 1}</span>
                      <span>{tile.word}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* WORD BANK (Anchored h-[52px]) */}
          <div className="h-[52px] flex items-center justify-between gap-1.5 p-1.5 bg-slate-100/70 rounded-xl border border-slate-200/80 overflow-x-auto shrink-0">
            {bankTiles.length === 0 ? (
              <p className="text-xs text-slate-400 mx-auto">All words placed. Press Enter or Check!</p>
            ) : (
              <div className="flex items-center gap-1.5 flex-nowrap">
                {bankTiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => {
                      if (inputMode === 'typing') {
                        setTypedSentence(prev => prev ? `${prev} ${tile.word}` : tile.word);
                      } else {
                        handleTileClickFromBank(tile);
                      }
                    }}
                    disabled={isAnswered}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-900 border border-slate-300 hover:border-emerald-300 font-bold text-xs shadow-2xs active:scale-95 transition-all whitespace-nowrap"
                  >
                    {tile.word}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ANSWER FEEDBACK (Anchored h-[56px]) */}
          <div className="h-[56px] flex items-center justify-center shrink-0">
            {isAnswered ? (
              <div className={`w-full p-1.5 px-2.5 rounded-xl border text-left text-xs transition-all ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-xs">
                      {isCorrect ? 'Ausgezeichnet! Correct!' : 'Incorrect order!'}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePronounce()}
                    className="px-1.5 py-0.2 rounded bg-white text-slate-700 text-[10px] font-bold border border-slate-200"
                  >
                    Listen
                  </button>
                </div>

                <p className="truncate text-[11px] mt-0.5">
                  German: <strong className="underline">{currentExercise.german}</strong>
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Press Enter or click "Check Sentence" when ready
              </p>
            )}
          </div>

          {/* ACTION BUTTON (Fixed Height h-[44px]) */}
          <div className="h-[44px] shrink-0">
            {!isAnswered ? (
              <button
                onClick={handleCheck}
                disabled={builtTiles.length === 0 && !typedSentence.trim()}
                className="w-full h-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Check Sentence</span>
                <kbd className="px-1.5 py-0.2 bg-emerald-800 text-emerald-100 text-[10px] rounded font-mono ml-1">Enter</kbd>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full h-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Next Sentence</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <kbd className="px-1.5 py-0.2 bg-slate-800 text-slate-200 text-[10px] rounded font-mono ml-1">Enter</kbd>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
