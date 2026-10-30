"""
Human / Mixed / AI decision logic (single place, used by detector.py).

WHY THIS EXISTS
---------------
The old code used two arbitrary cut-offs on one blended number (>=65 AI, >=38 Mixed).
That treats "the model is unsure" as if it meant "half human, half AI", which is wrong:
a fully ChatGPT text and a half-and-half text can both land on 40-60%.

This module decides from TWO independent signals:

  1. doc_prob   - calibrated probability that the WHOLE text is AI (0..1).
  2. ai_share   - fraction of the text (length-weighted) whose sentence windows are
                  individually flagged as AI, and human_share the same for human.

RULES (evaluated in this order)
  AI     : doc_prob >= strong_ai_prob                       (model is very sure)
           OR (doc_prob >= ai_doc_prob  AND ai_share >= ai_share_min)
  HUMAN  : doc_prob <= strong_human_prob
           OR (doc_prob <= human_doc_prob AND ai_share <= human_share_max)
  MIXED  : everything else, reported with a reason:
             "blended"   - both AI-flagged and human-flagged passages are >= blend_min
                           (the text really contains both kinds of writing)
             "borderline"- the signals are simply inconclusive

Default thresholds below are starting points. When you train with train_detector.py the
thresholds are re-fitted on held-out data and written to models/model_meta_v2.json under
"decision"; detector.py then uses those instead.
"""
from typing import Dict, List

DEFAULT_THRESHOLDS: Dict[str, float] = {
    "sentence_ai": 0.60,      # a sentence/window with p >= this counts as AI
    "sentence_human": 0.40,   # ... p <= this counts as human; in between = uncertain
    "ai_doc_prob": 0.70,
    "ai_share_min": 0.55,
    "strong_ai_prob": 0.85,
    "human_doc_prob": 0.30,
    "human_share_max": 0.25,
    "strong_human_prob": 0.15,
    "blend_min": 0.25,
    "min_words_confident": 100,
}


def get_thresholds(meta: dict = None) -> Dict[str, float]:
    t = dict(DEFAULT_THRESHOLDS)
    if meta and isinstance(meta.get("decision"), dict):
        t.update({k: v for k, v in meta["decision"].items() if k in t})
    return t


def shares(sentence_probs: List[float], weights: List[float], thr: Dict[str, float]):
    total = float(sum(weights)) or 1.0
    ai = sum(w for p, w in zip(sentence_probs, weights) if p >= thr["sentence_ai"]) / total
    hu = sum(w for p, w in zip(sentence_probs, weights) if p <= thr["sentence_human"]) / total
    mean_p = sum(p * w for p, w in zip(sentence_probs, weights)) / total
    return ai, hu, mean_p


def decide(doc_prob: float, sentence_probs: List[float], weights: List[float],
           word_count: int, thr: Dict[str, float]) -> dict:
    ai_share, human_share, mean_sentence_p = shares(sentence_probs, weights, thr) if sentence_probs else (doc_prob, 1 - doc_prob, doc_prob)

    if doc_prob >= thr["strong_ai_prob"] or (doc_prob >= thr["ai_doc_prob"] and ai_share >= thr["ai_share_min"]):
        label, risk, reason = "Likely AI-Generated", "High", "ai"
    elif doc_prob <= thr["strong_human_prob"] or (doc_prob <= thr["human_doc_prob"] and ai_share <= thr["human_share_max"]):
        label, risk, reason = "Likely Human-Written", "Low", "human"
    else:
        label, risk = "Mixed Content", "Moderate"
        reason = "blended" if (ai_share >= thr["blend_min"] and human_share >= thr["blend_min"]) else "borderline"

    basis = {
        "ai": f"AI: whole-text AI probability {doc_prob:.0%} and {ai_share:.0%} of the text is made of passages flagged as AI.",
        "human": f"Human: whole-text AI probability is only {doc_prob:.0%} and just {ai_share:.0%} of the text is flagged as AI.",
        "blended": f"Mixed: the text contains both kinds of passages ({ai_share:.0%} flagged AI, {human_share:.0%} flagged human) with whole-text AI probability {doc_prob:.0%}.",
        "borderline": f"Mixed: signals are inconclusive (whole-text AI probability {doc_prob:.0%}, {ai_share:.0%} of text flagged AI, {human_share:.0%} flagged human).",
    }[reason]

    low_confidence = word_count < thr["min_words_confident"]
    if low_confidence:
        basis += f" Short text ({word_count} words): treat this result as low confidence."

    # Confidence: distance of doc_prob from 0.5 for AI/Human; fixed low values for Mixed
    if reason in ("ai", "human"):
        confidence = int(round(100 * min(0.99, 0.5 + abs(doc_prob - 0.5))))
    else:
        confidence = 65 if reason == "blended" else 50
    if low_confidence:
        confidence = min(confidence, 60)

    return {
        "label": label, "risk": risk, "reason": reason, "basis": basis,
        "aiShare": round(ai_share, 3), "humanShare": round(human_share, 3),
        "meanSentenceProb": round(mean_sentence_p, 3), "confidence": confidence,
        "lowConfidence": low_confidence,
    }
