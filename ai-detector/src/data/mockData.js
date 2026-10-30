/**
 * Clean data structures for the AI Content Detector.
 * Provides realistic default document text and audit metrics
 * while supporting real results from the ML backend.
 */

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-welcome',
    title: 'AI Detector Ready',
    message: 'Linguistic authenticity engine initialized. Ready to audit essays, reports, and manuscripts.',
    time: 'Just now',
    read: false,
    type: 'info',
  },
];

export const TREND_DATA_7_DAYS = [
  { day: 'Mon', avgAi: 45, documents: 4, humanRatio: 55 },
  { day: 'Tue', avgAi: 68, documents: 7, humanRatio: 32 },
  { day: 'Wed', avgAi: 35, documents: 5, humanRatio: 65 },
  { day: 'Thu', avgAi: 82, documents: 9, humanRatio: 18 },
  { day: 'Fri', avgAi: 50, documents: 6, humanRatio: 50 },
  { day: 'Sat', avgAi: 28, documents: 3, humanRatio: 72 },
  { day: 'Sun', avgAi: 54, documents: 5, humanRatio: 46 },
];

export const CLASSIFICATION_DISTRIBUTION = [
  { name: 'Likely Human-Written', value: 14, color: '#10b981' },
  { name: 'Mixed / Hybrid', value: 18, color: '#f59e0b' },
  { name: 'Likely AI-Generated', value: 12, color: '#ef4444' },
];

export const DEFAULT_DETAILED_DOCUMENT = {
  id: 'doc-audit-2026-sample',
  name: 'Artificial_Intelligence_and_Modern_Education.docx',
  fileType: 'DOCX',
  fileSize: '1.8 MB',
  uploadDate: '2026-10-30 18:45:00',
  analysisDate: '2026-10-30 18:45:12',
  aiPercentage: 62,
  humanPercentage: 38,
  flaggedSectionsCount: 2,
  status: 'Completed',
  classification: 'Mixed Human & AI Synthesis',
  riskLevel: 'Moderate',
  wordCount: 395,
  sentenceCount: 14,
  readTime: '2 min',
  decisionBasis: 'High density of generative transitional phrases detected in Sections 1 and 3, contrasted with organic sentence variance and personal reflection in Section 2.',
  sectionBreakdown: [
    { section: '1. Executive Overview & Digital Transformation', aiPercent: 88, humanPercent: 12, totalSentences: 5 },
    { section: '2. Classroom Observations & Human Experience', aiPercent: 18, humanPercent: 82, totalSentences: 5 },
    { section: '3. Strategic Recommendations & Synthesis', aiPercent: 78, humanPercent: 22, totalSentences: 4 },
  ],
  paragraphs: [
    {
      sectionTitle: '1. Executive Overview & Digital Transformation',
      sentences: [
        {
          id: 's-1-1',
          text: 'Artificial intelligence is rapidly revolutionizing the landscape of modern enterprise operations and educational curricula.',
          type: 'ai',
          confidence: 94,
          explanation: 'Stereotypical generative opening cadence ("rapidly revolutionizing the landscape") with highly predictable token phrasing.',
        },
        {
          id: 's-1-2',
          text: 'By leveraging cutting-edge machine learning algorithms, academic institutions can seamlessly streamline complex instructional workflows.',
          type: 'ai',
          confidence: 91,
          explanation: 'Repetitive buzzwords ("leveraging cutting-edge", "seamlessly streamline") with rigid clause symmetry typical of language models.',
        },
        {
          id: 's-1-3',
          text: 'Furthermore, predictive data analytics plays a pivotal role in fostering innovation, enabling proactive decision-making across multifaceted academic disciplines.',
          type: 'ai',
          confidence: 93,
          explanation: 'Generative transition connector ("Furthermore") coupled with standard corporate clichés ("plays a pivotal role in fostering").',
        },
        {
          id: 's-1-4',
          text: 'In addition, automated language platforms provide a comprehensive framework for personalized student guidance and institutional efficiency.',
          type: 'ai',
          confidence: 86,
          explanation: 'Formulaic connector ("In addition") with uniform clause rhythm and low vocabulary surprise.',
        },
        {
          id: 's-1-5',
          text: 'This technological evolution presents both unprecedented possibilities and institutional challenges.',
          type: 'human',
          confidence: 72,
          explanation: 'Concise independent clause structure exhibiting natural syntactic variation.',
        },
      ],
    },
    {
      sectionTitle: '2. Classroom Observations & Human Experience',
      sentences: [
        {
          id: 's-2-1',
          text: 'During our third-year biology lab sessions this semester, we observed an entirely different dynamic unfold when students engaged with real physical microscope slides.',
          type: 'human',
          confidence: 90,
          explanation: 'Personal experiential voice ("During our third-year biology lab sessions... we observed") with authentic episodic narrative.',
        },
        {
          id: 's-2-2',
          text: 'Most students naturally gathered around laboratory benches to debate cell structures rather than simply consulting automated summaries on their tablets.',
          type: 'human',
          confidence: 88,
          explanation: 'Organic conversational rhythm and natural sentence length variation indicating authentic human authorship.',
        },
        {
          id: 's-2-3',
          text: 'Sarah, one of our teaching assistants, noticed that spontaneous hands-on inquiry sparked questions no automated textbook prompt had anticipated.',
          type: 'human',
          confidence: 92,
          explanation: 'Specific personal attribution ("Sarah, one of our teaching assistants") with dynamic narrative flow.',
        },
        {
          id: 's-2-4',
          text: 'When technical glitches occurred, students improvised their own observational notes with hand-drawn sketches and peer critique.',
          type: 'human',
          confidence: 85,
          explanation: 'Irregular clause structure with vivid situational detail characteristic of organic human reflection.',
        },
        {
          id: 's-2-5',
          text: 'These observations clearly illustrate the enduring necessity of direct teacher-student mentoring.',
          type: 'ai',
          confidence: 76,
          explanation: 'Syntactically neat concluding phrase with moderate AI pattern overlap.',
        },
      ],
    },
    {
      sectionTitle: '3. Strategic Recommendations & Synthesis',
      sentences: [
        {
          id: 's-3-1',
          text: 'In conclusion, harnessing these transformative technologies requires a holistic strategy that balances digital automation with human empathy.',
          type: 'ai',
          confidence: 95,
          explanation: 'Standard generative closing archetype ("In conclusion, harnessing these transformative technologies") widely seen in AI outputs.',
        },
        {
          id: 's-3-2',
          text: 'Educational leaders must establish rigorous guidelines to ensure academic integrity while fostering critical thinking skills.',
          type: 'ai',
          confidence: 89,
          explanation: 'Highly predictable vocabulary pairing ("rigorous guidelines", "critical thinking skills") with low lexical entropy.',
        },
        {
          id: 's-3-3',
          text: 'By maintaining this delicate equilibrium, schools can prepare learners to navigate the challenges of an ever-evolving digital world.',
          type: 'ai',
          confidence: 92,
          explanation: 'Formulaic optimistic closing trope ("prepare learners to navigate the challenges of an ever-evolving digital world").',
        },
        {
          id: 's-3-4',
          text: 'Ultimately, technology serves as an amplifier of human pedagogical excellence rather than its replacement.',
          type: 'human',
          confidence: 74,
          explanation: 'Thoughtful philosophical aphorism with personal rhetorical balance.',
        },
      ],
    },
  ],
  modelComparison: {
    ensembleScore: 62,
    lexicalScore: 78,
    stylometricScore: 56,
    sequenceScore: 68,
  },
};

export const INITIAL_HISTORY_RECORDS = [
  {
    id: DEFAULT_DETAILED_DOCUMENT.id,
    name: DEFAULT_DETAILED_DOCUMENT.name,
    fileType: DEFAULT_DETAILED_DOCUMENT.fileType,
    fileSize: DEFAULT_DETAILED_DOCUMENT.fileSize,
    date: '2026-10-30 18:45',
    aiPercentage: DEFAULT_DETAILED_DOCUMENT.aiPercentage,
    humanPercentage: DEFAULT_DETAILED_DOCUMENT.humanPercentage,
    sectionsFlagged: DEFAULT_DETAILED_DOCUMENT.flaggedSectionsCount,
    status: 'Completed',
    classification: DEFAULT_DETAILED_DOCUMENT.classification,
    riskLevel: DEFAULT_DETAILED_DOCUMENT.riskLevel,
    wordCount: DEFAULT_DETAILED_DOCUMENT.wordCount,
    sentenceCount: DEFAULT_DETAILED_DOCUMENT.sentenceCount,
    paragraphs: DEFAULT_DETAILED_DOCUMENT.paragraphs,
    sectionBreakdown: DEFAULT_DETAILED_DOCUMENT.sectionBreakdown,
  },
];

export const PRESET_SAMPLE_DOCS = [
  DEFAULT_DETAILED_DOCUMENT,
];
