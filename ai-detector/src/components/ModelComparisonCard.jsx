import React from 'react';
import { Cpu, CheckCircle2, Layers, Award, Sparkles, TrendingUp, ShieldAlert, GitMerge } from 'lucide-react';

export default function ModelComparisonCard({ modelComparison, benchmarks = [] }) {
  const heldOut = modelComparison?.heldOutMetrics || {};

  const defaultBenchmarks = [
    {
      approach: 'Sentence Rhythm & Stylometrics',
      purpose: 'Analyzes sentence length diversity, natural burstiness, and clause variation',
      role: 'Stylometric Classifier',
      accuracy: heldOut.stylometric?.accuracy != null
        ? `${(heldOut.stylometric.accuracy * 100).toFixed(1)}%`
        : '59.4%',
      f1: heldOut.stylometric?.roc_auc != null
        ? `AUC ${(heldOut.stylometric.roc_auc * 100).toFixed(1)}%`
        : 'AUC 60.9%',
      status: 'Model 2',
    },
    {
      approach: 'Vocabulary & Phrasing Analysis',
      purpose: 'Detects formulaic word pairings, generative cliches, and repetitive phrasing',
      role: 'Lexical Classifier',
      accuracy: heldOut.lexical_ngram?.accuracy != null
        ? `${(heldOut.lexical_ngram.accuracy * 100).toFixed(1)}%`
        : '65.2%',
      f1: heldOut.lexical_ngram?.roc_auc != null
        ? `AUC ${(heldOut.lexical_ngram.roc_auc * 100).toFixed(1)}%`
        : 'AUC 75.0%',
      status: 'Model 1',
    },
    {
      approach: 'Transition & Flow Dynamics',
      purpose: 'Evaluates sentence-to-sentence connective flow and logical cadence',
      role: 'Contextual Classifier',
      accuracy: heldOut.sequence_context?.accuracy != null
        ? `${(heldOut.sequence_context.accuracy * 100).toFixed(1)}%`
        : '55.4%',
      f1: heldOut.sequence_context?.roc_auc != null
        ? `AUC ${(heldOut.sequence_context.roc_auc * 100).toFixed(1)}%`
        : 'AUC 55.7%',
      status: 'Model 3',
    },
    {
      approach: 'Calibrated Ensemble Consensus',
      purpose: 'Multi-model determination synthesizing vocabulary, rhythm, and flow',
      role: 'Production Ensemble',
      accuracy: heldOut.ensemble?.accuracy != null
        ? `${(heldOut.ensemble.accuracy * 100).toFixed(1)}%`
        : '64.0%',
      f1: heldOut.ensemble?.roc_auc != null
        ? `AUC ${(heldOut.ensemble.roc_auc * 100).toFixed(1)}%`
        : 'AUC 70.4%',
      status: 'Ensemble Decision',
      isChampion: true,
    },
  ];

  const approaches = benchmarks.length > 0 ? benchmarks : defaultBenchmarks;

  const ensembleAcc = heldOut.ensemble?.accuracy != null
    ? `${(heldOut.ensemble.accuracy * 100).toFixed(1)}%`
    : '64.0%';

  return (
    <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5 text-brand-600" />
            <span>Multi-Model AI Detection Architecture</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Linguistic Consensus & Model Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Calibrated evaluation comparing vocabulary, sentence rhythm, and contextual transitions against human and AI text corpora.
          </p>
        </div>

        {/* Champion Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-brand-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-center">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>{ensembleAcc} Multi-Domain Accuracy</span>
        </div>
      </div>

      {/* Real-time Model Vote Breakdown */}
      {modelComparison && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-brand-500" />
              Document Text Consensus Indicators
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Calibrated Total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">1. Sentence Rhythm</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {modelComparison.stylometricScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">Clause Diversity</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">2. Vocabulary & Clichés</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {modelComparison.lexicalScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">Phrasing Predictability</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">3. Transition Flow</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {modelComparison.sequenceScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">Connective Cadence</span>
            </div>

            <div className="p-3 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 ring-1 ring-brand-500/20">
              <span className="text-[10px] text-brand-700 dark:text-brand-300 block font-bold">
                ★ 4. Overall Consensus
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                  {modelComparison.ensembleScore ?? 0}%
                </span>
                <span className="text-[10px] text-brand-600">AI</span>
              </div>
              <span className="text-[10px] text-brand-700/80 dark:text-brand-300/80">Blended Decision</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Evaluation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-navy-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Linguistic Indicator</th>
              <th className="py-3 px-3">Diagnostic Scope</th>
              <th className="py-3 px-3">Evaluation Method</th>
              <th className="py-3 px-3 text-right">Benchmark Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-slate-700 dark:text-slate-300">
            {approaches.map((app, idx) => (
              <tr
                key={idx}
                className={`hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors ${
                  app.isChampion ? 'bg-brand-50/30 dark:bg-brand-950/20 font-semibold' : ''
                }`}
              >
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    {app.isChampion && (
                      <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {app.approach}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                  {app.purpose}
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                    {app.role}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {app.accuracy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
