import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Download,
} from 'lucide-react';

export default function DataTable({
  records = [],
  onViewReport,
  onDeleteRecord,
  onDownloadSingleReport,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState('all');
  const [filterFileType, setFilterFileType] = useState('all');
  const [sortField, setSortField] = useState('date'); // 'date' | 'aiPercentage' | 'name'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClassification =
          filterClassification === 'all' || rec.classification === filterClassification;
        const matchesType =
          filterFileType === 'all' || rec.fileType.toLowerCase() === filterFileType.toLowerCase();
        return matchesSearch && matchesClassification && matchesType;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [records, searchTerm, filterClassification, filterFileType, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getClassificationBadge = (rec) => {
    const score = rec.aiPercentage;
    if (score < 25) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <ShieldCheck className="w-3 h-3" />
          Likely Human ({score}%)
        </span>
      );
    }
    if (score <= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <HelpCircle className="w-3 h-3" />
          Mixed ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
        <ShieldAlert className="w-3 h-3" />
        High AI ({score}%)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Classification Filter */}
          <select
            value={filterClassification}
            onChange={(e) => {
              setFilterClassification(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Classifications</option>
            <option value="Likely Human-Written">Likely Human-Written</option>
            <option value="Mixed Content">Mixed Content</option>
            <option value="Potentially AI-Generated">Potentially AI-Generated</option>
          </select>

          {/* File Type Filter */}
          <select
            value={filterFileType}
            onChange={(e) => {
              setFilterFileType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All File Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
            <option value="pptx">PPTX</option>
            <option value="rtf">RTF</option>
          </select>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden md:block bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-card overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-800/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-6 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Document Name</span>
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4">Format</th>
              <th
                onClick={() => handleSort('aiPercentage')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>AI Content</span>
                  {sortField === 'aiPercentage' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4">Classification</th>
              <th
                onClick={() => handleSort('date')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Audit Date</span>
                  {sortField === 'date' && (
                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60 text-slate-700 dark:text-slate-200">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-navy-700 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors group"
                >
                  <td className="py-4 px-6 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {rec.name}
                        </p>
                        <p className="text-[11px] text-slate-400">{rec.fileSize || '2.1 MB'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
                      {rec.fileType}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rec.aiPercentage > 60
                              ? 'bg-rose-500'
                              : rec.aiPercentage > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${rec.aiPercentage}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {rec.aiPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getClassificationBadge(rec)}</td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {rec.date}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {rec.status || 'Completed'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewReport(rec)}
                        className="px-2.5 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-300 font-semibold text-xs transition-colors flex items-center gap-1"
                        title="Inspect full audit results"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {onDownloadSingleReport && (
                        <button
                          onClick={() => onDownloadSingleReport(rec)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          title="Download summary"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteRecord(rec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {paginatedRecords.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 text-slate-400">
            No matching records found.
          </div>
        ) : (
          paginatedRecords.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-navy-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {rec.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">{rec.date}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-navy-800 text-slate-600">
                  {rec.fileType}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-navy-800">
                <span className="text-slate-500">Estimated AI:</span>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white">
                  {rec.aiPercentage}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {getClassificationBadge(rec)}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onViewReport(rec)}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => onDeleteRecord(rec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-navy-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-700 dark:text-slate-200">{paginatedRecords.length}</strong> of{' '}
            <strong className="text-slate-700 dark:text-slate-200">{filteredRecords.length}</strong> records
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

