import React, { useState } from 'react';
import ResultsSummary from '../components/ResultsSummary';
import HighlightedText from '../components/HighlightedText';
import SentenceInspector from '../components/SentenceInspector';
import SectionBreakdownChart from '../components/SectionBreakdownChart';
import ModelComparisonCard from '../components/ModelComparisonCard';
import CreativeAuditReport from '../components/CreativeAuditReport';
import Modal from '../components/Modal';
import {
  FileText,
  BarChart3,
  Layers,
  Sparkles,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  FileCheck,
} from 'lucide-react';
import {
  downloadTextReport,
  downloadCsvReport,
  downloadJsonReport,
  printFormattedReport,
} from '../utils/reportDownload';

export default function AnalysisResults({
  documentData,
  onNewAnalysis,
  onNotify,
  isDark = false,
}) {
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [fullReportModalOpen, setFullReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'creative-report'

  if (!documentData) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
          No document selected for inspection.
        </h3>
        <button
          onClick={onNewAnalysis}
          className="mt-4 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          Start New Analysis
        </button>
      </div>
    );
  }

  // Flatten sentences for next/prev inspector navigation
  const allSentences = (documentData.paragraphs || []).flatMap((p) => p.sentences || []);
  const currentSentenceIndex = selectedSentence
    ? allSentences.findIndex((s) => s.id === selectedSentence.id)
    : -1;

  const handleNextSentence = () => {
    if (currentSentenceIndex < allSentences.length - 1) {
      setSelectedSentence(allSentences[currentSentenceIndex + 1]);
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setSelectedSentence(allSentences[currentSentenceIndex - 1]);
    }
  };

  const handleDownload = (type) => {
    try {
      if (type === 'txt') {
        downloadTextReport(documentData);
        onNotify('success', 'Text Report Downloaded', `${documentData.name} text audit saved.`);
      } else if (type === 'csv') {
        downloadCsvReport(documentData);
        onNotify('success', 'CSV Export Ready', `Sentence-by-sentence dataset saved.`);
      } else if (type === 'json') {
        downloadJsonReport(documentData);
        onNotify('success', 'JSON Exported', 'Full schema exported as JSON.');
      } else if (type === 'print') {
        printFormattedReport();
      }
    } catch (err) {
      onNotify('error', 'Download Failed', 'Could not generate report file.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Creative View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Analysis Results & Verification Suite
            </h3>
            <p className="text-xs text-slate-400">
              {documentData.name} • {documentData.aiPercentage}% AI Estimated
            </p>
          </div>
        </div>

        {/* View Mode Toggle Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-navy-800 text-xs self-start sm:self-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interactive 3D Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('creative-report')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeTab === 'creative-report'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Creative Audit Report</span>
          </button>
        </div>
      </div>

      {/* Conditionally render Creative Report View OR Interactive Dashboard View */}
      {activeTab === 'creative-report' ? (
        <CreativeAuditReport
          documentData={documentData}
          onDownload={handleDownload}
          isDark={isDark}
          onNotify={onNotify}
        />
      ) : (
        <>
          {/* Top Results Overview & Summary Cards */}
          <ResultsSummary
            documentData={documentData}
            onNewAnalysis={onNewAnalysis}
            onDownloadReport={handleDownload}
            onViewFullReportModal={() => setFullReportModalOpen(true)}
            isDark={isDark}
          />

          {/* Model Benchmark & Comparison Architecture */}
          <ModelComparisonCard
            modelComparison={documentData.modelComparison}
            benchmarks={documentData.modelComparison?.benchmarks}
          />

          {/* Horizontal Section Breakdown Chart Section */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Section-by-Section AI Content Breakdown
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparative signal distribution across detected document chapters and headings
                </p>
              </div>

              <button
                onClick={() => setActiveTab('creative-report')}
                className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 text-xs font-bold transition-colors self-start sm:self-center flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>Open Creative Report</span>
              </button>
            </div>

            <SectionBreakdownChart
              sections={documentData.sectionBreakdown}
              isDark={isDark}
            />
          </div>

          {/* Main Document Content Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Document Content Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click on any highlighted sentence to inspect confidence heuristics, burstiness, and syntactic notes.
                </p>
              </div>
            </div>

            {/* Interactive Highlighted Document Text Preview */}
            <HighlightedText
              paragraphs={documentData.paragraphs}
              activeSentenceId={selectedSentence?.id}
              onSelectSentence={(sentence) => setSelectedSentence(sentence)}
            />
          </div>

          {/* Sentence Inspector Side Drawer */}
          <SentenceInspector
            sentence={selectedSentence}
            onClose={() => setSelectedSentence(null)}
            onNext={handleNextSentence}
            onPrev={handlePrevSentence}
            hasNext={currentSentenceIndex < allSentences.length - 1}
            hasPrev={currentSentenceIndex > 0}
          />
        </>
      )}

      {/* Full Report Detail Modal */}
      {fullReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <CreativeAuditReport
              documentData={documentData}
              onClose={() => setFullReportModalOpen(false)}
              onDownload={handleDownload}
              isDark={isDark}
              onNotify={onNotify}
            />
          </div>
        </div>
      )}
    </div>
  );
}
