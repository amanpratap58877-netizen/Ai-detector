"""
Production Three-Model Ensemble definition.
Encapsulates:
  - Model 1: Sub-Word Character (3-5) + Word (1-2) N-Gram TF-IDF Classifier
  - Model 2: 28-Dimensional Deep Stylometrics & Burstiness Classifier
  - Model 3: 18-Dimensional Sequence Context & Transition Dynamics Classifier
"""

import numpy as np
from features import extract_stylometrics, extract_sequence_features


class ThreeModelEnsemble:
    """Production 3-Model Calibrated Ensemble Wrapper."""

    def __init__(self, m1, m2, m3, sc2, sc3, weights=(0.50, 0.30, 0.20)):
        self.m1 = m1
        self.m2 = m2
        self.m3 = m3
        self.sc2 = sc2
        self.sc3 = sc3
        self.weights = weights

    def predict_components(self, text: str):
        if not text or not text.strip():
            return {"p_lexical": 0.0, "p_stylometric": 0.0, "p_sequence": 0.0, "p_ensemble": 0.0}
        
        # Model 1: Lexical N-Gram
        p1 = float(self.m1.predict_proba([text])[0][1])
        
        # Model 2: Stylometrics
        f2 = self.sc2.transform([extract_stylometrics(text)])
        p2 = float(self.m2.predict_proba(f2)[0][1])
        
        # Model 3: Sequence Context & Transition Dynamics
        f3 = self.sc3.transform([extract_sequence_features(text)])
        p3 = float(self.m3.predict_proba(f3)[0][1])
        
        w1, w2, w3 = self.weights
        p_ens = w1 * p1 + w2 * p2 + w3 * p3
        return {
            "p_lexical": float(np.clip(p1, 0.001, 0.999)),
            "p_stylometric": float(np.clip(p2, 0.001, 0.999)),
            "p_sequence": float(np.clip(p3, 0.001, 0.999)),
            "p_ensemble": float(np.clip(p_ens, 0.001, 0.999))
        }

    def predict_proba(self, texts):
        probs = []
        for t in texts:
            res = self.predict_components(t)
            p = res["p_ensemble"]
            probs.append([1.0 - p, p])
        return np.array(probs)

