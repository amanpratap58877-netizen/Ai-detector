import React, { useState } from 'react';
import UploadDropzone from '../components/UploadDropzone';
import {
  ShieldCheck,
  Sparkles,
  FileText,
  CheckCircle2,
  AlignLeft,
  Send,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { analyzeDocumentFile, analyzeRawText } from '../api/client';

const MIN_WORDS = 50;
const MAX_WORDS = 1000;

const SAMPLE_HUMAN_ESSAY = `In recent decades, urban planning has increasingly recognized the critical importance of walkable neighborhoods. When residents can easily walk to local groceries, public transit hubs, parks, and schools, community well-being noticeably improves. Active transportation reduces reliance on personal automobiles, thereby mitigating urban air pollution and lowering household carbon footprints. Moreover, street-level foot traffic nurtures local small businesses, creating vibrant commercial corridors where residents regularly interact. To foster such environments, municipal planners must prioritize pedestrian infrastructure, including continuous shaded sidewalks, protected bike lanes, and mixed-use zoning policies.`;

const SAMPLE_AI_ESSAY = `Artificial intelligence is rapidly revolutionizing the landscape of modern enterprise operations. By leveraging cutting-edge machine learning algorithms, organizations can seamlessly streamline complex workflows and maximize scalable efficiency. Furthermore, predictive data analytics plays a pivotal role in fostering innovation, enabling proactive decision-making across multifaceted business domains. In addition, automated language models provide a comprehensive approach to customer engagement, delivering unprecedented responsiveness and personalized interactions. In conclusion, harnessing these transformative technologies is essential for modern enterprises to navigate the complexities of an ever-evolving global economy and maintain a competitive advantage.`;

export default function NewAnalysis({ onAnalysisComplete }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Paste text state
  const [pastedTitle, setPastedTitle] = useState('Draft Essay');
  const [pastedText, setPastedText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [fileError, setFileError] = useState('');

  // Live word metrics for 50-1000 words range
  const wordTokens = pastedText.trim() ? pastedText.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = wordTokens.length;
  const charCount = pastedText.length;
  const isBelowMin = wordCount > 0 && wordCount < MIN_WORDS;
  const isAboveMax = wordCount > MAX_WORDS;
  const isValidWordRange = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;

  const startAnalysis = async (fileInfo, rawFile) => {
    setFileError('');
    setIsAnalyzing(true);
    setProgressPercent(20);
    setProgressStep('Uploading document to Python 3-model backend...');

    try {
      setProgressPercent(45);
      setProgressStep('Extracting text and running 3-model analysis...');

      // Call Python backend
      const result = await analyzeDocumentFile(rawFile);

      setProgressPercent(90);
      setProgressStep('Calibrating probabilities & storing audit...');

      setTimeout(() => {
        setProgressPercent(100);
        setProgressStep('Analysis complete! Opening report...');
        setTimeout(() => {
          setIsAnalyzing(false);
          onAnalysisComplete(result);
        }, 200);
      }, 300);
    } catch (err) {
      console.warn('Analysis failed:', err);
      setIsAnalyzing(false);
      setProgressPercent(0);
      setFileError(err.message || 'The analysis service could not process this file.');
    }
  };

  const handleAnalyzePastedText = async () => {
    if (wordCount < MIN_WORDS) {
      setPasteError(
        wordCount === 0
          ? 'Please enter text to evaluate. Minimum text length is 50 words.'
          : `Text is too short (${wordCount} words). A minimum of 50 words is required to calculate sentence length variance, burstiness (CV), and Shannon entropy.`
      );
      return;
    }

    if (wordCount > MAX_WORDS) {
      setPasteError(
        `Text exceeds the 1,000-word limit (${wordCount.toLocaleString()} words). For larger manuscripts, please upload as a document file (PDF or DOCX).`
      );
      return;
    }

    setPasteError('');
    setIsAnalyzing(true);
    setProgressPercent(25);
    setProgressStep('Tokenizing document and calculating sentence burstiness...');

    try {
      const result = await analyzeRawText(pastedTitle || 'Pasted Draft', pastedText);
      setProgressPercent(85);
      setProgressStep('Writing sentence vectors and audit trail to MySQL...');

      setTimeout(() => {
        setProgressPercent(100);
        setProgressStep('Complete! Loading results...');
        setTimeout(() => {
          setIsAnalyzing(false);
          onAnalysisComplete(result);
        }, 300);
      }, 400);
    } catch (err) {
      // Never invent a result: show the real reason instead.
      console.warn('Text analysis failed:', err);
      setIsAnalyzing(false);
      setProgressPercent(0);
      setPasteError(err.message || 'The analysis service could not process this text.');
    }
  };

  const handleLoadSample = (sampleType) => {
    setPasteError('');
    if (sampleType === 'human') {
      setPastedTitle('Urban Infrastructure & Walkability Essay');
      setPastedText(SAMPLE_HUMAN_ESSAY);
    } else if (sampleType === 'ai') {
      setPastedTitle('Enterprise Generative AI Transformation Brief');
      setPastedText(SAMPLE_AI_ESSAY);
    } else if (sampleType === 'clear') {
      setPastedTitle('');
      setPastedText('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            New Document Analysis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze documents using Python NLP heuristics and persist audit trails in MySQL.
          </p>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl self-start sm:self-center text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Paste Raw Text</span>
          </button>
        </div>
      </div>

      {activeTab === 'upload' && fileError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>{fileError}</span>
        </div>
      )}

      {activeTab === 'upload' ? (
        /* Upload Mode */
        <UploadDropzone
          onStartAnalysis={startAnalysis}
          isAnalyzing={isAnalyzing}
          progressStep={progressStep}
          progressPercent={progressPercent}
        />
      ) : (
        /* Paste Raw Text Mode (50 - 1000 words) */
        <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-navy-800 shadow-card space-y-5">
          {/* Range Specification & Pipeline Telemetry */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-100">Direct Text Inspection: </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">50 – 1,000 words</span>
                <span className="text-slate-400 dark:text-slate-500 hidden sm:inline"> • Evaluates sentence burstiness CV & Shannon entropy</span>
              </div>
            </div>

            {/* Quick Sample Text Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleLoadSample('human')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
                title="Load a verified human-written sample essay (85 words)"
              >
                🎓 Human Sample (85w)
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('ai')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
                title="Load a generative AI synthetic sample (87 words)"
              >
                🤖 AI Sample (87w)
              </button>
              {pastedText && (
                <button
                  type="button"
                  onClick={() => handleLoadSample('clear')}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
                  title="Clear text"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g. Economics Research Paper Draft"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Paste Content to Inspect (50 – 1,000 words)
              </label>
              <span className="text-[11px] text-slate-400">
                {charCount.toLocaleString()} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => {
                setPastedText(e.target.value);
                if (pasteError) setPasteError('');
              }}
              placeholder="Paste any article, student essay, manuscript, or text here (minimum 50 words, maximum 1,000 words) to run real sentence-by-sentence burstiness and perplexity heuristics..."
              className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 leading-relaxed font-serif transition-colors ${
                isBelowMin
                  ? 'border-amber-300 dark:border-amber-800 focus:ring-amber-500'
                  : isAboveMax
                  ? 'border-rose-400 dark:border-rose-800 focus:ring-rose-500'
                  : isValidWordRange
                  ? 'border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500'
                  : 'border-slate-200 dark:border-navy-700 focus:ring-brand-500'
              }`}
            />
          </div>

          {/* Interactive Word Counter Meter & Verification Gauge */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-navy-800/40 border border-slate-200/60 dark:border-navy-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {wordCount === 0 ? (
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    0 / 1,000 words
                  </span>
                ) : isBelowMin ? (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{wordCount} / 1,000 words</span>
                    <span className="font-normal text-[11px] text-amber-700 dark:text-amber-300">
                      ({MIN_WORDS - wordCount} more needed to meet 50-word minimum)
                    </span>
                  </span>
                ) : isValidWordRange ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{wordCount.toLocaleString()} / 1,000 words</span>
                    <span className="font-normal text-[11px] text-emerald-700 dark:text-emerald-300">
                      (Optimal range for statistical ensemble audit)
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{wordCount.toLocaleString()} / 1,000 words</span>
                    <span className="font-normal text-[11px] text-rose-700 dark:text-rose-300">
                      (Exceeds limit by {(wordCount - MAX_WORDS).toLocaleString()} words)
                    </span>
                  </span>
                )}
              </div>

              {/* Requirement Checkpoints */}
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                    wordCount >= MIN_WORDS
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-navy-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {wordCount >= MIN_WORDS && <Check className="w-3 h-3" />}
                  Min: 50w
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                    wordCount <= MAX_WORDS
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {wordCount <= MAX_WORDS && <Check className="w-3 h-3" />}
                  Max: 1,000w
                </span>
                {wordCount > 0 && (
                  <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                    ~{Math.max(1, Math.ceil(wordCount / 200))} min read
                  </span>
                )}
              </div>
            </div>

            {/* Visual Word Meter Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-navy-700 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  wordCount === 0
                    ? 'w-0'
                    : isBelowMin
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : isAboveMax
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`}
                style={{
                  width:
                    wordCount === 0
                      ? '0%'
                      : isBelowMin
                      ? `${Math.min(100, Math.max(8, (wordCount / MIN_WORDS) * 100))}%`
                      : isAboveMax
                      ? '100%'
                      : `${Math.min(100, Math.max(10, ((wordCount - MIN_WORDS) / (MAX_WORDS - MIN_WORDS)) * 100))}%`
                }}
              />
            </div>
          </div>

          {pasteError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{pasteError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {wordCount >= MIN_WORDS && wordCount <= MAX_WORDS ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Ready for analysis ({wordCount} words)
                </span>
              ) : isBelowMin ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Please add {MIN_WORDS - wordCount} more words to reach minimum length.
                </span>
              ) : isAboveMax ? (
                <span className="text-rose-600 dark:text-rose-400">
                  Exceeds 1,000 words. Please switch to file upload.
                </span>
              ) : (
                <span>Provide 50 to 1,000 words for statistical heuristic audit.</span>
              )}
            </span>

            <button
              onClick={handleAnalyzePastedText}
              disabled={isAnalyzing || !isValidWordRange}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Analyze Text via Python Core</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Information Cards / Audit Heuristics Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-2.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Python Statistical Engine
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Evaluates coefficient of variation (CV) of sentence lengths and token Shannon entropy in Python.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            MySQL Database Storage
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Every sentence vector, confidence metric, and audit record is persisted in MySQL tables with relational schemas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Multi-Format Parsing
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Directly extracts text from PDF pages and DOCX paragraphs via Python byte streams.
          </p>
        </div>
      </div>
    </div>
  );
}
