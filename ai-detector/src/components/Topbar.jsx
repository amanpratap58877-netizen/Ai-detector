import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  Shield,
  LogOut,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export default function Topbar({
  currentPage,
  onNavigate,
  onOpenMobileMenu,
  theme,
  toggleTheme,
  user,
  onLogout,
  notifications,
  onMarkNotificationRead,
  onOpenQuickSearch,
  activeDocumentName,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pageTitles = {
    dashboard: 'Dashboard Overview',
    'new-analysis': 'New Document Analysis',
    'analysis-results': 'Analysis Results',
    history: 'Analysis History',
    reports: 'Reports Library',
    settings: 'System Settings',
  };

  const getBreadcrumbs = () => {
    if (currentPage === 'dashboard') {
      return [{ label: 'Home', active: true }];
    }
    if (currentPage === 'analysis-results') {
      return [
        { label: 'Home', page: 'dashboard' },
        { label: 'Analyses', page: 'history' },
        { label: activeDocumentName || 'Document Results', active: true },
      ];
    }
    return [
      { label: 'Home', page: 'dashboard' },
      { label: pageTitles[currentPage] || currentPage, active: true },
    ];
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-slate-200 dark:border-navy-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {getBreadcrumbs().map((b, idx, arr) => (
              <React.Fragment key={idx}>
                {b.page ? (
                  <button
                    onClick={() => onNavigate(b.page)}
                    className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
                  >
                    {b.label}
                  </button>
                ) : (
                  <span className={b.active ? 'text-slate-700 dark:text-slate-200 font-semibold truncate max-w-[200px]' : ''}>
                    {b.label}
                  </span>
                )}
                {idx < arr.length - 1 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {pageTitles[currentPage] || 'AI Content Detector'}
          </h1>
        </div>
      </div>

      {/* Right: Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Bar */}
        <button
          onClick={onOpenQuickSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/80 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 dark:text-slate-400 text-xs font-medium transition-all w-52 lg:w-64"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate flex-1 text-left">Search sample records...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded text-slate-400 shadow-sm">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenQuickSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title="Search documents"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors relative"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-navy-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread system notices` : 'All caught up!'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => notifications.forEach((n) => onMarkNotificationRead(n.id))}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => onMarkNotificationRead(notif.id)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-navy-800/50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.read ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {notif.type === 'info' && <Info className="w-4 h-4 text-brand-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="User profile menu"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/30"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-navy-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                  <Shield className="w-3 h-3" />
                  {user?.provider === 'gmail' || (user?.email && user.email.endsWith('@gmail.com'))
                    ? 'Gmail • MySQL Validated'
                    : 'MySQL Authenticated Session'}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('settings');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2.5"
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  Audit Preferences & Themes
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('history');
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800 flex items-center gap-2.5"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  My Document History
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-navy-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full px-4 py-2 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

