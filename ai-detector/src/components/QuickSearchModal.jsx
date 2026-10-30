import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, ArrowRight, X, Sparkles } from 'lucide-react';

export default function QuickSearchModal({
  isOpen,
  onClose,
  records = [],
  onSelectRecord,
  onNewAnalysis,
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = records.filter(
    (r) =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.fileType.toLowerCase().includes(query.toLowerCase()) ||
      r.classification.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-100">
        <div className="p-4 border-b border-slate-100 dark:border-navy-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type document name, format, or tag..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-navy-800 text-slate-400 rounded">
            ESC to close
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 sm:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching audit records found.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectRecord(item);
                  onClose();
                }}
                className="p-3.5 px-4 hover:bg-slate-50 dark:hover:bg-navy-800/60 cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.fileType} • {item.date} • {item.classification}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      item.aiPercentage < 30
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.aiPercentage < 60
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {item.aiPercentage}% AI
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-navy-950/70 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Quick Navigator</span>
          <button
            onClick={() => {
              onClose();
              onNewAnalysis();
            }}
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upload New File
          </button>
        </div>
      </div>
    </div>
  );
}

