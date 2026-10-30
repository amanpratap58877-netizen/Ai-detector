/**
 * Clean data structures for the AI Content Detector.
 * All fake, pre-cooked scores, preset documents with fixed scores,
 * and fabricated mock records have been removed.
 * Real results come strictly from the live 3-model ML backend.
 */

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-welcome',
    title: 'AI Detector Ready',
    message: 'Live 3-model analysis engine initialized. Upload a file or paste text to begin your first audit.',
    time: 'Just now',
    read: false,
    type: 'info',
  },
];

export const TREND_DATA_7_DAYS = [];

export const CLASSIFICATION_DISTRIBUTION = [];

export const DEFAULT_DETAILED_DOCUMENT = null;

export const INITIAL_HISTORY_RECORDS = [];

export const PRESET_SAMPLE_DOCS = [];
