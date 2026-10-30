import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle2,
  Layers,
  Printer,
  Sparkles,
  FileCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  downloadTextReport,
  downloadCsvReport,
  downloadJsonReport,
  printFormattedReport,
} from '../utils/reportDownload';
import CreativeAuditReport from '../components/CreativeAuditReport';

export default function Reports({
  records = [],
  onViewRecord,
  onNotify = () => {},
  isDark = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  const filteredReports = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const handleDownload = (record, format) => {
    try {
      if (format === 'txt') {
        downloadTextReport(record);
        onNotify('success', 'Report Exported', `${record.name} text report downloaded.`);
      } else if (format === 'csv') {
        downloadCsvReport(record);
        onNotify('success', 'CSV Dataset Exported', `Detailed CSV table downloaded.`);
      } else if (format === 'json') {
        downloadJsonReport(record);
        onNotify('success', 'JSON Exported', `Full schema downloaded as JSON.`);
      } else if (format === 'print') {
        printFormattedReport();
      }
    } catch {
      onNotify('error', 'Export Failed', 'Could not generate report.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Reports Library
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access forensic audit trails, highlighted AI content reports, and RAID benchmark datasets.
          </p>
        </div>

        {/* Global Batch Print Shortcut */}
        <button
          onClick={() => printFormattedReport()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-center"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print / PDF Overview</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report titles..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-navy-900 rounded-3xl border border-dashed border-slate-200 dark:border-navy-800 text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-navy-700 mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No reports found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your filters or upload a new file</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-slate-200/80 dark:border-navy-800 shadow-card hover:shadow-float transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {report.status || 'Completed'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {report.name}
                </h3>

                <p className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {report.date || report.uploadDate}
                </p>

                {/* Score Indicators */}
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Estimated AI Content:</span>
                    <span className="font-extrabold font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {report.aiPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-navy-700 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-l-full ${
                        report.aiPercentage > 60
                          ? 'bg-rose-500'
                          : report.aiPercentage > 35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${report.aiPercentage}%` }}
                    />
                    <div
                      className="h-full bg-emerald-400 rounded-r-full"
                      style={{ width: `${100 - report.aiPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{report.fileType || 'TXT'} Document</span>
                    <span>{100 - report.aiPercentage}% Human</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedReportForModal(report)}
                  className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>View Creative Report</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewRecord(report)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Inspect in 3D Workspace"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(report, 'csv')}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                    title="Download .CSV dataset"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownload(report, 'txt')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                    title="Download .TXT report"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creative Audit Report Modal */}
      {selectedReportForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8">
            <CreativeAuditReport
              documentData={selectedReportForModal}
              onClose={() => setSelectedReportForModal(null)}
              onDownload={(format) => handleDownload(selectedReportForModal, format)}
              isDark={isDark}
              onNotify={onNotify}
            />
          </div>
        </div>
      )}
    </div>
  );
}
