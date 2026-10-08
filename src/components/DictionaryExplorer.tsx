import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Volume2, 
  Star, 
  BookOpen, 
  MessageSquare,
  Sparkles,
  X
} from 'lucide-react';
import { A1Item, Category, Gender } from '../data/types';
import { A1_ITEMS } from '../data/a1Data';
import { UserProgress } from '../utils/storage';
import { speakGerman } from '../utils/audio';

interface DictionaryExplorerProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
}

export const DictionaryExplorer: React.FC<DictionaryExplorerProps> = ({
  progress,
  onUpdateProgress,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | Gender>('all');
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  // Compute exact counts for all sections dynamically
  const sectionCounts = useMemo(() => {
    const counts = {
      all: A1_ITEMS.length,
      nouns: 0,
      verbs: 0,
      adjectives: 0,
      numbers: 0,
      time_calendar: 0,
      phrases_idioms: 0,
      der: 0,
      die: 0,
      das: 0,
    };

    for (const item of A1_ITEMS) {
      if (item.category === 'nouns') counts.nouns++;
      else if (item.category === 'verbs') counts.verbs++;
      else if (item.category === 'adjectives') counts.adjectives++;
      else if (item.category === 'numbers') counts.numbers++;
      else if (item.category === 'time_calendar') counts.time_calendar++;
      else if (item.category === 'phrases_idioms') counts.phrases_idioms++;

      if (item.gender === 'der') counts.der++;
      else if (item.gender === 'die') counts.die++;
      else if (item.gender === 'das') counts.das++;
    }

    return counts;
  }, []);

  // Filter items: SEARCH ON WORDS ONLY (German / English headwords, NOT sentences)
  const filtered = useMemo(() => {
    let list = A1_ITEMS;

    if (selectedCategory !== 'all') {
      list = list.filter(item => item.category === selectedCategory);
    }

    if (selectedGender !== 'all') {
      list = list.filter(item => item.gender === selectedGender);
    }

    if (onlySaved) {
      const savedSet = new Set(progress.vocab.bookmarkedIds);
      list = list.filter(item => savedSet.has(item.id));
    }

    // SEARCH ON WORDS ONLY as explicitly requested
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(item =>
        item.german.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q)
      );
    }

    return list;
  }, [query, selectedCategory, selectedGender, onlySaved, progress.vocab.bookmarkedIds]);

  // Extract sentences associated with the matched words
  const sentencesList = useMemo(() => {
    return filtered.filter(item => Boolean(item.sentenceDe));
  }, [filtered]);

  const handleToggleBookmark = (id: string) => {
    onUpdateProgress(prev => {
      const exists = prev.vocab.bookmarkedIds.includes(id);
      const nextBookmarks = exists
        ? prev.vocab.bookmarkedIds.filter(item => item !== id)
        : [...prev.vocab.bookmarkedIds, id];
      return {
        ...prev,
        vocab: {
          ...prev.vocab,
          bookmarkedIds: nextBookmarks
        }
      };
    });
  };

  const handlePronounce = (text: string) => {
    speakGerman(text, progress.slowAudio ? 0.75 : 0.95);
  };

  return (
    <div className="w-full space-y-2">
      {/* Top Header & Search Bar (Full-Width) */}
      <div className="w-full bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <h1 className="font-extrabold text-slate-900 text-sm">
              A1 Dictionary Explorer
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
              {A1_ITEMS.length} Words Total
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Showing: <strong>{filtered.length}</strong> words &bull; <strong>{sentencesList.length}</strong> sentences
          </div>
        </div>

        {/* Search Input: Searches Headwords Only */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search word in German or English (e.g. 'Bahnhof', 'ticket', 'arbeiten')..."
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section Counts on ALL Categories */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({sectionCounts.all})
          </button>
          <button
            onClick={() => setSelectedCategory('nouns')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'nouns'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Nouns ({sectionCounts.nouns})
          </button>
          <button
            onClick={() => setSelectedCategory('verbs')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'verbs'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Verbs ({sectionCounts.verbs})
          </button>
          <button
            onClick={() => setSelectedCategory('adjectives')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'adjectives'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Adjectives ({sectionCounts.adjectives})
          </button>
          <button
            onClick={() => setSelectedCategory('numbers')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'numbers'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Numbers ({sectionCounts.numbers})
          </button>
          <button
            onClick={() => setSelectedCategory('time_calendar')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'time_calendar'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Time & Dates ({sectionCounts.time_calendar})
          </button>
          <button
            onClick={() => setSelectedCategory('phrases_idioms')}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border ${
              selectedCategory === 'phrases_idioms'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Phrases ({sectionCounts.phrases_idioms})
          </button>

          <div className="h-3.5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Gender Counts */}
          <button
            onClick={() => setSelectedGender(selectedGender === 'der' ? 'all' : 'der')}
            className={`px-2 py-0.5 font-extrabold rounded-md transition-all border text-[10px] ${
              selectedGender === 'der'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            DER ({sectionCounts.der})
          </button>
          <button
            onClick={() => setSelectedGender(selectedGender === 'die' ? 'all' : 'die')}
            className={`px-2 py-0.5 font-extrabold rounded-md transition-all border text-[10px] ${
              selectedGender === 'die'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            DIE ({sectionCounts.die})
          </button>
          <button
            onClick={() => setSelectedGender(selectedGender === 'das' ? 'all' : 'das')}
            className={`px-2 py-0.5 font-extrabold rounded-md transition-all border text-[10px] ${
              selectedGender === 'das'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            DAS ({sectionCounts.das})
          </button>

          {/* Bookmark toggle */}
          <button
            onClick={() => setOnlySaved(prev => !prev)}
            className={`px-2.5 py-1 font-bold rounded-lg transition-all border flex items-center gap-1 ml-auto text-[11px] ${
              onlySaved
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-50 text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Star className={`w-3 h-3 ${onlySaved ? 'fill-white' : 'fill-amber-400'}`} />
            <span>Saved ({progress.vocab.bookmarkedIds.length})</span>
          </button>
        </div>
      </div>

      {/* EXACT 50% - 50% SPLIT VIEW (LEFT: WORDS RESULTS, RIGHT: SENTENCES RESULTS) */}
      <div className="w-full flex flex-col md:flex-row gap-3 items-stretch">
        
        {/* LEFT 50%: WORD SEARCH RESULTS (GERMAN / ENGLISH) */}
        <div className="w-full md:w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Word Results (German / English)</span>
            </h2>
            <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
              {filtered.length} Words
            </span>
          </div>

          <div className="max-h-[580px] overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No matching words found for "{query}".
              </div>
            ) : (
              filtered.map((item) => {
                const isBookmarked = progress.vocab.bookmarkedIds.includes(item.id);
                const isSelected = activeWordId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveWordId(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        {item.gender ? (
                          <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase text-white ${
                            item.gender === 'der'
                              ? 'bg-blue-600'
                              : item.gender === 'die'
                              ? 'bg-rose-600'
                              : 'bg-emerald-600'
                          }`}>
                            {item.gender}
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 capitalize">
                            {item.category.replace('_', ' ')}
                          </span>
                        )}

                        <h3 className="font-bold text-slate-900 text-sm">
                          {item.german}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600">
                        {item.english}
                      </p>

                      {item.plural && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Plural: die {item.plural.startsWith('-') ? `${item.nounClean || ''}${item.plural}` : item.plural}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePronounce(item.german)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                        title="Save word"
                      >
                        <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT 50%: SENTENCES RESULTS CORRESPONDING TO SEARCH */}
        <div className="w-full md:w-1/2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Sentence Results</span>
            </h2>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              {sentencesList.length} Sentences
            </span>
          </div>

          <div className="max-h-[580px] overflow-y-auto space-y-2 pr-1">
            {sentencesList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No sentences found for the active filter.
              </div>
            ) : (
              sentencesList.map((item) => {
                const isSelected = activeWordId === item.id;

                return (
                  <div
                    key={`sent_${item.id}`}
                    className={`p-3 rounded-xl border text-xs transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-400'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                        From word: <strong>{item.german}</strong> ({item.english})
                      </span>
                      <button
                        onClick={() => handlePronounce(item.sentenceDe!)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-white transition-colors"
                        title="Listen to sentence"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                      🇩🇪 "{item.sentenceDe}"
                    </p>

                    {item.sentenceEn && (
                      <p className="text-slate-500 text-[11px] italic">
                        🇬🇧 "{item.sentenceEn}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
