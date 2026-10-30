import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { History as HistoryIcon, Trash2, AlertTriangle, Sparkles, PlusCircle } from 'lucide-react';
import { downloadTextReport } from '../utils/reportDownload';

export default function History({
  records = [],
  onViewRecord,
  onDeleteRecord,
  onNavigate,
  onNotify,
}) {
  const [recordToDelete, setRecordToDelete] = useState(null);

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteRecord(recordToDelete.id);
      onNotify('info', 'Record Deleted', `Removed ${recordToDelete.name} from audit history.`);
      setRecordToDelete(null);
    }
  };

  const handleDownloadSingle = (rec) => {
    downloadTextReport(rec);
    onNotify('success', 'Report Exported', `Saved report for ${rec.name}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Analysis History
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, filter, inspect, and export verified document audit evaluations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('new-analysis')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-600/30 flex items-center gap-2 transition-all self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Main Data Table */}
      <DataTable
        records={records}
        onViewReport={onViewRecord}
        onDeleteRecord={(rec) => setRecordToDelete(rec)}
        onDownloadSingleReport={handleDownloadSingle}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        title="Confirm Record Deletion"
        subtitle="This action will remove the audit entry from local session memory."
        footer={
          <>
            <button
              onClick={() => setRecordToDelete(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Record</span>
            </button>
          </>
        }
      >
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="leading-relaxed">
            Are you sure you want to delete <strong className="font-bold underline">{recordToDelete?.name}</strong>?
            All stored sentence-level heuristic highlights for this document will be cleared.
          </div>
        </div>
      </Modal>
    </div>
  );
}

