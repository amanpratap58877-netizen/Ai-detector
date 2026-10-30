import React, { useState } from 'react';
import { Filter, Eye, Sparkles, BookOpen } from 'lucide-react';

export default function HighlightedText({
  paragraphs = [],
  activeSentenceId,
  onSelectSentence,
}) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'ai' | 'human' | 'uncertain'

  // Styling maps for the sentence highlights
  const getHighlightClass = (type, isSelected) => {
    const base = 'inline transition-all duration-150 cursor-pointer rounded px-1.5 py-0.5 mx-0.5 border leading-loose ';

    if (filterType !== 'all' && filterType !== type) {
      return base + 'bg-transparent text-slate-400 dark:text-slate-500 border-transparent opacity-60 hover:opacity-100';
    }

    if (type === 'ai') {
      return (
        base +
        (isSelected
          ? 'bg-amber-300 dark:bg-amber-800 text-amber-950 dark:text-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-400'
          : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300/80 dark:border-amber-800/80')
      );
    }

    if (type === 'human') {
      return (
        base +
        (isSelected
          ? 'bg-emerald-300 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 border-emerald-500 shadow-sm ring-2 ring-emerald-400'
          : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300/80 dark:border-emerald-800/80')
      );
    }

    // Uncertain
    return (
      base +
      (isSelected
        ? 'bg-slate-300 dark:bg-navy-700 text-slate-900 dark:text-slate-100 border-slate-500 shadow-sm ring-2 ring-slate-400'
        : 'bg-slate-100 hover:bg-slate-200 dark:bg-navy-800/60 dark:hover:bg-navy-700/60 text-slate-700 dark:text-slate-300 border-slate-300/80 dark:border-navy-700')
    );
  };

  return (
    <div className="space-y-4">
      {/* Interactive Controls & Legend Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Color Legend */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-brand-500" />
            Legend:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Potentially AI-Like</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Likely Human-Written</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Uncertain / Mixed</span>
          </div>
        </div>

        {/* Highlight Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs">
          <span className="px-2 text-slate-400 flex items-center gap-1 text-[11px] font-medium hidden sm:flex">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('ai')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterType === 'ai'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            AI Signals
          </button>
          <button
            onClick={() => setFilterType('human')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterType === 'human'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Human
          </button>
          <button
            onClick={() => setFilterType('uncertain')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterType === 'uncertain'
                ? 'bg-slate-200 dark:bg-navy-700 text-slate-800 dark:text-slate-200 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Uncertain
          </button>
        </div>
      </div>

      {/* Document Sheet / Reader Paper */}
      <div className="bg-white dark:bg-navy-900/90 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-navy-800 shadow-card paper-sheet">
        <div className="max-w-3xl mx-auto space-y-8">
          {paragraphs.map((p, pIdx) => (
            <div key={pIdx} className="space-y-3">
              {p.sectionTitle && (
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-navy-800/80 pb-2">
                  {p.sectionTitle}
                </h4>
              )}
              <div className="text-slate-800 dark:text-slate-200 font-serif text-base sm:text-lg leading-relaxed">
                {p.sentences.map((sentence) => {
                  const isSelected = activeSentenceId === sentence.id;
                  return (
                    <span
                      key={sentence.id}
                      onClick={() => onSelectSentence(sentence)}
                      className={getHighlightClass(sentence.type, isSelected)}
                      title={`Click to inspect (${sentence.confidence}% confidence)`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectSentence(sentence);
                        }
                      }}
                    >
                      {sentence.text}{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

