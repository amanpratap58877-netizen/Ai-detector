# Changes in this version

## Bug 1 - Sign-up 500
Most likely cause: an old `users` table already existed (from an earlier version of the project), and
`CREATE TABLE IF NOT EXISTS` never updates it, so INSERT failed on missing columns / an integer `id`.
- `database.py` now adds missing columns and converts a legacy integer `users.id` to VARCHAR (MySQL + SQLite).
- Duplicate email -> HTTP 409 with a clear message. MySQL connections have a timeout.
- `app.py`: every unhandled error prints a full traceback in the backend terminal and returns the real reason.
  If sign-up still fails, copy the traceback printed in the backend terminal.
(Tested: sign-up on a simulated legacy SQLite schema. The MySQL migration path is written but NOT tested here.)

## Bugs 2-4 - History / Reports / Documents shared between users
- `documents.user_id` column; every query filters by the signed-in user; other users' documents return 404.
- `/api/documents*`, `/api/stats`, `/api/analyze/*` now require login. Session expiry is enforced.
- Frontend sends the token on every call, no shared localStorage cache, no sample records, state is cleared
  and reloaded on login/logout. The Firebase listener that created a user WITHOUT a backend session was removed.
- Old documents saved before this change have no owner and are visible to nobody.

## Results screen
- The Human/Mixed/AI badge was recomputed in the browser from the percentage (own thresholds). It now shows the
  backend decision, plus a "Why:" line explaining the basis.
- NewAnalysis no longer FABRICATES a result (fixed 42%/58% or random score) when the backend call fails; it shows the error.

## Human / Mixed / AI criteria (backend/scoring.py)
Decided from two signals: whole-text AI probability, and the share of the text whose 3-sentence windows are flagged AI.
AI: prob >= 0.85, or prob >= 0.70 and >= 55% of text flagged AI.
Human: prob <= 0.15, or prob <= 0.30 and <= 25% flagged AI.
Mixed otherwise ("blended" if both AI and human passages are >= 25% each, else "borderline").
Thresholds are defaults; train_detector.py re-fits them on held-out data into models/model_meta_v2.json.

## Phase 2 Update — Real Training Corpus, 3-Model Retraining & Clean Forensics (Completed)

### 1. Real Multi-Domain Training Corpus (Zero Synthetic / Self-Generated Text)
- Built `backend/download_real_corpus.py` downloading real open-license benchmark text:
  - **RAID Benchmark 2024** (MIT License): Multi-generator ChatGPT/GPT-4/Llama/Mistral, adversarial paraphrasing, and academic abstracts.
  - **Hello-SimpleAI/HC3** (CC-BY-SA 4.0 / Apache-2.0): Human vs ChatGPT answers across Reddit ELI5, Medical, Finance, and OpenQA.
  - **dmitva/human_ai_generated_text** (CC-BY 4.0 / Persuade 2.0): Real student essays and ESL/non-native writers vs ChatGPT/GPT-4.
  - **NoaiGPT/ltgen-wiki-paraphrased-Humanized-19999** (Apache-2.0): Humanized and paraphrased AI text.
  - **silentone0725/ai-human-text-detection-v1** (Apache-2.0): News, essays, and creative writing.
- Deduplicated via MD5 hashes and balanced 50/50 class distribution: **4,978 passages** across 5 distinct domains.
- Documented complete corpus metadata and licenses in `backend/data/CORPUS_MANIFEST.md`.

### 2. 3-Model Retraining & Cross-Domain Evaluation (backend/train_ensemble.py)
- **Model 1 (N-Gram / Lexical Classifier)**: Word (1-2) + Character (3-5) TF-IDF n-grams with Calibrated Logistic Regression.
- **Model 2 (Deep Stylometrics & Burstiness)**: 28-dimensional linguistic features (variance, Shannon entropy, burstiness CV, syntax density, punctuation patterns) with Calibrated Random Forest.
- **Model 3 (Sequence Context & Transition Dynamics)**: 18-dimensional sequential cohesion features (inter-sentence delta, Markov punctuation transitions, opener repetition) with Calibrated Logistic Regression.
- **Ensemble (Soft-Voting Meta-Detector)**: Soft probability blend calibrated with isotonic regression.
- **Strict Held-Out Group Cross-Validation (Unseen Domains)**:
  - Model 1 (Lexical): Accuracy = 65.17%, ROC-AUC = 0.7501, Human FPR = 57.04%
  - Model 2 (Stylometric): Accuracy = 59.38%, ROC-AUC = 0.6094, Human FPR = 55.40%
  - Model 3 (Sequence): Accuracy = 55.42%, ROC-AUC = 0.5567, Human FPR = 47.49%
  - 3-Model Ensemble: Accuracy = 64.01%, ROC-AUC = 0.7041, Human FPR = 58.59%
- *Honest Model Finding*: Model 3 has the lowest false-positive rate on human text (47.49%), but its lower standalone accuracy slightly pulls down the raw unweighted ensemble accuracy (from 65.17% to 64.01%).
- **Calibrated Thresholds fitted on held-out predictions**:
  - `ai_doc_prob`: 0.842 | `human_doc_prob`: 0.369
  - `strong_ai_prob`: 0.950 | `strong_human_prob`: 0.219
  - `sentence_ai`: 0.762 | `sentence_human`: 0.449

### 3. Removal of Misleading & Hardcoded Output
- Wiped hardcoded fake accuracy ("97.45%", "95.5%") from `model_meta.json`, `UploadDropzone.jsx`, and `ModelComparisonCard.jsx`.
- Removed preset sample documents with hardcoded scores from `mockData.js` and `UploadDropzone.jsx`.
- Removed `Math.random()` score fallback in `NewAnalysis.jsx` (`buildAuditResult()`).
- Replaced hardcoded dashboard trend charts with live queries from user audit history in `Dashboard.jsx`.
- Replaced default 0.5 score fallback in `backend/detector.py`: if models fail to load, a clear `RuntimeError` is raised.

### 4. Pinned Dependencies
- Pinned in `backend/requirements.txt`:
  - `scikit-learn==1.9.1`
  - `scipy==1.18.1`
  - `pandas==3.1.0`
  - `joblib==1.6.0`

## Setup
pip install -r backend/requirements.txt   (scikit-learn was missing from requirements)
