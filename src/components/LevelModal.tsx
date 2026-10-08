import React from 'react';
import { X, CheckCircle, Clock, Award, BookOpen, ArrowRight } from 'lucide-react';
import { CEFRLevel } from '../data/types';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLevel: CEFRLevel;
  onSelectLevel: (lvl: CEFRLevel) => void;
}

interface LevelInfo {
  level: CEFRLevel;
  name: string;
  germanTitle: string;
  status: 'active' | 'coming_soon';
  description: string;
  vocabTarget: string;
  keySkills: string[];
}

const LEVELS: LevelInfo[] = [
  {
    level: 'A1',
    name: 'Beginner / Breakthrough',
    germanTitle: 'Einstieg (Gegenwärtig aktiv)',
    status: 'active',
    description: 'Understand and use familiar everyday expressions and basic phrases aimed at the satisfaction of needs of a concrete type.',
    vocabTarget: '965+ curated words & phrases (loaded)',
    keySkills: [
      'Master German noun genders (der, die, das) and plurals',
      'V2 Word Order rule in main clauses',
      'Separable verbs in present tense (fährt... ab, ruft... an)',
      'Numbers 1–1,000,000, time, dates, and calendar terms',
      'Modal verbs: können, müssen, dürfen, wollen, möchten',
      'Basic everyday dialogues: food, shopping, travel & train station',
    ],
  },
  {
    level: 'A2',
    name: 'Elementary / Waystage',
    germanTitle: 'Grundlegende Kenntnisse',
    status: 'coming_soon',
    description: 'Understand sentences and frequently used expressions related to areas of most immediate relevance (personal info, local geography, employment).',
    vocabTarget: '~1,800 words',
    keySkills: [
      'Past tense: Perfekt with haben/sein & Präteritum basics',
      'Subordinate clauses with "weil", "dass", "wenn"',
      'Dative & Accusative two-way prepositions (Wechselpräpositionen)',
      'Comparative and superlative adjectives',
    ],
  },
  {
    level: 'B1',
    name: 'Intermediate / Threshold',
    germanTitle: 'Selbstständige Sprachverwendung',
    status: 'coming_soon',
    description: 'Understand main points of clear standard input on familiar matters. Deal with most situations likely to arise whilst travelling.',
    vocabTarget: '~3,000 words',
    keySkills: [
      'Konjunktiv II for polite wishes and hypothetical statements',
      'Passive voice (Passiv)',
      'Relative clauses (Relativsätze)',
      'Complex connectors (obwohl, trotzdem, während)',
    ],
  },
  {
    level: 'B2',
    name: 'Upper Intermediate / Vantage',
    germanTitle: 'Gute Mittelstufe',
    status: 'coming_soon',
    description: 'Understand the main ideas of complex text on concrete and abstract topics, including technical discussions in own field.',
    vocabTarget: '~5,000 words',
    keySkills: [
      'Advanced subjunctive and indirect speech',
      'Participle constructions & nominal style',
      'Nuanced idioms & idiomatic prepositional verbs',
    ],
  },
  {
    level: 'C1',
    name: 'Advanced / Effective Operational',
    germanTitle: 'Fachkundige Sprachkenntnisse',
    status: 'coming_soon',
    description: 'Understand a wide range of demanding, longer texts, and recognise implicit meaning. Express ideas fluently without obvious searching.',
    vocabTarget: '~8,000+ words',
    keySkills: [
      'Academic and professional discourse',
      'Stylistic subtleties and irony',
      'Sophisticated rhetorical syntax',
    ],
  },
];

export const LevelModal: React.FC<LevelModalProps> = ({
  isOpen,
  onClose,
  activeLevel,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-t-2xl border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">CEFR German Levels Curriculum</h2>
              <p className="text-xs text-slate-400">Current Focus: Level A1 (Foundations & Core Grammar)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Level A1 is currently fully unlocked & active!</p>
              <p className="text-xs text-amber-800 mt-1">
                You have access to 965+ authentic A1 vocabulary entries, 413 Der/Die/Das noun drills, and 815 sentence building challenges from the official Goethe/Telc A1 standard. Subsequent levels (A2, B1, etc.) will unlock as you master A1 foundations!
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {LEVELS.map((lvl) => {
              const isCurrent = lvl.level === activeLevel;
              const isLocked = lvl.status === 'coming_soon';

              return (
                <div
                  key={lvl.level}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600/30'
                      : isLocked
                      ? 'border-slate-200 bg-slate-50/60 opacity-80'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-sm font-extrabold rounded-lg ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {lvl.level}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                          {lvl.name}
                          <span className="text-xs font-normal text-slate-500">({lvl.germanTitle})</span>
                        </h3>
                        <span className="text-xs font-medium text-slate-500">{lvl.vocabTarget}</span>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active Course
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-600 bg-slate-200/80 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Roadmap
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{lvl.description}</p>

                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Competencies:</p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {lvl.keySkills.map((skill, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700">All tools currently set to Level A1</span>
                      <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Continue Training <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
