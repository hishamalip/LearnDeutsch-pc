import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Volume2, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  ArrowRight,
  Lightbulb,
  Sparkles,
  Eye,
  EyeOff,
  Play,
  Award,
  RefreshCw,
  Sliders,
  Settings2
} from 'lucide-react';
import { A1Noun, Gender } from '../data/types';
import { A1_NOUNS } from '../data/a1Data';
import { UserProgress } from '../utils/storage';
import { speakGerman } from '../utils/audio';

interface DerDieDasTrainerProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onOpenRulesModal: () => void;
}

// Function to detect dynamic guessing clues for any noun
function getGuessingClue(noun: string, ruleTip: string): { clue: string; targetHint?: Gender; confidence: 'high' | 'medium' | 'general' } {
  const clean = noun.trim();
  const lower = clean.toLowerCase();

  // 100% Female suffixes
  if (/(ung|heit|keit|schaft|ion|tät|ei)$/i.test(clean)) {
    return {
      clue: `Ends in "${clean.slice(-3)}" — 100% of nouns with this suffix take DIE!`,
      targetHint: 'die',
      confidence: 'high'
    };
  }

  // Diminutives (100% Das)
  if (/(chen|lein)$/i.test(clean)) {
    return {
      clue: `Ends in diminutive "-chen/-lein" — Always neuter (DAS)!`,
      targetHint: 'das',
      confidence: 'high'
    };
  }

  // Days, Months, Seasons, Compass
  const calendarTerms = [
    'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag', 'sonnabend',
    'januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember',
    'frühling', 'sommer', 'herbst', 'winter', 'morgen', 'mittag', 'nachmittag', 'abend',
    'norden', 'süden', 'westen', 'osten'
  ];
  if (calendarTerms.includes(lower)) {
    return {
      clue: `Calendar units (days, months, seasons, compass points) take DER!`,
      targetHint: 'der',
      confidence: 'high'
    };
  }

  if (lower === 'nacht') {
    return {
      clue: `"Nacht" is the famous exception to times of day (die Nacht)!`,
      targetHint: 'die',
      confidence: 'high'
    };
  }

  // Male / Female persons
  if (/(vater|sohn|bruder|mann|onkel|arzt|lehrer|schüler|kollege|chef|herr|partner)$/i.test(clean)) {
    return {
      clue: `Male person / profession naturally takes masculine (DER).`,
      targetHint: 'der',
      confidence: 'high'
    };
  }
  if (/(mutter|tochter|schwester|frau|tante|ärztin|lehrerin|schülerin|kollegin|chefin|dame|partnerin)$/i.test(clean)) {
    return {
      clue: `Female person / profession naturally takes feminine (DIE).`,
      targetHint: 'die',
      confidence: 'high'
    };
  }

  // Verbs turned into nouns (das Essen, das Leben, das Trinken)
  if (/^[A-Z][a-z]+en$/.test(clean) && ['Essen', 'Leben', 'Schwimmen', 'Trinken', 'Reisen'].includes(clean)) {
    return {
      clue: `Verb infinitive turned directly into a noun — Always neuter (DAS).`,
      targetHint: 'das',
      confidence: 'high'
    };
  }

  // Loan words ending in -ment, -um, -o
  if (/(ment|um)$/i.test(clean) || (clean.endsWith('o') && ['Auto', 'Kino', 'Foto', 'Radio'].includes(clean))) {
    return {
      clue: `Foreign loan word ending (-ment, -um, -o) — Usually neuter (DAS).`,
      targetHint: 'das',
      confidence: 'medium'
    };
  }

  // Masculine suffixes: -or, -ling, -ismus
  if (/(or|ling|ismus)$/i.test(clean)) {
    return {
      clue: `Suffix (-or, -ling, -ismus) is standard masculine (DER).`,
      targetHint: 'der',
      confidence: 'high'
    };
  }

  // Nouns ending in -e (90% die in German)
  if (clean.length > 3 && clean.endsWith('e')) {
    return {
      clue: `Ends in "-e" — Around 90% of two-syllable German nouns ending in "-e" take DIE.`,
      targetHint: 'die',
      confidence: 'medium'
    };
  }

  // Instrument / tool nouns ending in -er
  if (clean.endsWith('er') && ['Drucker', 'Computer', 'Kugelschreiber', 'Schlüssel', 'Herd', 'Koffer'].includes(clean)) {
    return {
      clue: `Agent or device ending in "-er" frequently takes masculine (DER).`,
      targetHint: 'der',
      confidence: 'medium'
    };
  }

  // General heuristic
  return {
    clue: ruleTip || `Notice the word length and roots. When in doubt, check if it relates to an action or concrete object.`,
    confidence: 'general'
  };
}

export const DerDieDasTrainer: React.FC<DerDieDasTrainerProps> = ({
  progress,
  onUpdateProgress,
  onOpenRulesModal,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes'>('all');
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);
  
  // User configurable session size: 25, 50 (DEFAULT), 100, 200, or custom
  const [sessionTargetSize, setSessionTargetSize] = useState<number>(50);
  const [isCustomSize, setIsCustomSize] = useState<boolean>(false);
  const [customSizeInput, setCustomSizeInput] = useState<string>('50');

  // Current session subset of chosen nouns
  const [sessionNouns, setSessionNouns] = useState<A1Noun[]>([]);
  const [sessionIndex, setSessionIndex] = useState<number>(0);
  
  const [selectedAnswer, setSelectedAnswer] = useState<Gender | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);
  const [sessionStreak, setSessionStreak] = useState<number>(0);

  // Specific Clue visibility inside the Tips panel
  const [showSpecificClue, setShowSpecificClue] = useState<boolean>(true);

  const showTips = progress.showTips ?? true;

  // Active pool based on filter mode
  const fullPool: A1Noun[] = useMemo(() => {
    if (filterMode === 'mistakes') {
      const missedSet = new Set(progress.derDieDas.missedNounIds);
      const missed = A1_NOUNS.filter(n => missedSet.has(n.id));
      return missed.length > 0 ? missed : A1_NOUNS;
    }
    return A1_NOUNS;
  }, [filterMode, progress.derDieDas.missedNounIds]);

  const maxAvailableNouns = fullPool.length;

  // Calculate actual effective batch size based on user choice & availability
  const getEffectiveBatchSize = useCallback(() => {
    let desired = isCustomSize ? (parseInt(customSizeInput, 10) || 50) : sessionTargetSize;
    if (desired < 25 && maxAvailableNouns >= 25) desired = 25;
    if (desired > maxAvailableNouns) desired = maxAvailableNouns;
    return desired;
  }, [isCustomSize, customSizeInput, sessionTargetSize, maxAvailableNouns]);

  // Function to start a fresh session with chosen noun count
  const startSession = useCallback(() => {
    const poolCopy = [...fullPool];
    for (let i = poolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
    }

    const batchCount = getEffectiveBatchSize();
    const selected = poolCopy.slice(0, batchCount);

    setSessionNouns(selected);
    setSessionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setSessionCorrectCount(0);
    setSessionStreak(0);
    setSessionStarted(true);
    setSessionFinished(false);
  }, [fullPool, getEffectiveBatchSize]);

  // Reset when filter mode changes
  useEffect(() => {
    setSessionStarted(false);
    setSessionFinished(false);
  }, [filterMode]);

  const currentNoun: A1Noun | undefined = sessionNouns[sessionIndex];

  // Derive smart guessing clue for the active noun
  const currentClue = useMemo(() => {
    if (!currentNoun) return null;
    return getGuessingClue(currentNoun.noun, currentNoun.ruleTip);
  }, [currentNoun]);

  const handlePronounce = useCallback((withArticle: boolean = false) => {
    if (!currentNoun) return;
    const textToSpeak = withArticle 
      ? `${currentNoun.article} ${currentNoun.noun}`
      : currentNoun.noun;
    speakGerman(textToSpeak, progress.slowAudio ? 0.75 : 0.95);
  }, [currentNoun, progress.slowAudio]);

  const handleToggleTips = () => {
    onUpdateProgress(prev => ({
      ...prev,
      showTips: !prev.showTips,
    }));
  };

  const handleSelectArticle = useCallback((chosen: Gender) => {
    if (isAnswered || !currentNoun) return;

    setSelectedAnswer(chosen);
    setIsAnswered(true);

    const isCorrect = chosen === currentNoun.article;

    if (isCorrect) {
      setSessionCorrectCount(prev => prev + 1);
      const nextStreak = sessionStreak + 1;
      setSessionStreak(nextStreak);

      onUpdateProgress(prev => {
        const missed = prev.derDieDas.missedNounIds.filter(id => id !== currentNoun.id);
        const mastered = prev.derDieDas.masteredNounIds.includes(currentNoun.id)
          ? prev.derDieDas.masteredNounIds
          : [...prev.derDieDas.masteredNounIds, currentNoun.id];

        const globalStreak = prev.derDieDas.streak + 1;
        return {
          ...prev,
          derDieDas: {
            ...prev.derDieDas,
            correct: prev.derDieDas.correct + 1,
            total: prev.derDieDas.total + 1,
            streak: globalStreak,
            bestStreak: Math.max(prev.derDieDas.bestStreak, globalStreak),
            missedNounIds: missed,
            masteredNounIds: mastered,
          }
        };
      });
    } else {
      setSessionStreak(0);
      onUpdateProgress(prev => {
        const missed = prev.derDieDas.missedNounIds.includes(currentNoun.id)
          ? prev.derDieDas.missedNounIds
          : [...prev.derDieDas.missedNounIds, currentNoun.id];

        return {
          ...prev,
          derDieDas: {
            ...prev.derDieDas,
            total: prev.derDieDas.total + 1,
            streak: 0,
            missedNounIds: missed,
          }
        };
      });
    }
  }, [isAnswered, currentNoun, sessionStreak, onUpdateProgress]);

  const handleNext = useCallback(() => {
    if (sessionIndex < sessionNouns.length - 1) {
      setSessionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setSessionFinished(true);
    }
  }, [sessionIndex, sessionNouns.length]);

  // Keyboard controls: 1 = Der, 2 = Die, 3 = Das, Enter = Next / Start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (!sessionStarted || sessionFinished) {
        if (e.key === 'Enter') {
          e.preventDefault();
          startSession();
        }
        return;
      }

      if (!isAnswered) {
        if (e.key === '1' || e.key.toLowerCase() === 'j') {
          handleSelectArticle('der');
        } else if (e.key === '2' || e.key.toLowerCase() === 'k') {
          handleSelectArticle('die');
        } else if (e.key === '3' || e.key.toLowerCase() === 'l') {
          handleSelectArticle('das');
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionStarted, sessionFinished, isAnswered, handleSelectArticle, handleNext, startSession]);

  const isCorrect = selectedAnswer === currentNoun?.article;
  const missedCount = progress.derDieDas.missedNounIds.length;
  const totalInSession = sessionNouns.length;
  const accuracy = sessionIndex > 0 ? Math.round((sessionCorrectCount / (isAnswered ? sessionIndex + 1 : sessionIndex)) * 100) : 0;
  const effectiveBatchCount = getEffectiveBatchSize();

  return (
    <div className="w-full space-y-2.5">
      {/* Top Bar with Modes, Live Stats, Tips Toggle (Full-Width) */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs text-sm">
        {/* Left: Title & Mode */}
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            Der Die Das Trainer
          </span>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({A1_NOUNS.length})
            </button>
            <button
              onClick={() => setFilterMode('mistakes')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                filterMode === 'mistakes'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Review</span>
              <span className="px-1.5 text-[10px] rounded-full bg-rose-100 text-rose-800 font-bold">
                {missedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Center: Session Status & Streak */}
        {sessionStarted && !sessionFinished ? (
          <div className="flex items-center gap-3 font-mono text-xs sm:text-sm text-slate-600">
            <span title="Session Progress">
              Noun: <strong className="text-slate-900">{sessionIndex + 1}</strong> / {totalInSession}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-amber-600 font-bold" title="Current Streak">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              {sessionStreak}
            </span>
            <span className="text-slate-300">|</span>
            <span title="Score in Session">
              Score: <strong className="text-emerald-600 font-bold">{sessionCorrectCount}</strong> / {sessionIndex + (isAnswered ? 1 : 0)}
            </span>
          </div>
        ) : (
          <span className="text-xs sm:text-sm text-slate-600 font-medium">
            Session Size: <strong className="text-slate-800 font-bold">{effectiveBatchCount} Nouns</strong>
          </span>
        )}

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          {sessionStarted && !sessionFinished && (
            <button
              onClick={() => setSessionStarted(false)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
              title="Change session size or restart"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Restart</span>
            </button>
          )}

          {/* Hide/Show Tips Button */}
          <button
            onClick={handleToggleTips}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
              showTips
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={showTips ? 'Hide the tips panel' : 'Show the tips panel'}
          >
            <Lightbulb className={`w-4 h-4 ${showTips ? 'fill-amber-400 text-amber-600' : 'text-slate-400'}`} />
            <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
          </button>

          {/* Rules Guide Button */}
          <button
            onClick={onOpenRulesModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
            title="Full German Grammar Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Full-Width Layout: 30% Tips Left + 70% Right (LOCKED HEIGHT md:h-[480px]) */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch">
        
        {/* LEFT SIDE: TIPS (Desktop Left: order-1; Mobile Bottom: order-2, LOCKED HEIGHT md:h-[480px]) */}
        {showTips && (
          <div className="w-full md:w-[30%] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 flex flex-col justify-between md:h-[480px] animate-in fade-in order-2 md:order-1">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 h-7 shrink-0">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-100" />
                  <span>Tips to Guess Better</span>
                </div>
                <button
                  onClick={handleToggleTips}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Hide Tips
                </button>
              </div>

              {/* DYNAMIC WORD CLUE BOX (STRICTLY FIXED HEIGHT h-[74px]) */}
              <div className="h-[74px] min-h-[74px] max-h-[74px] p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 text-xs sm:text-sm flex flex-col justify-between overflow-hidden shrink-0">
                {sessionStarted && !sessionFinished && currentNoun ? (
                  <>
                    <div className="flex items-center justify-between h-4 shrink-0">
                      <span className="font-bold text-xs flex items-center gap-1 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Clue for "{currentNoun.noun}":
                      </span>
                      <button
                        onClick={() => setShowSpecificClue(prev => !prev)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 px-1.5 py-0.5 rounded transition-colors shrink-0"
                        title={showSpecificClue ? 'Hide the clue' : 'Reveal the clue'}
                      >
                        {showSpecificClue ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Reveal</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="h-[44px] flex items-center overflow-hidden">
                      {showSpecificClue ? (
                        <p className="text-xs leading-snug text-slate-800 line-clamp-2">
                          {currentClue?.clue}
                        </p>
                      ) : (
                        <p className="text-xs italic text-slate-500 line-clamp-2">
                          Clue hidden. Click "Reveal" if you need a hint!
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    <p className="font-bold text-xs flex items-center gap-1 text-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Session Setup
                    </p>
                    <p className="text-xs leading-snug text-slate-600 line-clamp-2">
                      Choose from 25, 50 (default), 100, 200, or enter custom count up to {maxAvailableNouns} nouns.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick-Rule Reference Cheat Cards (No text cut off!) */}
              <div className="space-y-2 text-xs">
                {/* DIE Rules */}
                <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px]">DIE</span>
                    <span className="text-xs font-bold">Feminine Endings:</span>
                  </div>
                  <p className="text-slate-700 leading-snug text-xs">
                    <strong>100%:</strong> -ung, -heit, -keit, -schaft, -ei, -ion, -tät
                  </p>
                  <p className="text-slate-600 leading-snug text-[11px] mt-0.5">
                    <strong>~90%:</strong> Words ending in <em>-e</em> (die Woche, die Schule).
                  </p>
                </div>

                {/* DER Rules */}
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">DER</span>
                    <span className="text-xs font-bold">Masculine Rules:</span>
                  </div>
                  <p className="text-slate-700 leading-snug text-xs">
                    <strong>Calendar:</strong> Days, months, seasons, compass points.
                  </p>
                  <p className="text-slate-600 leading-snug text-[11px] mt-0.5">
                    <strong>Endings:</strong> -or, -ling, -ismus & male roles.
                  </p>
                </div>

                {/* DAS Rules */}
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px]">DAS</span>
                    <span className="text-xs font-bold">Neuter Rules:</span>
                  </div>
                  <p className="text-slate-700 leading-snug text-xs">
                    <strong>Diminutives:</strong> -chen, -lein (das Mädchen).
                  </p>
                  <p className="text-slate-600 leading-snug text-[11px] mt-0.5">
                    <strong>Verbs as Nouns:</strong> <em>das Essen</em> & loans (-ment, -um, -o).
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center pt-1.5 border-t border-slate-100 shrink-0">
              {sessionStarted ? `${totalInSession} Nouns Session` : 'Session Setup'}
            </p>
          </div>
        )}

        {/* RIGHT SIDE: MAIN DRILL CARD (Desktop Right: order-2; Mobile Top: order-1) */}
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 text-center relative overflow-hidden transition-all flex flex-col justify-between min-h-[420px] md:h-[480px] order-1 md:order-2 ${
          showTips ? 'w-full md:w-[70%] flex-1' : 'w-full'
        }`}>
          {/* STATE 1: SESSION SETUP & SIZE PICKER (25, 50 - DEFAULT, 100, 200, OR CUSTOM) */}
          {!sessionStarted ? (
            <div className="my-auto py-1 space-y-3 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
                  <Play className="w-4 h-4 fill-blue-600 ml-0.5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Select Session Length
                </h2>
              </div>

              <p className="text-xs text-slate-500">
                Choose the number of nouns to practice. Default is 50.
              </p>

              {/* Session Size Presets & Custom Option */}
              <div className="space-y-2 pt-0.5">
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 200].map((size) => {
                    const isSelected = !isCustomSize && sessionTargetSize === size;
                    const isDisabled = size > maxAvailableNouns;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setIsCustomSize(false);
                          setSessionTargetSize(size);
                        }}
                        className={`py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          isDisabled
                            ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-black'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold'
                        }`}
                      >
                        <span className="text-base sm:text-lg">{size}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'} font-normal`}>
                          {size === 50 ? 'Default' : 'Nouns'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Option: Min 25 up to max in level */}
                <div className={`p-2 rounded-xl border transition-all ${
                  isCustomSize
                    ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-400'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <label 
                      onClick={() => setIsCustomSize(true)}
                      className="cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-800"
                    >
                      <input
                        type="radio"
                        name="sessionSizeRadio"
                        checked={isCustomSize}
                        onChange={() => setIsCustomSize(true)}
                        className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>Custom Count</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        (Min: 25 &bull; Max: {maxAvailableNouns})
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={Math.min(25, maxAvailableNouns)}
                        max={maxAvailableNouns}
                        value={customSizeInput}
                        onFocus={() => setIsCustomSize(true)}
                        onChange={(e) => {
                          setIsCustomSize(true);
                          setCustomSizeInput(e.target.value);
                        }}
                        className="w-20 px-2 py-0.5 text-sm font-bold text-center rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        placeholder="e.g. 75"
                      />
                      <span className="text-xs text-slate-500 font-medium">nouns</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button with generous spacing */}
              <div className="pt-2">
                <button
                  onClick={startSession}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Session ({effectiveBatchCount} Nouns)</span>
                </button>
              </div>
            </div>
          ) : sessionFinished ? (
            /* STATE 2: SESSION FINISHED SUMMARY */
            <div className="my-auto py-4 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <Award className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900">
                  Session Completed!
                </h2>
                <p className="text-xs text-slate-500">
                  You completed all {totalInSession} nouns in this round.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Correct</span>
                  <strong className="text-xl font-black text-emerald-600">{sessionCorrectCount} / {totalInSession}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Accuracy</span>
                  <strong className="text-xl font-black text-blue-600">
                    {Math.round((sessionCorrectCount / (totalInSession || 1)) * 100)}%
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={startSession}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start Another ({totalInSession})</span>
                </button>
                <button
                  onClick={() => setSessionStarted(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>Change Size</span>
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: ACTIVE DRILL CARD - ROCK SOLID FIXED WORD POSITION */
            <div className="w-full flex flex-col justify-between h-full">
              {/* TOP HEADER: Audio & Shortcuts (Fixed Height h-7) */}
              <div className="w-full h-7 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <button
                  onClick={() => handlePronounce(isAnswered)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  title="Hear German Pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Audio</span>
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {sessionIndex + 1} / {totalInSession}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Shortcuts: <strong>1</strong> Der &bull; <strong>2</strong> Die &bull; <strong>3</strong> Das
                  </span>
                </div>
              </div>

              {/* ANCHORED WORD DISPLAY AREA (FIXED HEIGHT h-[135px] - NEVER SHIFTS!) */}
              <div className="w-full h-[135px] flex flex-col items-center justify-center space-y-1 shrink-0">
                {/* Article Reveal / Placeholder (Fixed h-7) */}
                <div className="h-7 flex items-center justify-center">
                  {isAnswered && currentNoun ? (
                    <span className={`px-3 py-0.5 rounded-lg font-black text-sm tracking-wider text-white shadow-2xs ${
                      currentNoun.article === 'der'
                        ? 'bg-blue-600'
                        : currentNoun.article === 'die'
                        ? 'bg-rose-600'
                        : 'bg-emerald-600'
                    }`}>
                      {currentNoun.article.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-base font-extrabold text-slate-300 tracking-widest">
                      [ ? ]
                    </span>
                  )}
                </div>

                {/* German Noun Heading (Strictly anchored) */}
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {currentNoun?.noun}
                </h2>

                {/* English Translation */}
                <p className="text-sm sm:text-base font-medium text-slate-600">
                  {currentNoun?.english}
                </p>

                {/* Plural Form */}
                <div className="h-4 flex items-center justify-center">
                  {currentNoun?.plural ? (
                    <p className="text-xs text-slate-400 font-mono">
                      Plural: <span className="font-semibold text-slate-600">die {currentNoun.plural.startsWith('-') ? `${currentNoun.noun}${currentNoun.plural}` : currentNoun.plural}</span>
                    </p>
                  ) : (
                    <span className="text-transparent text-xs select-none">No plural</span>
                  )}
                </div>
              </div>

              {/* EXAMPLE SENTENCE FROM CSV (Anchored h-[46px]) */}
              <div className="w-full h-[46px] flex items-center justify-center shrink-0">
                {currentNoun?.exampleDe ? (
                  <div className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 text-left">
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                      <span>🇩🇪</span> {currentNoun.exampleDe}
                    </p>
                    {currentNoun.exampleEn && (
                      <p className="text-slate-500 text-[11px] truncate ml-5">
                        {currentNoun.exampleEn}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-8" />
                )}
              </div>

              {/* ANSWER FEEDBACK ALERT (RESERVED SLOT h-[54px] - NEVER EXPANDS OR MOVES WORD) */}
              <div className="w-full h-[54px] flex items-center justify-center shrink-0">
                {isAnswered && currentNoun ? (
                  <div className={`w-full p-1.5 px-2.5 rounded-xl border text-left text-xs transition-all ${
                    isCorrect 
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50/90 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5 overflow-hidden">
                        <p className="font-bold leading-tight">
                          {isCorrect ? 'Richtig! (Correct!)' : `Falsch! It takes "${currentNoun.article.toUpperCase()}".`}
                        </p>
                        <p className="text-slate-700 text-[11px] leading-tight line-clamp-1">
                          {currentNoun.ruleTip}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Press 1 (Der), 2 (Die), or 3 (Das) to answer
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (FIXED EXACT HEIGHT h-[54px]) */}
              <div className="w-full h-[54px] shrink-0">
                {!isAnswered ? (
                  <div className="grid grid-cols-3 gap-2.5 w-full h-full">
                    {/* DER */}
                    <button
                      onClick={() => handleSelectArticle('der')}
                      className="h-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-sm active:scale-97 transition-all flex flex-col items-center justify-center group"
                    >
                      <span className="text-xl sm:text-2xl tracking-wide leading-none">DER</span>
                      <span className="text-[10px] text-blue-100 font-normal mt-0.5">Masc (1)</span>
                    </button>

                    {/* DIE */}
                    <button
                      onClick={() => handleSelectArticle('die')}
                      className="h-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm active:scale-97 transition-all flex flex-col items-center justify-center group"
                    >
                      <span className="text-xl sm:text-2xl tracking-wide leading-none">DIE</span>
                      <span className="text-[10px] text-rose-100 font-normal mt-0.5">Fem (2)</span>
                    </button>

                    {/* DAS */}
                    <button
                      onClick={() => handleSelectArticle('das')}
                      className="h-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm active:scale-97 transition-all flex flex-col items-center justify-center group"
                    >
                      <span className="text-xl sm:text-2xl tracking-wide leading-none">DAS</span>
                      <span className="text-[10px] text-emerald-100 font-normal mt-0.5">Neut (3)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full h-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                  >
                    <span>{sessionIndex < sessionNouns.length - 1 ? 'Next Noun' : 'Finish Session'}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-xs text-slate-400 font-normal hidden sm:inline">[Enter]</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
