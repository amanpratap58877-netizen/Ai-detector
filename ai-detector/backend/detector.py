import os
import re
import math
import json
import joblib
import numpy as np

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# ---------------------------------------------------------------------------
# Model loading. Preference order:
#   1) models/detector_v2.joblib  (produced by train_ensemble.py - calibrated 3-model ensemble)
#   2) individual calibrated models (clf_lexical / clf_stylo / clf_seq)
# ---------------------------------------------------------------------------
from scoring import get_thresholds, decide
from features import extract_stylometrics, extract_sequence_features, AI_CLICHE_PATTERNS
from ensemble import ThreeModelEnsemble

v2_model = None
has_models = False
model_meta = {}

_v2_path = os.path.join(MODELS_DIR, "detector_v2.joblib")
_v2_meta = os.path.join(MODELS_DIR, "model_meta_v2.json")
if os.path.exists(_v2_path):
    try:
        v2_model = joblib.load(_v2_path)
        model_meta = json.load(open(_v2_meta, "r", encoding="utf-8")) if os.path.exists(_v2_meta) else {}
        print("[Detector Engine] Loaded detector v2 (3-model calibrated ensemble).")
    except Exception as e:
        print(f"[Detector Engine Warning] Could not load detector v2 ({e}). Checking individual models...")
        v2_model = None

if v2_model is None:
    clf_lexical_path = os.path.join(MODELS_DIR, "clf_lexical.joblib")
    scaler_stylo_path = os.path.join(MODELS_DIR, "stylometric_scaler.joblib")
    clf_stylo_path = os.path.join(MODELS_DIR, "clf_stylo.joblib")
    scaler_seq_path = os.path.join(MODELS_DIR, "sequence_scaler.joblib")
    clf_seq_path = os.path.join(MODELS_DIR, "clf_seq.joblib")
    meta_path = os.path.join(MODELS_DIR, "model_meta.json")
    
    has_models = all(os.path.exists(p) for p in [clf_lexical_path, scaler_stylo_path, clf_stylo_path, scaler_seq_path, clf_seq_path])
    if has_models:
        try:
            m1 = joblib.load(clf_lexical_path)
            sc2 = joblib.load(scaler_stylo_path)
            m2 = joblib.load(clf_stylo_path)
            sc3 = joblib.load(scaler_seq_path)
            m3 = joblib.load(clf_seq_path)
            v2_model = ThreeModelEnsemble(m1, m2, m3, sc2, sc3)
            with open(meta_path, "r", encoding="utf-8") as f:
                model_meta = json.load(f)
            print("[Detector Engine] Loaded individual 3-model components.")
        except Exception as e:
            print(f"[Detector Engine Warning] Individual model loading failed: {e}")
            has_models = False
            model_meta = {}

MODEL_READY = (v2_model is not None)
THRESHOLDS = get_thresholds(model_meta)


def predict_components(text: str) -> dict:
    """Returns raw individual probabilities from all 3 models + ensemble.
    Raises RuntimeError if models could not be loaded.
    """
    if not MODEL_READY:
        raise RuntimeError("AI Detection models could not be loaded from backend/models. Please run train_ensemble.py.")
    if not text or not text.strip():
        return {"p_lexical": 0.0, "p_stylometric": 0.0, "p_sequence": 0.0, "p_ensemble": 0.0}
    return v2_model.predict_components(text)


def predict_text_prob(text: str) -> float:
    """Calibrated probability (0..1) that `text` is AI-written.
    Raises RuntimeError if models cannot be loaded — no misleading 0.5 default.
    """
    if not MODEL_READY:
        raise RuntimeError("AI Detection models could not be loaded from backend/models. Please run train_ensemble.py.")
    if not text or not text.strip():
        return 0.0
    return float(v2_model.predict_proba([text])[0][1])


def split_into_sentences(text: str):
    cleaned = re.sub(r"\b(Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e|vs|etc)\.", r"\1<DOT>", text)
    raw = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences = []
    for s in raw:
        restored = s.replace("<DOT>", ".").strip()
        if len(restored) > 4:
            sentences.append(restored)
    return sentences or [text.strip()]


WINDOW = 3  # sentences per scoring window.


def _window_probs(sentences):
    """Per-sentence AI probability = mean probability of overlapping windows covering the sentence."""
    n = len(sentences)
    if n == 0:
        return []
    if n <= WINDOW:
        p = predict_text_prob(" ".join(sentences))
        return [p] * n
    sums = [0.0] * n
    cnts = [0] * n
    for i in range(0, n - WINDOW + 1):
        p = predict_text_prob(" ".join(sentences[i:i + WINDOW]))
        for j in range(i, i + WINDOW):
            sums[j] += p
            cnts[j] += 1
    return [sums[j] / cnts[j] for j in range(n)]


def analyze_document_content(sections: list, filename: str, file_type: str, file_size_formatted: str):
    """
    Real 3-Model Document analysis:
      1. Whole-text probabilities from the 3 individual models + calibrated ensemble (doc_prob)
      2. Per-sentence probability from overlapping 3-sentence windows
      3. Human / Mixed / AI decided by scoring.decide() based on held-out fitted thresholds
    """
    if not MODEL_READY:
        raise RuntimeError(
            "No detection model could be loaded from backend/models. Re-run train_ensemble.py with the same "
            "scikit-learn version pinned in backend/requirements.txt."
        )
    import uuid
    import datetime
    now_dt = datetime.datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    doc_id = f"doc-{int(now_dt.timestamp())}-{uuid.uuid4().hex[:6]}"

    sec_sentences = []
    all_sentences_flat = []
    all_lengths = []
    total_words = 0
    for sec in sections:
        s_list = split_into_sentences(sec.get("text", ""))
        sec_sentences.append(s_list)
        for s in s_list:
            n_w = len(re.findall(r"\b[A-Za-z0-9'-]+\b", s))
            total_words += n_w
            all_lengths.append(n_w)
            all_sentences_flat.append(s)

    full_text = " ".join(all_sentences_flat)
    
    # Run whole-text analysis across all 3 models
    words_all = full_text.split()
    if len(words_all) > 240:
        chunks = [" ".join(words_all[i:i + 160]) for i in range(0, len(words_all), 160)]
        chunks = [c for c in chunks if len(c.split()) >= 25] or [full_text]
        chunk_weights = [len(c.split()) for c in chunks]
        doc_prob = float(np.average([predict_text_prob(c) for c in chunks], weights=chunk_weights))
        doc_comp = {
            "p_lexical": float(np.average([predict_components(c)["p_lexical"] for c in chunks], weights=chunk_weights)),
            "p_stylometric": float(np.average([predict_components(c)["p_stylometric"] for c in chunks], weights=chunk_weights)),
            "p_sequence": float(np.average([predict_components(c)["p_sequence"] for c in chunks], weights=chunk_weights)),
            "p_ensemble": doc_prob
        }
    else:
        doc_comp = predict_components(full_text)
        doc_prob = doc_comp["p_ensemble"]

    # Sentence probabilities (windowed within each section)
    processed_paragraphs = []
    section_breakdown = []
    flagged_sections_count = 0
    flat_probs, flat_weights = [], []
    pronouns = {"i", "me", "my", "mine", "we", "our", "us"}

    for sec_idx, sec in enumerate(sections):
        sec_title = sec.get("sectionTitle") or f"Section {sec_idx + 1}"
        s_list = sec_sentences[sec_idx]
        probs = _window_probs(s_list) if len(s_list) > 1 else [doc_prob] * len(s_list)
        sec_result, sec_ai = [], 0

        for s_idx, (s_text, p) in enumerate(zip(s_list, probs)):
            words = re.findall(r"\b[A-Za-z0-9'-]+\b", s_text.lower())
            w_count = max(len(words), 1)
            ai_hits = sum(len(c.findall(s_text.lower())) for c in AI_CLICHE_PATTERNS)
            has_pronoun = any(w in pronouns for w in words)
            has_contraction = bool(re.search(r"\b[a-z]+'[a-z]+\b", s_text.lower()))
            is_initial_transition = bool(re.match(
                r"^(furthermore|moreover|in addition|additionally|in conclusion|overall|to summarize|notably|essentially)\b",
                s_text.strip().lower()
            ))

            nudge = 0.0
            if ai_hits or is_initial_transition:
                nudge += min(0.06, 0.02 * ai_hits + (0.02 if is_initial_transition else 0.0))
            if has_pronoun or has_contraction:
                nudge -= 0.03 if has_pronoun else 0.0
                nudge -= 0.02 if has_contraction else 0.0
            s_score = float(np.clip(p + max(-0.06, min(0.06, nudge)), 0.01, 0.99))

            if s_score >= THRESHOLDS["sentence_ai"]:
                classification = "ai"
                confidence = int(min(98, max(55, round(s_score * 100))))
                explanation = ("Generative discourse connectors and highly predictable word / character patterns."
                               if (ai_hits or is_initial_transition)
                               else "Sub-word and token transition patterns match AI-generated text in this passage.")
                sec_ai += 1
            elif s_score <= THRESHOLDS["sentence_human"]:
                classification = "human"
                confidence = int(min(98, max(55, round((1 - s_score) * 100))))
                explanation = ("Personal voice, dynamic sentence length variations, or conversational phrasing."
                               if (has_pronoun or has_contraction)
                               else "Vocabulary distribution and rhythm in this passage align with human writing.")
            else:
                classification = "uncertain"
                confidence = int(np.clip(round(50 + abs(s_score - 0.5) * 100), 50, 60))
                explanation = "Mixed signals: this passage does not clearly lean human or AI."

            flat_probs.append(s_score)
            flat_weights.append(w_count)
            sec_result.append({
                "id": f"{doc_id}-s{sec_idx + 1}-{s_idx + 1}", "text": s_text, "type": classification,
                "confidence": confidence, "explanation": explanation,
                "aiProbability": round(s_score, 3),
            })

        sec_total = max(len(sec_result), 1)
        sec_ai_pct = int(round(sec_ai / sec_total * 100))
        if sec_ai_pct > 35:
            flagged_sections_count += 1
        section_breakdown.append({
            "section": sec_title,
            "aiPercent": sec_ai_pct,
            "humanPercent": 100 - sec_ai_pct,
            "totalSentences": len(sec_result)
        })
        processed_paragraphs.append({"sectionTitle": sec_title, "sentences": sec_result})

    decision = decide(doc_prob, flat_probs, flat_weights, total_words, THRESHOLDS)

    mean_sentence_p = decision["meanSentenceProb"] if flat_probs else doc_prob
    final_ai_score = int(np.clip(round((0.5 * doc_prob + 0.5 * mean_sentence_p) * 100), 0, 100))
    final_human_score = 100 - final_ai_score

    benchmarks_list = model_meta.get("comparison", [])
    metrics = model_meta.get("metrics", {})

    lexical_score = int(round(np.clip(doc_comp["p_lexical"] * 100, 0, 100)))
    stylometric_score = int(round(np.clip(doc_comp["p_stylometric"] * 100, 0, 100)))
    sequence_score = int(round(np.clip(doc_comp["p_sequence"] * 100, 0, 100)))

    return {
        "id": doc_id,
        "name": filename,
        "fileType": file_type,
        "fileSize": file_size_formatted,
        "uploadDate": now_str,
        "analysisDate": now_str,
        "aiPercentage": final_ai_score,
        "humanPercentage": final_human_score,
        "flaggedSectionsCount": flagged_sections_count,
        "status": "Completed",
        "classification": decision["label"],
        "riskLevel": decision["risk"],
        "decisionBasis": decision["basis"],
        "decisionDetail": {k: decision[k] for k in ("reason", "aiShare", "humanShare", "confidence", "lowConfidence")},
        "modelReady": MODEL_READY,
        "readTime": f"{max(1, math.ceil(total_words / 200))} min",
        "wordCount": total_words,
        "sentenceCount": len(all_sentences_flat),
        "sectionBreakdown": section_breakdown,
        "paragraphs": processed_paragraphs,
        "modelComparison": {
            "ensembleScore": final_ai_score,
            "lexicalScore": lexical_score,
            "stylometricScore": stylometric_score,
            "sequenceScore": sequence_score,
            "benchmarks": benchmarks_list,
            "heldOutMetrics": metrics,
        },
    }
