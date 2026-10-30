import React from 'react';
import { Cpu, CheckCircle2, Layers, Award, Sparkles, TrendingUp, ShieldAlert, GitMerge } from 'lucide-react';

export default function ModelComparisonCard({ modelComparison, benchmarks = [] }) {
  const heldOut = modelComparison?.heldOutMetrics || {};

  const defaultBenchmarks = [
    {
      approach: 'Deep Stylometrics & Burstiness',
      purpose: 'Entropy, burstiness, variance, syntax density & lexical richness',
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
      approach: 'N-Gram / Lexical Classifier',
      purpose: 'Word (1-2) and character (3-5) TF-IDF n-gram patterns',
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
      approach: 'Sequence Context & Transitions',
      purpose: 'Sentence-to-sentence transition dynamics & punctuation flow',
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
      approach: 'Calibrated 3-Model Ensemble',
      purpose: 'Probability-calibrated soft-voting fusion across all 3 models',
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
            Approach Benchmark & Ensemble Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trained on open-source Human-vs-AI corpora (HC3, academic datasets, and multi-domain essays).
          </p>
        </div>

        {/* Champion Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-brand-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0 self-start sm:self-center">
          <Award className="w-4 h-4 text-emerald-500" />
          <span>{ensembleAcc} Cross-Domain Held-Out Accuracy</span>
        </div>
      </div>

      {/* Real-time Model Vote Breakdown (if document comparison data available) */}
      {modelComparison && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-brand-500" />
              Document Model Consensus Votes
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Ensemble Weighted Decision
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">1. Stylometrics</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {modelComparison.stylometricScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">Burstiness & Syntax</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">2. N-Gram Lexical</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {modelComparison.lexicalScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">TF-IDF 1-3 Grams</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <span className="text-[10px] text-slate-400 block font-medium">3. Sequence Context</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  {modelComparison.sequenceScore ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400">AI</span>
              </div>
              <span className="text-[10px] text-slate-400">Clause Transitions</span>
            </div>

            <div className="p-3 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 ring-1 ring-brand-500/20">
              <span className="text-[10px] text-brand-700 dark:text-brand-300 block font-bold">
                ★ 4. Ensemble Final
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-brand-600 dark:text-brand-400">
                  {modelComparison.ensembleScore ?? 0}%
                </span>
                <span className="text-[10px] text-brand-600">AI</span>
              </div>
              <span className="text-[10px] text-brand-700/80 dark:text-brand-300/80">Soft-Voting Fusion</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Evaluation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-navy-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Approach</th>
              <th className="py-3 px-3">Purpose & Architecture</th>
              <th className="py-3 px-3">Recommendation</th>
              <th className="py-3 px-3 text-right">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60 text-slate-700 dark:text-slate-300">
            {approaches.map((appr, idx) => {
              const isChamp = appr.isChampion || appr.role?.includes('Recommended');
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isChamp
                      ? 'bg-brand-50/30 dark:bg-brand-950/20 font-medium'
                      : 'hover:bg-slate-50/60 dark:hover:bg-navy-800/30'
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      {isChamp ? (
                        <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-navy-700" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {appr.approach}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                    {appr.purpose || appr.strengths}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isChamp
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-navy-800 dark:text-slate-300'
                      }`}
                    >
                      {appr.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {appr.accuracy}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
