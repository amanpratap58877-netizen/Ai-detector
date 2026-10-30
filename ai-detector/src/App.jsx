import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Modal from './components/Modal';
import QuickSearchModal from './components/QuickSearchModal';
import ThreeBackgroundParticles from './components/ThreeBackgroundParticles';

// Pages
import Dashboard from './pages/Dashboard';
import NewAnalysis from './pages/NewAnalysis';
import AnalysisResults from './pages/AnalysisResults';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Hooks & Data
import { useTheme } from './hooks/useTheme';
import {
  INITIAL_NOTIFICATIONS,
  DEFAULT_DETAILED_DOCUMENT,
  INITIAL_HISTORY_RECORDS,
} from './data/mockData';
import {
  fetchDocuments,
  deleteDocumentApi,
  checkBackendHealth,
  fetchDocumentById,
  getStoredAuth,
  fetchCurrentUser,
  clearStoredAuth,
  logoutUser
} from './api/client';
import { logoutFirebase } from './config/firebase';

export default function App() {
  const { theme, setTheme, toggleTheme } = useTheme();

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const { user } = getStoredAuth();
    return user || null;
  });
  const [authChecked, setAuthChecked] = useState(false);

  // App Navigation & Selected Document State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeDocument, setActiveDocument] = useState(DEFAULT_DETAILED_DOCUMENT);

  // History / Reports / Documents records
  const [records, setRecords] = useState(INITIAL_HISTORY_RECORDS);

  // Notifications State
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // UI Drawer & Collapse States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  // Load this user's records whenever the signed-in user changes (login / logout / switch account)
  const userId = currentUser?.id || null;
  useEffect(() => {
    // Always drop the previous user's data first
    setRecords(INITIAL_HISTORY_RECORDS);
    setActiveDocument(DEFAULT_DETAILED_DOCUMENT);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentPage('dashboard');
    if (!userId) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const health = await checkBackendHealth();
        if (!health.online) return;
        const serverDocs = await fetchDocuments();
        if (!cancelled) {
          setRecords(Array.isArray(serverDocs) && serverDocs.length > 0 ? serverDocs : INITIAL_HISTORY_RECORDS);
        }
      } catch (e) {
        console.warn('Could not load history:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // If the backend reports the session is gone, sign out locally
  useEffect(() => {
    const onExpired = () => {
      clearStoredAuth();
      setCurrentUser(null);
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Global Session Check on Mount (Firebase + Backend)
  useEffect(() => {
    async function checkSession() {
      try {
        const backendUser = await fetchCurrentUser();
        setCurrentUser(backendUser || null);
      } catch (err) {
        console.warn('Initial session check error:', err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkSession();
  }, []);

  // Global Keyboard Shortcuts (Cmd+K for search)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (type, title, message) => {
    const newToast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    addToast(
      'success',
      'Signed In Successfully',
      `Welcome to AI Detector Pro, ${user.name} (${user.email})`
    );
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch {
      // Ignore
    }
    await logoutUser();
    setRecords([]);
    setCurrentUser(null);
    addToast('info', 'Signed Out', 'You have been safely signed out of your account.');
  };

  const handleViewRecord = async (record) => {
    try {
      if (record.paragraphs && record.paragraphs.length > 0) {
        setActiveDocument(record);
        setCurrentPage('analysis-results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const fullDoc = await fetchDocumentById(record.id);
      if (fullDoc && fullDoc.paragraphs && fullDoc.paragraphs.length > 0) {
        setActiveDocument(fullDoc);
        setCurrentPage('analysis-results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } catch (err) {
      console.warn('Could not open document:', err);
    }
    // Fallback: view record as active document
    setActiveDocument(record);
    setCurrentPage('analysis-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (analyzedDoc) => {
    const newRecord = {
      id: analyzedDoc.id,
      name: analyzedDoc.name,
      fileType: analyzedDoc.fileType,
      fileSize: analyzedDoc.fileSize,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      aiPercentage: analyzedDoc.aiPercentage,
      humanPercentage: analyzedDoc.humanPercentage,
      sectionsFlagged: analyzedDoc.flaggedSectionsCount,
      status: 'Completed',
      classification: analyzedDoc.classification,
      paragraphs: analyzedDoc.paragraphs,
      sectionBreakdown: analyzedDoc.sectionBreakdown,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setActiveDocument(analyzedDoc);

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `Audit Finished: ${analyzedDoc.name}`,
      message: `Completed linguistic scan with ${analyzedDoc.aiPercentage}% estimated AI signal.`,
      time: 'Just now',
      read: false,
      type: analyzedDoc.aiPercentage > 60 ? 'warning' : 'success',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    addToast(
      'success',
      'Analysis Completed',
      `Document ${analyzedDoc.name} evaluated. Generated ${analyzedDoc.paragraphs?.length || 2} audit sections.`
    );

    setCurrentPage('analysis-results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = async (recordId) => {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    try {
      await deleteDocumentApi(recordId);
    } catch {
      // Local fallback
    }
  };

  const handleResetData = async () => {
    setActiveDocument(DEFAULT_DETAILED_DOCUMENT);
    setNotifications(INITIAL_NOTIFICATIONS);
    try {
      const serverDocs = await fetchDocuments();
      setRecords(Array.isArray(serverDocs) && serverDocs.length > 0 ? serverDocs : INITIAL_HISTORY_RECORDS);
    } catch {
      setRecords(INITIAL_HISTORY_RECORDS);
    }
  };

  const handleMarkNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const isDark = theme === 'dark';

  // 1. Initial Auth Check Spinner
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Initializing Security Engine & Firebase...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Show 3D Interactive Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors relative">
        <ThreeBackgroundParticles isDark={isDark} />
        <Login
          onLoginSuccess={handleLoginSuccess}
          isDark={isDark}
          onNotify={addToast}
        />
        <Toast toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 3. Authenticated State -> Full Studio Application
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors relative">
      {/* 3D Ambient Space Background */}
      <ThreeBackgroundParticles isDark={isDark} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
        onOpenHelp={() => setHelpModalOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar */}
        <Topbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          theme={theme}
          toggleTheme={toggleTheme}
          user={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
          activeDocumentName={activeDocument?.name}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigate}
              records={records}
              onViewRecord={handleViewRecord}
              isDark={isDark}
            />
          )}

          {currentPage === 'new-analysis' && (
            <NewAnalysis
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}

          {currentPage === 'analysis-results' && (
            <AnalysisResults
              documentData={activeDocument}
              onNewAnalysis={() => handleNavigate('new-analysis')}
              onNotify={addToast}
              isDark={isDark}
            />
          )}

          {currentPage === 'history' && (
            <History
              records={records}
              onViewRecord={handleViewRecord}
              onDeleteRecord={handleDeleteRecord}
              onNavigate={handleNavigate}
              onNotify={addToast}
            />
          )}

          {currentPage === 'reports' && (
            <Reports
              records={records}
              onViewRecord={handleViewRecord}
              onNotify={addToast}
            />
          )}

          {currentPage === 'settings' && (
            <Settings
              theme={theme}
              setTheme={setTheme}
              onResetData={handleResetData}
              onNotify={addToast}
              user={currentUser}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Toast Alert Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
        records={records}
        onSelectRecord={handleViewRecord}
        onNewAnalysis={() => {
          handleNavigate('new-analysis');
        }}
      />

      {/* Help & Methodology Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="AI Content Detector — Audit Methodology"
        subtitle="Enterprise audit methodology and linguistic authenticity standards."
        maxWidth="max-w-2xl"
        footer={
          <button
            onClick={() => setHelpModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs hover:bg-brand-700 transition-colors"
          >
            Understood
          </button>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/40">
            <h4 className="font-bold text-brand-900 dark:text-brand-300 mb-1">
              How does this audit evaluate document authenticity?
            </h4>
            <p>
              This studio audits text by analyzing structural cadence, vocabulary predictability, transition patterns, and sentence length variance. It identifies both generative AI and authentic human writing on a sentence-by-sentence basis.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1.5">
              Understanding the Visual Legend:
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Amber (Potentially AI-Like):</strong> Represents uniform sentence lengths, low perplexity, and high lexical predictability.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Green (Likely Human-Written):</strong> Highlights natural burstiness, irregular clause rhythms, personal voice, and empirical nuances.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-300 mt-0.5 shrink-0" />
                <span>
                  <strong>Gray (Uncertain / Mixed):</strong> Standard formal phrasing or technical terminology that does not distinctly tip towards human or machine markers.
                </span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-800 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Auditor Notice:</strong> No automated detection heuristic provides 100% certainty of authorship. Human review is recommended when evaluating academic papers, creative manuscripts, or corporate reports.
          </div>
        </div>
      </Modal>
    </div>
  );
}
