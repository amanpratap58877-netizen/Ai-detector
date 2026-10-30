import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck2,
  AlertCircle,
  FileText,
  X,
  Play,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { validateFile, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../utils/fileValidation';

export default function UploadDropzone({ onStartAnalysis, isAnalyzing, progressStep, progressPercent }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileValidationResult, setFileValidationResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    const result = validateFile(file);
    setFileValidationResult(result);

    if (result.valid) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeClick = () => {
    if (!fileValidationResult || !fileValidationResult.valid) return;
    onStartAnalysis(fileValidationResult.fileInfo, selectedFile);
  };

  return (
    <div className="space-y-6">
      {/* Production Engine Telemetry Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/50 text-brand-900 dark:text-brand-200 text-xs">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-brand-600 dark:text-brand-400" />
        <div className="leading-relaxed">
          <span className="font-semibold">AI-DETECTOR Production Engine:</span> Document files up to 10 MB and text passages are processed by the calibrated 3-model ML ensemble (character/word n-grams, deep stylometrics, and sequence context) with probability calibration and persistent reporting.
        </div>
      </div>

      {/* Main Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 ${
          dragOver
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 hover:border-slate-400 dark:hover:border-navy-600'
        } ${isAnalyzing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.rtf,.ppt,.pptx"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />

        {!selectedFile ? (
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Upload a document to analyze
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Drag and drop your file here, or select a document from your computer to run live 3-model AI-content audits.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Choose Document
            </button>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Accepted:</span>
              {ALLOWED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-[10px]"
                >
                  {ext}
                </span>
              ))}
              <span className="ml-1 text-slate-400">(Max 10 MB)</span>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-xs">
                {selectedFile.name}
              </h4>
              <button
                type="button"
                onClick={handleClearFile}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {fileValidationResult?.fileInfo?.sizeFormatted} &bull; Ready for 3-model extraction
            </p>

            {/* Analysis Action Button */}
            {!isAnalyzing ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-navy-800"
                >
                  Change File
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeClick}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute 3-Model Audit</span>
                </button>
              </div>
            ) : (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                    {progressStep || 'Running heuristic pipeline...'}
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Error Message */}
        {fileValidationResult && !fileValidationResult.valid && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileValidationResult.error}</span>
          </div>
        )}
      </div>

      {/* Detection Pipeline Info Banner */}
      <div className="pt-2">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-left">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Honest Multi-Tier AI Detection
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every analysis executes the real three-model ensemble: (1) Sub-word character and word n-gram frequency classifier, (2) 28-dimensional deep stylometrics and burstiness model, and (3) 18-dimensional sequence context and transition dynamics model. Passages are analyzed with 3-sentence sliding windows and calibrated against held-out benchmark thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}
