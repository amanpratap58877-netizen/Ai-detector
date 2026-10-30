"""
Train the AI-text detector (v2) from one or more labelled CSV files.

    python train_detector.py --csv data/my_corpus.csv --text-col text --label-col label --group-col domain
    python train_detector.py --raid                     # the bundled data/raid_dataset.csv (abstracts only)
    python train_detector.py --csv a.csv --csv b.csv    # several files are concatenated

Label values accepted: 1/0, "ai"/"human", "machine"/"human", "generated"/"human", True/False  (AI = positive).
--group-col is the column used to keep related texts together while evaluating (domain, source document id,
or generator). Evaluation is ALWAYS done on groups the model never saw in training; a random split of
near-duplicate texts is what produced the old, misleading 97% figure.

Outputs (in models/): detector_v2.joblib and model_meta_v2.json (honest metrics + decision thresholds).
detector.py automatically prefers these files when they exist.
"""
import argparse, json, os, re, sys, hashlib, datetime
import numpy as np
import pandas as pd
import sklearn
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import GroupKFold
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score
import joblib

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(HERE, "models")
CHUNK_WORDS = 160   # training samples are cut to the same size as the inference windows (~3-6 sentences)
MIN_WORDS = 25


def norm_label(v):
    s = str(v).strip().lower()
    if s in ("1", "1.0", "true", "ai", "machine", "generated", "llm", "gpt", "chatgpt", "ai-generated"):
        return 1
    if s in ("0", "0.0", "false", "human", "real", "human-written"):
        return 0
    return None


def chunk(text, size=CHUNK_WORDS):
    words = str(text).split()
    if len(words) <= size * 1.5:
        return [" ".join(words)]
    return [" ".join(words[i:i + size]) for i in range(0, len(words) - size // 2, size)]


def load_frames(args):
    frames = []
    if args.raid:
        d = pd.read_csv(os.path.join(HERE, "data", "raid_dataset.csv"))
        frames.append(pd.DataFrame({
            "text": d["generation"], "label": (d["model"] != "human").astype(int),
            "group": d["source_id"].astype(str),
        }))
    for path in args.csv or []:
        d = pd.read_csv(path)
        g = d[args.group_col].astype(str) if args.group_col and args.group_col in d else pd.Series(
            [hashlib.md5(str(t)[:80].encode()).hexdigest()[:8] for t in d[args.text_col]])
        frames.append(pd.DataFrame({"text": d[args.text_col], "label": d[args.label_col].map(norm_label), "group": g}))
    if not frames:
        sys.exit("No data. Use --raid or --csv.")
    df = pd.concat(frames, ignore_index=True).dropna(subset=["text", "label"])
    df["label"] = df["label"].astype(int)
    df = df.drop_duplicates(subset=["text"])
    rows = []
    for t, l, g in zip(df["text"], df["label"], df["group"]):
        for c in chunk(t):
            if len(c.split()) >= MIN_WORDS:
                rows.append((c, l, g))
    return pd.DataFrame(rows, columns=["text", "label", "group"])


def build_pipeline():
    feats = FeatureUnion([
        ("word", TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.9, sublinear_tf=True, lowercase=True, max_features=300000)),
        ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=5, sublinear_tf=True, max_features=300000)),
    ])
    return Pipeline([("features", feats), ("clf", LogisticRegression(C=4.0, max_iter=2000, class_weight="balanced"))])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", action="append")
    ap.add_argument("--text-col", default="text")
    ap.add_argument("--label-col", default="label")
    ap.add_argument("--group-col", default=None)
    ap.add_argument("--raid", action="store_true")
    ap.add_argument("--folds", type=int, default=5)
    ap.add_argument("--max-rows", type=int, default=0, help="subsample for a quick test")
    args = ap.parse_args()

    df = load_frames(args)
    if args.max_rows and len(df) > args.max_rows:
        df = df.sample(args.max_rows, random_state=0)
    print(f"samples: {len(df)}  AI: {int(df.label.sum())}  human: {int((1 - df.label).sum())}  groups: {df.group.nunique()}")

    # ---- honest evaluation: held-out GROUPS ----
    n_groups = df.group.nunique()
    folds = max(2, min(args.folds, n_groups))
    oof = np.zeros(len(df))
    for k, (tr, te) in enumerate(GroupKFold(n_splits=folds).split(df.text, df.label, df.group)):
        m = build_pipeline().fit(df.text.iloc[tr], df.label.iloc[tr])
        oof[te] = m.predict_proba(df.text.iloc[te])[:, 1]
        print(f"  fold {k + 1}/{folds}: acc@0.5={accuracy_score(df.label.iloc[te], oof[te] > .5):.3f}")
    y = df.label.values
    metrics = {
        "heldout_accuracy_at_0.5": round(float(accuracy_score(y, oof > .5)), 4),
        "heldout_auc": round(float(roc_auc_score(y, oof)), 4),
        "heldout_f1": round(float(f1_score(y, oof > .5)), 4),
        "false_positive_rate_on_human": round(float(((oof > .5) & (y == 0)).sum() / max((y == 0).sum(), 1)), 4),
        "false_negative_rate_on_ai": round(float(((oof <= .5) & (y == 1)).sum() / max((y == 1).sum(), 1)), 4),
    }
    print("held-out metrics:", metrics)

    # ---- fit thresholds on held-out predictions (not on training fit) ----
    # Pick the cut-off pair that keeps the human false-positive rate <= 5% for the "AI" call,
    # and the AI false-negative rate <= 5% for the "human" call.
    h, a = oof[y == 0], oof[y == 1]
    ai_cut = float(np.clip(np.quantile(h, 0.95), 0.55, 0.9))
    hu_cut = float(np.clip(np.quantile(a, 0.05), 0.1, 0.45))
    decision = {"ai_doc_prob": round(ai_cut, 3), "human_doc_prob": round(hu_cut, 3),
                "strong_ai_prob": round(min(0.97, ai_cut + 0.15), 3),
                "strong_human_prob": round(max(0.03, hu_cut - 0.15), 3),
                "sentence_ai": round(max(0.55, ai_cut - 0.1), 3), "sentence_human": round(min(0.45, hu_cut + 0.1), 3)}
    print("fitted thresholds:", decision)

    # ---- final model: calibrated on all data ----
    final = CalibratedClassifierCV(build_pipeline(), method="sigmoid", cv=3).fit(df.text, df.label)
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(final, os.path.join(MODELS_DIR, "detector_v2.joblib"), compress=3)
    meta = {
        "status": "trained_v2", "trained_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "sklearn_version": sklearn.__version__, "sampleCount": int(len(df)),
        "groups": int(n_groups), "evaluation": "GroupKFold on held-out groups", "metrics": metrics,
        "decision": decision,
        "comparison": [{"approach": "Word 1-2gram + char 3-5gram TF-IDF, logistic regression, sigmoid-calibrated",
                        "role": "Production detector (v2)", "accuracy": f"{metrics['heldout_accuracy_at_0.5']*100:.1f}% (held-out groups)",
                        "strengths": f"AUC {metrics['heldout_auc']}; human false-positive rate {metrics['false_positive_rate_on_human']*100:.1f}%"}],
    }
    json.dump(meta, open(os.path.join(MODELS_DIR, "model_meta_v2.json"), "w", encoding="utf-8"), indent=2)
    print("saved models/detector_v2.joblib and models/model_meta_v2.json")


if __name__ == "__main__":
    main()
