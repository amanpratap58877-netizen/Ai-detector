"""
Dataset ingestion module for the AI Detector.
Loads the real multi-domain open-license corpus built by download_real_corpus.py.
Zero text is hardcoded or generated here.
"""

import os
import json
from download_real_corpus import build_full_corpus, OUTPUT_JSON, OUTPUT_CSV

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CORPUS_PATH = OUTPUT_JSON


def get_training_data():
    if os.path.exists(CORPUS_PATH):
        with open(CORPUS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    print("[Dataset Ingestion] Training corpus not found on disk. Building real multi-domain corpus...")
    return build_full_corpus()


if __name__ == "__main__":
    data = get_training_data()
    print(f"Loaded {len(data)} balanced real-world samples.")
