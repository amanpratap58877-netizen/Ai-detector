import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

export default function SectionBreakdownChart({ sections = [], isDark = false }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        No section breakdown metrics available for this document.
      </div>
    );
  }

  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sections}
          margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
          <XAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="section"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '0.75rem',
              fontSize: '12px',
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
            formatter={(value, name, item) => [
              `${value}% AI (${item.payload.humanPercent}% Human)`,
              item.payload.section,
            ]}
          />
          <Bar dataKey="aiPercent" radius={[0, 6, 6, 0]} barSize={16}>
            {sections.map((entry, index) => {
              const color =
                entry.aiPercent > 60
                  ? '#ef4444'
                  : entry.aiPercent > 30
                  ? '#f59e0b'
                  : '#10b981';
              return <Cell key={`bar-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

