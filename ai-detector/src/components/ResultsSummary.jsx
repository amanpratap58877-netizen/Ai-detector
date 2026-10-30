import React from 'react';
import {
  FileText,
  Calendar,
  Download,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Layers,
  Percent,
} from 'lucide-react';
import { ScoreDonutChart } from './AnalysisChart';
import ThreeScoreVisualizer from './ThreeScoreVisualizer';

export default function ResultsSummary({
  documentData,
  onNewAnalysis,
  onDownloadReport,
  onViewFullReportModal,
  isDark = false,
}) {
  const {
    name = 'Marketing_Report.docx',
    analysisDate = '2026-10-28 14:23:45',
    fileType = 'DOCX',
    fileSize = '2.4 MB',
    aiPercentage = 32,
    humanPercentage = 68,
    flaggedSectionsCount = 4,
    classification = 'Mixed Content',
    riskLevel = 'Moderate',
    wordCount = 1420,
    sentenceCount = 68,
    decisionBasis = '',
  } = documentData;

  const [downloadMenuOpen, setDownloadMenuOpen] = React.useState(false);
  const [scoreViewMode, setScoreViewMode] = React.useState('3d');
  const downloadRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The label comes from the backend decision (see backend/scoring.py). Only if an old record has no
  // classification do we fall back to the percentage.
  const getClassificationBadge = (label, score) => {
    const text = (label || '').toLowerCase();
    const kind = text.includes('human') ? 'human'
      : /\bai\b/.test(text) ? 'ai'
      : text.includes('mixed') ? 'mixed'
      : score < 25 ? 'human' : score <= 60 ? 'mixed' : 'ai';
    if (kind === 'human') {
      return {
        label: 'Likely Human-Written',
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: ShieldCheck,
      };
    }
    if (kind === 'mixed') {
      return {
        label: 'Mixed Authorship',
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: HelpCircle,
      };
    }
    return {
      label: 'Likely AI-Generated',
      color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      icon: ShieldAlert,
    };
  };

  const badgeInfo = getClassificationBadge(classification, aiPercentage);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="space-y-6">
      {/* Top Results Header Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                {fileType}
              </span>
              <span className="text-xs text-slate-400">{fileSize}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Audited: {analysisDate}
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{sentenceCount} sentences evaluated</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          {/* Download Dropdown */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Download Report</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {downloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownloadReport('txt');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Text Audit Report (.TXT)
                </button>
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownloadReport('csv');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  Sentence Metrics (.CSV)
                </button>
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownloadReport('json');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Full Data Schema (.JSON)
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-navy-800" />
                <button
                  onClick={() => {
                    setDownloadMenuOpen(false);
                    onDownloadReport('print');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  Print / Save as PDF
                </button>
              </div>
            )}
          </div>

          {/* New Analysis Button */}
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid + Donut Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 3D Crystal Visualizer & Donut Chart Card */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              AI Heuristic Signal
            </p>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setScoreViewMode('3d')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  scoreViewMode === '3d'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                3D Orb
              </button>
              <button
                onClick={() => setScoreViewMode('2d')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  scoreViewMode === '2d'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                2D Donut
              </button>
            </div>
          </div>

          {scoreViewMode === '3d' ? (
            <ThreeScoreVisualizer
              aiPercentage={aiPercentage}
              humanPercentage={humanPercentage}
              isDark={isDark}
            />
          ) : (
            <ScoreDonutChart
              aiPercentage={aiPercentage}
              humanPercentage={humanPercentage}
              isDark={isDark}
            />
          )}

          <div className="mt-3 w-full pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">AI: {aiPercentage}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Human: {humanPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: 4 Detailed Metric Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Estimated AI-Like Content */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-800 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Estimated AI-Like Content
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {aiPercentage}%
              </span>
              <span className="text-xs text-slate-400">of scanned sentences</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Based on algorithmic perplexity and sentence burstiness markers.
            </p>
          </div>

          {/* 2. Estimated Human-Like Content */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-800 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Estimated Human-Like Content
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {humanPercentage}%
              </span>
              <span className="text-xs text-slate-400">of scanned sentences</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Demonstrates natural sentence length variance and idiosyncratic syntax.
            </p>
          </div>

          {/* 3. Sections Flagged */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-800 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Sections Flagged
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {flaggedSectionsCount}
              </span>
              <span className="text-xs text-slate-400">out of {documentData.sectionBreakdown?.length || 5} sections</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Sections containing clusters of repeated synthetic phrases.
            </p>
          </div>

          {/* 4. Overall Result */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Overall Audit Result
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badgeInfo.color}`}
              >
                <BadgeIcon className="w-4 h-4" />
                {badgeInfo.label}
              </span>
              {decisionBasis && (
                <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                  <strong>Why: </strong>{decisionBasis}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Risk Assessment:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {riskLevel || 'Moderate'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

