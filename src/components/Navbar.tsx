import React from 'react';
import { 
  ShieldCheck, 
  BookMarked, 
  Puzzle, 
  Search, 
  BarChart3, 
  Volume2, 
  VolumeX, 
  Flame, 
  HelpCircle,
  ChevronDown,
  Sparkles,
  Gauge
} from 'lucide-react';
import { ActiveTool, CEFRLevel } from '../data/types';
import { UserProgress } from '../utils/storage';

interface NavbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  activeLevel: CEFRLevel;
  onOpenLevelModal: () => void;
  onOpenRulesModal: () => void;
  progress: UserProgress;
  onToggleSound: () => void;
  onToggleSlowAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTool,
  onSelectTool,
  activeLevel,
  onOpenLevelModal,
  onOpenRulesModal,
  progress,
  onToggleSound,
  onToggleSlowAudio,
}) => {
  const currentStreak = progress.derDieDas.streak;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-13 gap-2">
          {/* Brand Logo & Level Selector */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTool('articles')}>
              {/* Flag Badge */}
              <div className="flex flex-col w-5 h-4 rounded overflow-hidden shadow-xs border border-slate-300">
                <span className="h-1/3 bg-slate-900 w-full" />
                <span className="h-1/3 bg-red-600 w-full" />
                <span className="h-1/3 bg-amber-400 w-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                  DeutschMeister
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    A1
                  </span>
                </span>
              </div>
            </div>

            {/* CEFR Level Selector Pill */}
            <button
              onClick={onOpenLevelModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
              title="Click to view German Levels Curriculum (A1 to C1)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Level {activeLevel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onSelectTool('articles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTool === 'articles'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Der Die Das
            </button>

            <button
              onClick={() => onSelectTool('vocab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTool === 'vocab'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookMarked className="w-4 h-4 text-indigo-600" />
              Vocabulary
            </button>

            <button
              onClick={() => onSelectTool('sentences')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTool === 'sentences'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Puzzle className="w-4 h-4 text-emerald-600" />
              Sentence Builder
            </button>

            <button
              onClick={() => onSelectTool('dictionary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTool === 'dictionary'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Search className="w-4 h-4 text-purple-600" />
              Dictionary
            </button>

            <button
              onClick={() => onSelectTool('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTool === 'stats'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Progress
            </button>
          </nav>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5">
            {/* Streak Counter */}
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs"
              title={`Current Streak: ${currentStreak} correct in a row!`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{currentStreak}</span>
            </div>

            {/* Grammar Guide Button */}
            <button
              onClick={onOpenRulesModal}
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200/80"
              title="A1 Grammar & Article Rules Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* Speed Toggle (Normal / Slow for beginner clarity) */}
            <button
              onClick={onToggleSlowAudio}
              className={`p-1.5 rounded-lg transition-colors border ${
                progress.slowAudio
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 border-slate-200/80'
              }`}
              title={progress.slowAudio ? 'Audio Speed: Slow (0.75x) for beginners' : 'Audio Speed: Normal (1.0x)'}
            >
              <Gauge className="w-3.5 h-3.5" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg transition-colors border ${
                progress.soundEnabled
                  ? 'text-slate-600 hover:bg-slate-100 border-slate-200/80'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
              title={progress.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
            >
              {progress.soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 overflow-x-auto gap-1 scrollbar-none">
          <button
            onClick={() => onSelectTool('articles')}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              activeTool === 'articles' ? 'text-blue-700 bg-blue-50 font-extrabold' : 'text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>DerDieDas</span>
          </button>
          <button
            onClick={() => onSelectTool('vocab')}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              activeTool === 'vocab' ? 'text-indigo-700 bg-indigo-50 font-extrabold' : 'text-slate-600'
            }`}
          >
            <BookMarked className="w-4 h-4 text-indigo-600" />
            <span>Vocab</span>
          </button>
          <button
            onClick={() => onSelectTool('sentences')}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              activeTool === 'sentences' ? 'text-emerald-700 bg-emerald-50 font-extrabold' : 'text-slate-600'
            }`}
            title="Sentence Builder"
          >
            <Puzzle className="w-4 h-4 text-emerald-600" />
            <span>Sentences</span>
          </button>
          <button
            onClick={() => onSelectTool('dictionary')}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              activeTool === 'dictionary' ? 'text-purple-700 bg-purple-50 font-extrabold' : 'text-slate-600'
            }`}
          >
            <Search className="w-4 h-4 text-purple-600" />
            <span>Dictionary</span>
          </button>
          <button
            onClick={() => onSelectTool('stats')}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
              activeTool === 'stats' ? 'text-amber-700 bg-amber-50 font-extrabold' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Progress</span>
          </button>
        </div>
      </div>
    </header>
  );
};
