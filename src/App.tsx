/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DerDieDasTrainer } from './components/DerDieDasTrainer';
import { VocabularyPractice } from './components/VocabularyPractice';
import { SentenceBuilder } from './components/SentenceBuilder';
import { DictionaryExplorer } from './components/DictionaryExplorer';
import { StatsOverview } from './components/StatsOverview';
import { LevelModal } from './components/LevelModal';
import { GrammarRulesModal } from './components/GrammarRulesModal';
import { ActiveTool, CEFRLevel } from './data/types';
import { UserProgress, loadProgress, saveProgress } from './utils/storage';
import { A1_ITEMS, A1_NOUNS, A1_SENTENCES } from './data/a1Data';
import { 
  ShieldCheck, 
  BookMarked, 
  Puzzle, 
  Search, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('articles');
  const [activeLevel, setActiveLevel] = useState<CEFRLevel>('A1');
  const [isLevelModalOpen, setIsLevelModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  // Save progress whenever it updates
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleUpdateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  };

  const handleToggleSound = () => {
    handleUpdateProgress(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleToggleSlowAudio = () => {
    handleUpdateProgress(prev => ({
      ...prev,
      slowAudio: !prev.slowAudio,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 w-full overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        activeLevel={activeLevel}
        onOpenLevelModal={() => setIsLevelModalOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        progress={progress}
        onToggleSound={handleToggleSound}
        onToggleSlowAudio={handleToggleSlowAudio}
      />

      {/* Main Full-Width Content Viewport */}
      <main className="flex-1 w-full px-2 sm:px-4 py-2 flex flex-col">
        {activeTool === 'articles' && (
          <DerDieDasTrainer
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        )}

        {activeTool === 'vocab' && (
          <VocabularyPractice
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onSelectTool={setActiveTool}
          />
        )}

        {activeTool === 'sentences' && (
          <SentenceBuilder
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        )}

        {activeTool === 'dictionary' && (
          <DictionaryExplorer
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
          />
        )}

        {activeTool === 'stats' && (
          <StatsOverview
            progress={progress}
            onUpdateProgress={handleUpdateProgress}
            onSelectTool={setActiveTool}
          />
        )}
      </main>

      {/* Slim Status Bar / Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/90 py-1.5 text-[11px] text-slate-500 w-full">
        <div className="w-full px-3 sm:px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">DeutschMeister A1</span>
            <span>&bull;</span>
            <span>Goethe / Telc A1 Standard</span>
            <span>&bull;</span>
            <span className="text-emerald-700 font-medium">{A1_ITEMS.length} CSV Records Loaded</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Grammar Guide
            </button>
            <button
              onClick={() => setIsLevelModalOpen(true)}
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Curriculum (A1–C1)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LevelModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        activeLevel={activeLevel}
        onSelectLevel={setActiveLevel}
      />

      <GrammarRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
