import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  History,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  LogOut,
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  onNavigate,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
  onOpenHelp,
  user,
  onLogout,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-analysis', label: 'New Analysis', icon: FileSearch, badge: 'Analyze' },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-navy-800 transition-all duration-300 ease-in-out lg:static
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-72 shadow-xl lg:shadow-none
        `}
      >
        {/* App Logo & Branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-navy-800">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
                  AI Detector
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  Enterprise Audit Studio
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800/80 hover:text-slate-900 dark:hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!isCollapsed && item.badge && !isActive && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Production Engine Telemetry Banner */}
        {!isCollapsed && (
          <div className="mx-3 my-2 p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-brand-100/50 dark:from-navy-800/70 dark:to-brand-950/40 border border-brand-200/60 dark:border-brand-900/30">
            <div className="flex items-center gap-2 mb-1.5 text-brand-700 dark:text-brand-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 animate-pulse" />
              Production Engine Active
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Python NLP Ensemble Core with MySQL Relational Storage.
            </p>
          </div>
        )}

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-200 dark:border-navy-800 space-y-1">
          {user && (
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">Sign Out ({user.email ? user.email.split('@')[0] : 'User'})</span>}
            </button>
          )}

          <button
            onClick={onOpenHelp}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title="Help & Verification Guide"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Help & Methodology</span>}
          </button>

          <div
            className={`px-3 py-1.5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {!isCollapsed ? (
              <>
                <span>Production v2.4.0</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </>
            ) : (
              <span className="text-[10px] font-mono">v1.0</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

