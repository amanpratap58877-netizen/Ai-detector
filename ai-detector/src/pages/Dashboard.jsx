import React, { useMemo } from 'react';
import {
  FileText,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileSearch,
  ExternalLink,
  Brain,
  History,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { TrendLineChart, DistributionDonutChart } from '../components/AnalysisChart';
import ThreeNeuralCore from '../components/ThreeNeuralCore';

export default function Dashboard({
  onNavigate,
  records = [],
  onViewRecord,
  isDark = false,
}) {
  // Compute summary stats dynamically from records
  const totalAnalyzed = records.length;
  const avgAiContent = totalAnalyzed > 0
    ? Math.round(records.reduce((acc, r) => acc + (Number(r.aiPercentage) || 0), 0) / totalAnalyzed)
    : 0;
  const reportsGenerated = records.filter((r) => r.status === 'Completed').length;
  const lastRecord = records[0];
  const recentRecords = records.slice(0, 5);

  // Dynamic classification distribution from real user audits
  const humanCount = records.filter(
    (r) => (r.classification && r.classification.toLowerCase().includes('human')) || r.aiPercentage <= 30
  ).length;
  const aiCount = records.filter(
    (r) => (r.classification && r.classification.toLowerCase().includes('ai')) || r.aiPercentage >= 70
  ).length;
  const mixedCount = Math.max(0, totalAnalyzed - humanCount - aiCount);

  const dynamicClassificationDistribution = totalAnalyzed > 0 ? [
    { name: 'Likely Human-Written', value: humanCount, color: '#10b981' },
    { name: 'Mixed / Hybrid', value: mixedCount, color: '#f59e0b' },
    { name: 'Likely AI-Generated', value: aiCount, color: '#ef4444' },
  ].filter((d) => d.value > 0) : [];

  // Dynamic 7-day trend from real user audits
  const dynamicTrendData = useMemo(() => {
    if (!records || records.length === 0) return [];
    const byDay = {};
    records.slice(0, 30).forEach((r) => {
      const rawDate = r.date || r.uploadDate || '';
      const dayKey = rawDate.split(' ')[0] || 'Today';
      if (!byDay[dayKey]) byDay[dayKey] = { sumAi: 0, count: 0 };
      byDay[dayKey].sumAi += Number(r.aiPercentage || 0);
      byDay[dayKey].count += 1;
    });
    return Object.entries(byDay).slice(-7).map(([day, val]) => {
      const avg = Math.round(val.sumAi / val.count);
      return {
        day: day.length > 5 ? day.slice(5) : day,
        avgAi: avg,
        documents: val.count,
        humanRatio: 100 - avg,
      };
    });
  }, [records]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner with 3D Neural Core */}
      <div className="relative overflow-hidden bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-navy-800 shadow-card">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3-Model Calibrated AI Content Detection</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Analyze documents, inspect genuine AI-content probabilities from the 3-model ML ensemble, and review persistent audit reports.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onNavigate('new-analysis')}
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FileSearch className="w-5 h-5" />
                <span>Start New Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('history')}
                className="px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
              >
                Browse Past Audits
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-center">
            <ThreeNeuralCore isDark={isDark} />
          </div>
        </div>
      </div>

      {/* 4 Primary Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Documents Audited"
          value={totalAnalyzed.toString()}
          subtitle="Processed via live 3-model backend"
          icon={FileText}
          badgeText={totalAnalyzed > 0 ? `${totalAnalyzed} stored` : '0 stored'}
          badgeColor="blue"
        />

        <StatCard
          title="Average AI Signal"
          value={totalAnalyzed > 0 ? `${avgAiContent}%` : '—'}
          subtitle={totalAnalyzed > 0 ? 'Across your audit corpus' : 'No audits yet'}
          icon={TrendingUp}
          badgeText={totalAnalyzed > 0 ? (avgAiContent > 50 ? 'Elevated' : 'Moderate') : 'N/A'}
          badgeColor={totalAnalyzed > 0 && avgAiContent > 50 ? 'rose' : 'amber'}
        />

        <StatCard
          title="Audit Reports Ready"
          value={reportsGenerated.toString()}
          subtitle="Available for PDF, CSV & JSON export"
          icon={FileCheck2}
          badgeText="100% verified"
          badgeColor="emerald"
        />

        <StatCard
          title="Latest Audit Status"
          value={lastRecord ? `${lastRecord.aiPercentage}% AI` : 'Ready'}
          subtitle={lastRecord ? lastRecord.name : 'Awaiting first analysis'}
          icon={ShieldCheck}
          badgeText={lastRecord ? lastRecord.classification : 'Idle'}
          badgeColor={lastRecord && lastRecord.aiPercentage > 60 ? 'rose' : 'blue'}
        />
      </div>

      {/* 2 Charts: 7-Day Trend Line Chart & Distribution Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day AI-Content Trends (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Estimated AI-Content Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Average detected algorithmic probability score across recent audits
              </p>
            </div>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-navy-800 px-2.5 py-1 rounded-lg">
              Audit Telemetry
            </span>
          </div>

          {dynamicTrendData.length > 0 ? (
            <TrendLineChart data={dynamicTrendData} isDark={isDark} />
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <History className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
              <span>No audit trend history yet. Upload documents to visualize 7-day AI detection trends.</span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{totalAnalyzed > 0 ? `${totalAnalyzed} user audits recorded` : 'Ready for input'}</span>
            <span>3-Model Calibrated Ensemble</span>
          </div>
        </div>

        {/* Classification Distribution Donut Chart (1 Col) */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Classification Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of documents by author classification
            </p>
          </div>

          {dynamicClassificationDistribution.length > 0 ? (
            <DistributionDonutChart data={dynamicClassificationDistribution} isDark={isDark} />
          ) : (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Brain className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
              <span>No classification distribution yet. Documents will appear here once analyzed.</span>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800/80 text-center">
            <span className="text-[11px] text-slate-400">
              {totalAnalyzed} documents benchmarked
            </span>
          </div>
        </div>
      </div>

      {/* Recent Analyses Table */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Recent Analyses
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest documents processed through live 3-model validation
            </p>
          </div>
          {totalAnalyzed > 0 && (
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({totalAnalyzed})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-navy-800">
                <tr>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">AI Content</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
                {recentRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      {rec.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {rec.fileType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {rec.date || rec.uploadDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={rec.aiPercentage > 60 ? 'text-rose-600' : rec.aiPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'}>
                        {rec.aiPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        rec.aiPercentage > 60
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : rec.aiPercentage > 30
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {rec.classification}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewRecord(rec)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 text-slate-600 dark:text-slate-300 font-semibold text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
            <span>No documents analyzed yet. Click "Start New Analysis" above to audit your first document.</span>
          </div>
        )}
      </div>
    </div>
  );
}
