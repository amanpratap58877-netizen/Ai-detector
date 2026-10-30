import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  color = 'indigo',
  badge,
}) {
  const colorMap = {
    indigo: {
      bg: 'bg-brand-50 dark:bg-brand-950/50',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-100 dark:border-brand-900/40',
      glow: 'group-hover:border-brand-300 dark:group-hover:border-brand-700',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/40',
      glow: 'group-hover:border-amber-300 dark:group-hover:border-amber-700',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      glow: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/40',
      glow: 'group-hover:border-blue-300 dark:group-hover:border-blue-700',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`group relative bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200/80 dark:border-navy-800 shadow-card hover:shadow-float transition-all duration-200 ${currentTheme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </span>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} shadow-sm`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold text-[11px] ${
                trendType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {trendType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
              {trendType === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
              {trendType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

