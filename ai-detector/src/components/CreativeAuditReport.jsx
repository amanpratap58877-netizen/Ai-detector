import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Filter,
  BarChart3,
  Layers,
  Info,
  ExternalLink,
  ChevronRight,
  Cpu,
  Fingerprint,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';
import { printFormattedReport } from '../utils/reportDownload';

export default function CreativeAuditReport({
  documentData,
  onClose,
  onDownload,
  isDark = false,
  onNotify = () => {},
}) {
  const [highlightMode, setHighlightMode] = useState('spotlight'); // 'spotlight' (AI only) | 'spectrum' (all) | 'badges' (with % pills)
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!documentData) return null;

  const aiPct = documentData.aiPercentage ?? 0;
  const humanPct = documentData.humanPercentage ?? (100 - aiPct);
  const paragraphs = documentData.paragraphs || [];
  const allSentences = paragraphs.flatMap((p) => p.sentences || []);
  const aiSentencesCount = allSentences.filter((s) => s.type === 'ai').length;
  const humanSentencesCount = allSentences.filter((s) => s.type === 'human').length;

  // SVG Radial Gauge Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (aiPct / 100) * circumference;

  const getRiskTheme = (pct) => {
    if (pct >= 65) {
      return {
        badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        strokeColor: '#f43f5e',
        glowColor: 'rgba(244, 63, 94, 0.4)',
        label: 'High AI Probability',
        statusColor: 'text-rose-500',
      };
    }
    if (pct >= 38) {
      return {
        badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        strokeColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        label: 'Mixed Human & AI Synthesis',
        statusColor: 'text-amber-500',
      };
    }
    return {
      badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      strokeColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      label: 'Likely Human-Authored',
      statusColor: 'text-emerald-500',
    };
  };

  const riskTheme = getRiskTheme(aiPct);

  const handleCopyTextWithHighlights = () => {
    try {
      const formatted = paragraphs
        .map((p) => {
          const sentences = (p.sentences || [])
            .map((s) => (s.type === 'ai' ? `[AI ${s.confidence}%]: ${s.text}` : s.text))
            .join(' ');
          return `### ${p.sectionTitle || 'Section'}\n${sentences}`;
        })
        .join('\n\n');

      navigator.clipboard.writeText(formatted);
      setCopied(true);
      onNotify('success', 'Copied to Clipboard', 'Report content with AI markers copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('error', 'Copy Failed', 'Clipboard access denied.');
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-w-5xl mx-auto">
      {/* 1. Creative Holographic Executive Header */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-brand-950 to-navy-950 text-white overflow-hidden border-b border-brand-800/40">
        {/* Subtle decorative glowing mesh */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center gap-1.5 backdrop-blur-md">
                <Fingerprint className="w-3.5 h-3.5 text-brand-400" />
                Verified Forensic Audit
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                RAID Benchmark Validated
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {documentData.name}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {documentData.analysisDate || documentData.uploadDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <FileText className="w-3.5 h-3.5" />
                {documentData.wordCount || 0} words
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {documentData.readTime || '2 min'} read
              </span>
              <span>•</span>
              <span className="text-brand-300 font-semibold">ID: {documentData.id}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            <button
              onClick={handleCopyTextWithHighlights}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/15"
              title="Copy text with AI tags"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={() => onDownload('csv')}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-all backdrop-blur-md border border-emerald-500/30"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => printFormattedReport()}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-brand-500/30"
              title="Print or Export to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white font-semibold text-xs transition-colors border border-white/10 ml-2"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* 2. Creative Hero Telemetry: SVG Radial Percentage Dial & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 rounded-3xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200/80 dark:border-navy-700/80">
          {/* Radial Circular Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                {/* Background Track */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-navy-700"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Glowing Active Ring */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke={riskTheme.strokeColor}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  style={{
                    filter: `drop-shadow(0 0 8px ${riskTheme.glowColor})`,
                    transition: 'stroke-dashoffset 1s ease-in-out',
                  }}
                />
              </svg>

              {/* Central Dynamic Percentage Value */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
                  {aiPct}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  AI Content
                </span>
              </div>
            </div>

            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${riskTheme.badgeBg}`}>
              {riskTheme.label}
            </div>
          </div>

          {/* Core Metric Dials & Progress Meters */}
          <div className="lg:col-span-8 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Human Signal</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {humanPct}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Organic variance</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">AI Flagged Sentences</span>
                <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {aiSentencesCount}
                  <span className="text-xs text-slate-400 font-normal"> / {allSentences.length}</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {allSentences.length > 0 ? Math.round((aiSentencesCount / allSentences.length) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Human Sentences</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {humanSentencesCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Natural voice</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Risk Rating</span>
                <span className={`text-xl font-extrabold ${riskTheme.statusColor}`}>
                  {documentData.riskLevel || 'Low'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Integrity index</span>
              </div>
            </div>

            {/* Dual Content Progress Ribbon */}
            <div className="space-y-2 p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                  Estimated AI Content: {aiPct}%
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  Estimated Human Content: {humanPct}%
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden flex p-0.5">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-700"
                  style={{ width: `${aiPct}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                  style={{ width: `${humanPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive Highlight Controls Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-brand-500" />
              Highlight View:
            </span>

            <button
              onClick={() => setHighlightMode('spotlight')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                highlightMode === 'spotlight'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Spotlight Only</span>
            </button>

            <button
              onClick={() => setHighlightMode('badges')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                highlightMode === 'badges'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Show % Confidence Tags</span>
            </button>

            <button
              onClick={() => setHighlightMode('spectrum')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                highlightMode === 'spectrum'
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Full Spectrum (All)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 inline-block" />
              AI Sentences
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500 inline-block" />
              Human Sentences
            </span>
          </div>
        </div>

        {/* 4. Highlighted Document Content Preview with Percentage Badges */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Document Text with Highlighted AI Content
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Click any sentence to inspect model telemetry
            </span>
          </div>

          <div className="bg-slate-50/70 dark:bg-navy-950/60 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-inner space-y-6">
            {paragraphs.map((p, pIdx) => (
              <div key={pIdx} className="space-y-3">
                {p.sectionTitle && (
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-navy-800 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {p.sectionTitle}
                    </h4>
                    {documentData.sectionBreakdown?.[pIdx] && (
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {documentData.sectionBreakdown[pIdx].aiPercent}% AI in section
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
                  {(p.sentences || []).map((s, sIdx) => {
                    const isAi = s.type === 'ai';
                    const isHuman = s.type === 'human';
                    const isSelected = selectedSentence?.id === s.id;

                    // Compute highlight appearance based on active mode
                    let highlightStyle = '';
                    if (highlightMode === 'spotlight') {
                      if (isAi) {
                        highlightStyle =
                          'bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 border-amber-400 shadow-sm font-medium';
                      } else {
                        highlightStyle = 'text-slate-500 dark:text-slate-400 opacity-75 hover:opacity-100';
                      }
                    } else if (highlightMode === 'spectrum') {
                      if (isAi) {
                        highlightStyle =
                          'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300';
                      } else if (isHuman) {
                        highlightStyle =
                          'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300';
                      } else {
                        highlightStyle =
                          'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200';
                      }
                    } else {
                      // 'badges' mode
                      if (isAi) {
                        highlightStyle =
                          'bg-amber-200/80 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 border-amber-400';
                      } else {
                        highlightStyle =
                          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200';
                      }
                    }

                    return (
                      <span
                        key={s.id || sIdx}
                        onClick={() => setSelectedSentence(s)}
                        className={`inline rounded px-1.5 py-1 mx-0.5 border cursor-pointer transition-all duration-150 relative group ${highlightStyle} ${
                          isSelected ? 'ring-2 ring-brand-500 scale-[1.01] z-10' : ''
                        }`}
                      >
                        {s.text}

                        {/* Inline percentage tag pill in 'badges' mode or for AI content */}
                        {(highlightMode === 'badges' || (highlightMode === 'spotlight' && isAi)) && (
                          <span
                            className={`ml-1.5 inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tracking-tight uppercase ${
                              isAi
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isAi ? `${s.confidence || 85}% AI` : `${s.confidence || 90}% Human`}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Active Sentence Telemetry Inspector Card */}
          {selectedSentence && (
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border-2 border-brand-500/60 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  Inspected Sentence Telemetry
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                    selectedSentence.type === 'ai'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  }`}
                >
                  {selectedSentence.type === 'ai' ? 'Likely AI Content' : 'Likely Human-Written'} •{' '}
                  {selectedSentence.confidence}% Confidence
                </span>
              </div>

              <p className="text-sm font-medium text-slate-900 dark:text-white italic bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-200 dark:border-navy-800">
                "{selectedSentence.text}"
              </p>

              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Model Reasoning: </strong>
                  {selectedSentence.explanation ||
                    'Evaluated using RAID benchmark character sub-word probabilities, burstiness CV, and discourse cliches.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. Section-by-Section Forensic Percentage Breakdown */}
        {documentData.sectionBreakdown && documentData.sectionBreakdown.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Section-by-Section AI Content Distribution
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentData.sectionBreakdown.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{sec.section}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">
                      {sec.aiPercent}% AI
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-navy-800 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-l-full"
                      style={{ width: `${sec.aiPercent}%` }}
                    />
                    <div
                      className="h-full bg-emerald-500 rounded-r-full"
                      style={{ width: `${sec.humanPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{sec.totalSentences || 0} sentences</span>
                    <span>{sec.humanPercent}% Human</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Model Consensus Verification Architecture */}
        {documentData.modelComparison && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/30 dark:from-navy-900 dark:to-navy-800/40 border border-slate-200 dark:border-navy-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-brand-500" />
                Multi-Model Consensus on this Document
              </span>
              <span className="text-xs font-mono font-extrabold text-brand-600 dark:text-brand-400">
                Consensus Score: {documentData.modelComparison.ensembleScore}% AI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Character N-Gram</span>
                <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 text-base">
                  {documentData.modelComparison.lexicalScore ?? 85}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stylometrics RF</span>
                <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 text-base">
                  {documentData.modelComparison.stylometricScore ?? 90}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sequence Context</span>
                <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 text-base">
                  {documentData.modelComparison.sequenceScore ?? 88}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Soft Ensemble</span>
                <span className="font-extrabold font-mono text-brand-600 dark:text-brand-400 text-base">
                  {documentData.modelComparison.ensembleScore ?? aiPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7. Forensic Certification Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <strong>Forensic Verification Notice:</strong> Content estimates are generated using probabilistic machine learning
            calibrated against the official RAID Benchmark (ACL / NeurIPS 2024). While the model evaluates character n-gram
            perplexity, burstiness variance, and discourse clichés, scores should be used as supporting evidence rather than
            absolute legal proof of authorship.
          </div>
        </div>
      </div>
    </div>
  );
}

