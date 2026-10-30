import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

/**
 * 7-Day Trend Line Chart for Dashboard
 */
export function TrendLineChart({ data, isDark = false }) {
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
            formatter={(value) => [`${value}%`, 'Avg Estimated AI']}
          />
          <Line
            type="monotone"
            dataKey="avgAi"
            name="Avg AI Content"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#4f46e5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Document Classification Donut Chart for Dashboard
 */
export function DistributionDonutChart({ data, isDark = false }) {
  return (
    <div className="w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '0.75rem',
              fontSize: '12px',
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
            formatter={(value, name) => [`${value} Documents`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Big Result Score Donut Chart for Analysis Results Page
 */
export function ScoreDonutChart({ aiPercentage, humanPercentage, isDark = false }) {
  const chartData = [
    { name: 'Estimated AI-Like', value: aiPercentage, color: '#f59e0b' },
    { name: 'Estimated Human-Like', value: humanPercentage, color: '#10b981' },
  ];

  return (
    <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={95}
            startAngle={90}
            endAngle={-270}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`score-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '0.75rem',
              fontSize: '12px',
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
            formatter={(value) => [`${value}%`]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {aiPercentage}%
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          AI-Content Signal
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {humanPercentage}% Human
        </span>
      </div>
    </div>
  );
}

