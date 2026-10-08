import React from 'react';
import { 
  BarChart3, 
  Flame, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  BookMarked, 
  Puzzle, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserProgress, defaultProgress } from '../utils/storage';
import { A1_ITEMS, A1_NOUNS, A1_SENTENCES } from '../data/a1Data';
import { ActiveTool } from '../data/types';

interface StatsOverviewProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onSelectTool: (tool: ActiveTool) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  progress,
  onUpdateProgress,
  onSelectTool,
}) => {
  const derTotal = progress.derDieDas.total;
  const derCorrect = progress.derDieDas.correct;
  const derAccuracy = derTotal > 0 ? Math.round((derCorrect / derTotal) * 100) : 0;
  const masteredNounsCount = progress.derDieDas.masteredNounIds.length;
  const missedNounsCount = progress.derDieDas.missedNounIds.length;

  const vocabMasteredCount = progress.vocab.masteredIds.length;
  const vocabSavedCount = progress.vocab.bookmarkedIds.length;
  const sentencesCompletedCount = progress.sentences.completedIds.length;

  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all training stats and streaks?')) {
      onUpdateProgress(() => defaultProgress);
    }
  };

  const a1Competencies = [
    {
      title: 'Noun Genders & Plurals',
      desc: 'Recognizing der/die/das and irregular plural markers',
      progress: Math.min(100, Math.round((masteredNounsCount / 50) * 100)),
      status: masteredNounsCount >= 30 ? 'proficient' : 'in_progress',
    },
    {
      title: 'V2 Word Order & Syntax',
      desc: 'Placing conjugated verb strictly in 2nd position in main clauses',
      progress: Math.min(100, Math.round((sentencesCompletedCount / 30) * 100)),
      status: sentencesCompletedCount >= 20 ? 'proficient' : 'in_progress',
    },
    {
      title: 'Separable & Modal Verbs',
      desc: 'Splitting prefix to the end and sending infinitive to the coda',
      progress: Math.min(100, Math.round((sentencesCompletedCount / 20) * 100)),
      status: sentencesCompletedCount >= 15 ? 'proficient' : 'in_progress',
    },
    {
      title: 'Core Everyday Vocabulary',
      desc: 'Numbers, clock times, directions, shopping and travel expressions',
      progress: Math.min(100, Math.round((vocabMasteredCount / 60) * 100)),
      status: vocabMasteredCount >= 40 ? 'proficient' : 'in_progress',
    },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Top Banner */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Learning Analytics & Mastery
            </h1>
            <p className="text-[11px] text-slate-500">
              Live statistics across Articles, Vocabulary, and Syntax
            </p>
          </div>
        </div>

        <button
          onClick={handleResetProgress}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3 Core Pillar Cards */}
      <div className="grid sm:grid-cols-3 gap-2.5">
        {/* Der Die Das */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                {derAccuracy}% Acc
              </span>
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Der Die Das</h2>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <p>Drills: <strong>{derTotal}</strong></p>
              <p>Best Streak: <strong className="text-amber-600">{progress.derDieDas.bestStreak}</strong></p>
              <p>To review: <strong className="text-rose-600">{missedNounsCount}</strong></p>
            </div>
          </div>
          <button
            onClick={() => onSelectTool('articles')}
            className="mt-3 w-full py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            Practice <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Vocabulary */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BookMarked className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                {vocabMasteredCount} Mastered
              </span>
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Vocabulary</h2>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <p>Total Words: <strong>{A1_ITEMS.length}</strong></p>
              <p>Saved Words: <strong>{vocabSavedCount}</strong></p>
              <p>Tested: <strong>{progress.vocab.testedCount}</strong></p>
            </div>
          </div>
          <button
            onClick={() => onSelectTool('vocab')}
            className="mt-3 w-full py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            Practice <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Sentences */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Puzzle className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                {sentencesCompletedCount} Solved
              </span>
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Sentence Builder</h2>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <p>Total Sentences: <strong>{A1_SENTENCES.length}</strong></p>
              <p>Best Streak: <strong className="text-amber-600">{progress.sentences.bestStreak}</strong></p>
              <p>Completed: <strong>{sentencesCompletedCount}</strong></p>
            </div>
          </div>
          <button
            onClick={() => onSelectTool('sentences')}
            className="mt-3 w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            Practice <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* CEFR Level A1 Competency Checklist */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>CEFR Level A1 Competency Checklist</span>
          </h2>
          <span className="text-[11px] text-slate-400">Milestones</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-2">
          {a1Competencies.map((comp, idx) => (
            <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-semibold text-slate-800">{comp.title}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  comp.status === 'proficient' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {comp.progress}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${comp.status === 'proficient' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${comp.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
