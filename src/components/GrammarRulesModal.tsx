import React, { useState } from 'react';
import { X, BookOpen, Sparkles, HelpCircle, Check, Compass, Calendar, Layers } from 'lucide-react';

interface GrammarRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrammarRulesModal: React.FC<GrammarRulesModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'articles' | 'sentences'>('articles');

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
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">German A1 Grammar Guide</h2>
              <p className="text-xs text-slate-400">Golden rules for Articles (Der/Die/Das) & Word Order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-2">
          <button
            onClick={() => setTab('articles')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'articles'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Der Die Das Rules
          </button>
          <button
            onClick={() => setTab('sentences')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              tab === 'sentences'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-500" />
            German Word Order (V2 Rule)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {tab === 'articles' ? (
            <div className="space-y-6">
              {/* DER */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-sm rounded-lg shadow-xs">
                    DER
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Masculine Nouns</h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p><strong>Days, Months & Seasons:</strong> der Montag, der Sonntag, der Januar, der Sommer, der Herbst.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p><strong>Times of Day & Compass:</strong> der Morgen, der Abend, der Mittag, der Norden, der Osten (<em>Exception: die Nacht</em>).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p><strong>Male Persons & Professions:</strong> der Mann, der Vater, der Arzt, der Kellner, der Lehrer.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p><strong>Noun Endings:</strong> -or (der Motor, der Doktor), -ling (der Lehrling), -ismus (der Tourismus), -er (many tool/agent nouns: der Computer, der Drucker).</p>
                  </div>
                </div>
              </div>

              {/* DIE */}
              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-rose-600 text-white font-extrabold text-sm rounded-lg shadow-xs">
                    DIE
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Feminine Nouns</h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p><strong>The Golden Suffixes (100% Guaranteed):</strong> -ung (die Rechnung, die Wohnung, die Einladung), -heit (die Gesundheit, die Wahrheit), -keit (die Möglichkeit, die Sehenswürdigkeit), -schaft (die Freundschaft), -ei (die Bäckerei).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p><strong>Foreign Loan Suffixes:</strong> -ion (die Information, die Station), -tät (die Universität), -ik (die Musik).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p><strong>Female Persons:</strong> die Frau, die Mutter, die Ärztin, die Lehrerin, die Tochter.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p><strong>Nouns ending in -e (~90%):</strong> die Woche, die Sekunde, die Minute, die Karte, die Schule, die Tasche, die Sonne, die Küche.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <p><strong>All Plural Nouns:</strong> In the plural nominative, EVERY German noun uses <em>die</em> (die Kinder, die Bücher, die Tage)!</p>
                  </div>
                </div>
              </div>

              {/* DAS */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-sm rounded-lg shadow-xs">
                    DAS
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Neuter Nouns</h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p><strong>Diminutives:</strong> Nouns ending in -chen or -lein (das Mädchen, das Brötchen, das Hähnchen).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p><strong>Verbs Turned into Nouns:</strong> das Essen (eating/food), das Leben (life), das Schwimmen (swimming), das Trinken.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p><strong>Young Beings:</strong> das Baby, das Kind.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p><strong>Loan words ending in -ment, -um, -o:</strong> das Apartment, das Dokument, das Datum, das Zentrum, das Auto, das Kino, das Foto, das Radio.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* V2 RULE */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-mono">Rule 1</span>
                  The Golden V2 Rule (Verb in Second Position)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  In a standard German statement, the <strong>conjugated verb is strictly the second element</strong> in the sentence. If you start with time or place instead of the subject, the subject moves after the verb (Inversion)!
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200 font-mono">
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="text-slate-500 font-sans text-xs mb-1">Standard SVO:</p>
                    <p><strong>Ich</strong> <span className="text-blue-600 underline">fahre</span> morgen nach Berlin.</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="text-slate-500 font-sans text-xs mb-1">Inversion (Time first):</p>
                    <p><strong>Morgen</strong> <span className="text-blue-600 underline">fahre</span> ich nach Berlin.</p>
                  </div>
                </div>
              </div>

              {/* SEPARABLE VERBS */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-xs rounded font-mono">Rule 2</span>
                  Separable Verbs (Trennbare Verben)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Verbs with prefixes like <em>ab-, an-, auf-, aus-, ein-, mit-, zu-, zurück-</em> split! The verb stem takes position 2, and the prefix travels all the way to the <strong>very end</strong> of the sentence.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs">
                  <p className="text-slate-500 font-sans text-xs mb-1">Verb: <strong>abfahren</strong> (to depart)</p>
                  <p>Der Zug <span className="text-blue-600 font-bold">fährt</span> um 12 Uhr <span className="text-rose-600 font-bold underline">ab</span>.</p>
                </div>
              </div>

              {/* MODAL VERBS */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded font-mono">Rule 3</span>
                  Modal Verbs (Verb Bracket / Satzklammer)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  When using modal verbs (<em>können, müssen, dürfen, wollen, sollen, möchten</em>), conjugate the modal verb in <strong>position 2</strong>, and place the main verb in its raw <strong>infinitive form at the very end</strong>.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs">
                  <p>Ich <span className="text-emerald-600 font-bold">muss</span> morgen früh <span className="text-blue-600 font-bold underline">aufstehen</span>.</p>
                  <p className="text-slate-500 font-sans mt-1">"I have to get up early tomorrow."</p>
                </div>
              </div>

              {/* QUESTIONS */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded font-mono">Rule 4</span>
                  Asking Questions in German
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <p><strong>1. W-Fragen (Open questions):</strong> Question word (Wann, Wo, Wie, Warum, Was) at Position 1 + Verb at Position 2.</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border border-slate-200">
                    <span className="text-amber-600 font-bold">Wann</span> <span className="text-blue-600 font-bold">kommt</span> der Bus?
                  </p>
                  <p><strong>2. Ja/Nein Fragen (Yes/No questions):</strong> The conjugated verb starts at Position 1!</p>
                  <p className="text-xs font-mono bg-white p-2 rounded border border-slate-200">
                    <span className="text-blue-600 font-bold">Kommst</span> du mit ins Kino?
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
