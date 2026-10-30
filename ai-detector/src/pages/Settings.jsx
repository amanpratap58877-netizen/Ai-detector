import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  Sliders,
  RotateCcw,
  Shield,
  Info,
  Check,
  Code,
  Terminal,
  LogOut,
  Mail,
  Database
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Settings({
  theme,
  setTheme,
  onResetData,
  onNotify,
  user,
  onLogout,
}) {
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Interface preferences saved in state
  const [autoInspect, setAutoInspect] = useState(() => {
    return localStorage.getItem('ai_pref_autoinspect') !== 'false';
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('ai_pref_contrast') === 'true';
  });
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  const handleToggleAutoInspect = () => {
    const next = !autoInspect;
    setAutoInspect(next);
    localStorage.setItem('ai_pref_autoinspect', String(next));
    onNotify('info', 'Preference Updated', `Auto-open sentence inspector is now ${next ? 'enabled' : 'disabled'}.`);
  };

  const handleToggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('ai_pref_contrast', String(next));
    onNotify('info', 'Preference Updated', `Contrast enhancement ${next ? 'applied' : 'reset'}.`);
  };

  const handleConfirmReset = () => {
    onResetData();
    setResetModalOpen(false);
    onNotify('success', 'Reset Complete', 'Default workspace documents and metrics restored.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            System & Interface Settings
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize theme preferences, audit visualization sensitivity, and manage workspace datasets.
        </p>
      </div>

      {/* 0. Account Profile (MySQL Validated) */}
      {user && (
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  MySQL Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {user.role} • {user.organization || 'Enterprise Audit Studio'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* 1. Appearance / Theme */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Appearance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your preferred display theme for document reviewing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Light Theme Card */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              theme === 'light'
                ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-navy-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</p>
                <p className="text-xs text-slate-500">Clean paper white background</p>
              </div>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-brand-600" />}
          </div>

          {/* Dark Theme Card */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
              theme === 'dark'
                ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                : 'border-slate-200 dark:border-navy-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-slate-500">Deep navy low-strain contrast</p>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-brand-600" />}
          </div>
        </div>
      </div>

      {/* 2. Interface Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit Interface Preferences</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fine-tune interactive behaviors when reviewing document paragraphs.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800/80">
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Auto-Open Sentence Inspector on Select
              </p>
              <p className="text-[11px] text-slate-500">
                Immediately slides out the detailed heuristic drawer when clicking highlighted text.
              </p>
            </div>
            <button
              onClick={handleToggleAutoInspect}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoInspect ? 'bg-brand-600' : 'bg-slate-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  autoInspect ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Enhanced Highlight Contrast Borders
              </p>
              <p className="text-[11px] text-slate-500">
                Outlines sentence blocks with distinct accessibility borders for color-blind viewers.
              </p>
            </div>
            <button
              onClick={handleToggleHighContrast}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                highContrast ? 'bg-brand-600' : 'bg-slate-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Notification Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control system notifications and audit activity alerts.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-navy-800/80">
          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Scan Completion In-App Toast
              </p>
              <p className="text-[11px] text-slate-500">
                Display popover alert when document audit concludes.
              </p>
            </div>
            <button
              onClick={() => setNotifyOnComplete(!notifyOnComplete)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notifyOnComplete ? 'bg-brand-600' : 'bg-slate-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  notifyOnComplete ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Weekly Audit Summary Digests
              </p>
              <p className="text-[11px] text-slate-500">
                Generate notification digests summarizing aggregated AI probability percentages.
              </p>
            </div>
            <button
              onClick={() => setNotifyDigest(!notifyDigest)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notifyDigest ? 'bg-brand-600' : 'bg-slate-300 dark:bg-navy-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  notifyDigest ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Production Engine Architecture & Tech Stack */}
      <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            AI-DETECTOR Production Architecture
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enterprise document intelligence, multi-tier ML ensemble & relational audit engine.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong>Core Architecture:</strong> Powered by an asynchronous Python NLP detection engine connecting directly to MySQL Server 8.0 for permanent sentence-level vector persistence and historical reporting.
          </p>
          <p>
            <strong>Ensemble ML Heuristics:</strong> Features sub-word character N-gram classification, a 28-dimensional stylometric random forest, and sequence cohesion models calibrated on the RAID benchmark (accuracy depends on the training data; see backend/models/model_meta_v2.json after retraining).
          </p>
        </div>

        <div className="pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Technology Stack
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {['Python 3.12', 'FastAPI', 'Scikit-Learn', 'MySQL 8.0', 'React 18', 'Vite 6', 'Tailwind CSS', 'Three.js Quantum Sphere'].map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-navy-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 font-mono text-[11px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Reset Workspace Cache Action */}
      <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
            Reset Workspace Cache
          </h4>
          <p className="text-xs text-rose-700/80 dark:text-rose-300/70 mt-0.5">
            Refreshes local audit documents, alerts, and metrics back to initial clean state.
          </p>
        </div>

        <button
          onClick={() => setResetModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 self-start sm:self-center"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Cache</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Confirm Cache Reset"
        subtitle="Refresh local audit documents and session cache back to initial state."
        footer={
          <>
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReset}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
            >
              Confirm Reset
            </button>
          </>
        }
      >
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          This will reset the analysis history table, reports library, and notifications back to the predefined sample set
          (including <code className="font-mono text-brand-600">Marketing_Report.docx</code> and academic papers).
        </div>
      </Modal>
    </div>
  );
}

