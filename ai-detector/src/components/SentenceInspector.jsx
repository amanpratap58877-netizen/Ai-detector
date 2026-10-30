import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';

export default function SentenceInspector({
  sentence,
  onClose,
  onNext,
  onPrev,
  hasPrev,
  hasNext,
}) {
  const [copied, setCopied] = useState(false);

  if (!sentence) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(sentence.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeConfig = {
    ai: {
      label: 'Potentially AI-Like',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      icon: ShieldAlert,
      metricColor: 'text-amber-600 dark:text-amber-400',
    },
    human: {
      label: 'Likely Human-Written',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      icon: ShieldCheck,
      metricColor: 'text-emerald-600 dark:text-emerald-400',
    },
    uncertain: {
      label: 'Uncertain / Mixed',
      color: 'bg-slate-100 text-slate-800 dark:bg-navy-800 dark:text-slate-300 border-slate-300 dark:border-navy-700',
      icon: HelpCircle,
      metricColor: 'text-slate-600 dark:text-slate-400',
    },
  };

  const currentConfig = badgeConfig[sentence.type] || badgeConfig.uncertain;
  const IconComponent = currentConfig.icon;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white dark:bg-navy-900 shadow-2xl border-l border-slate-200 dark:border-navy-800 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sentence Heuristics</h3>
            <p className="text-[11px] text-slate-400">Syntactic & perplexity audit</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title="Previous sentence"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title="Next sentence"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors ml-1"
            title="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Classification Badge & Confidence Meter */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 space-y-3">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentConfig.color}`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {currentConfig.label}
            </span>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Sample Confidence
              </span>
              <span className={`text-base font-extrabold ${currentConfig.metricColor}`}>
                {sentence.confidence}%
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-navy-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                sentence.type === 'ai'
                  ? 'bg-amber-500'
                  : sentence.type === 'human'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
              style={{ width: `${sentence.confidence}%` }}
            />
          </div>
        </div>

        {/* Selected Sentence Quote Box */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Selected Sentence
            </h4>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-navy-950/80 border border-slate-200/80 dark:border-navy-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif italic relative">
            "{sentence.text}"
          </div>
        </div>

        {/* Heuristic Explanation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Linguistic & Heuristic Analysis
          </h4>
          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {sentence.explanation}
          </div>
        </div>

        {/* Diagnostic Heuristics Sub-signals */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sentence Signal Attributes
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700">
              <span className="text-[10px] text-slate-400 block font-medium">Perplexity Level</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sentence.type === 'ai' ? 'Low / Predictable' : 'High / Organic'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700">
              <span className="text-[10px] text-slate-400 block font-medium">Syntactic Burstiness</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {sentence.type === 'ai' ? 'Uniform Rhythm' : 'Dynamic Variation'}
              </span>
            </div>
          </div>
        </div>

        {/* Mandatory Neutral Disclaimer */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200 dark:border-navy-700/60 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
          <div>
            <strong className="text-slate-700 dark:text-slate-300">Auditor Notice:</strong> Heuristic
            confidence scores reflect probabilistic text patterns and statistical indicators. They
            do not constitute scientific proof of authorship or human generation.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 flex items-center justify-between">
        <span className="text-xs text-slate-400">Sentence ID: {sentence.id}</span>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-navy-800 hover:bg-slate-300 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

