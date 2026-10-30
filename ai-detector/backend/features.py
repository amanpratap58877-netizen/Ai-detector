"""
High-performance feature extraction for:
  1. Stylometric & Linguistic Analysis (28 features)
  2. Sequence & Context Transition Dynamics (18 features)
"""

import re
import math
import numpy as np

RE_WORD = re.compile(r"\b[A-Za-z0-9'-]+\b")
RE_UPPER = re.compile(r"\b[A-Z]{2,}\b")
RE_CONTRACTION = re.compile(r"\b[a-z]+'[a-z]+\b")
RE_PASSIVE = re.compile(r"\b(is|are|was|were|been|being|be)\s+([a-z]+ed|[a-z]+en)\b")
RE_VOWELS = re.compile(r"[aeiouy]")
RE_CLAUSE_DELIM = re.compile(r"[,;:]")
RE_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
RE_ABBREV = re.compile(r"\b(Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e|vs|etc)\.", re.IGNORECASE)

AI_CLICHE_PATTERNS = [
    re.compile(p) for p in [
        r"\bfurthermore\b", r"\bmoreover\b", r"\bin addition\b", r"\badditionally\b",
        r"\bin conclusion\b", r"\bto summarize\b", r"\boverall\b", r"\bby leveraging\b",
        r"\bleveraging\b", r"\bstreamline\b", r"\bcutting-edge\b", r"\brapidly transforming\b",
        r"\brevolutionize\b", r"\bimmense potential\b", r"\bessential to\b", r"\bcrucial to\b",
        r"\bpivotal role\b", r"\bcornerstone\b", r"\bmultifaceted\b", r"\bparamount\b",
        r"\bseamlessly\b", r"\bfoster innovation\b", r"\bunprecedented\b", r"\bever-evolving\b",
        r"\btestament to\b", r"\bbeacon of\b", r"\bdelve into\b", r"\btapestry\b",
        r"\blandscape\b", r"\bholistic\b", r"\bharnessing\b", r"\bunwavering\b",
        r"\bnotably\b", r"\bessentially\b", r"\bproactively\b", r"\binterconnectedness\b",
        r"\btransformative\b", r"\bnavigate the complexities\b", r"\bgame-changer\b",
        r"\bunderscores the\b", r"\bit is important to note\b", r"\bit is worth noting\b",
        r"\bit should be noted\b", r"\bplays a vital\b", r"\bin order to optimize\b",
        r"\bprofound impact\b", r"\bcomprehensive approach\b", r"\bnuanced understanding\b"
    ]
]

PRONOUNS = {"i", "me", "my", "mine", "we", "our", "us"}
TRANSITION_STARTS = (
    "furthermore", "moreover", "in addition", "additionally", "in conclusion",
    "overall", "to summarize", "notably", "essentially", "firstly", "secondly",
    "consequently", "therefore", "thus", "importantly"
)


def split_sentences(text: str):
    cleaned = RE_ABBREV.sub(lambda m: m.group(0).replace(".", "<DOT>"), text)
    raw = RE_SENTENCE_SPLIT.split(cleaned)
    sentences = []
    for s in raw:
        restored = s.replace("<DOT>", ".").strip()
        if len(restored) > 3:
            sentences.append(restored)
    return sentences or [text.strip()]


def extract_stylometrics(text: str):
    """28-dimensional linguistic and stylometric feature vector."""
    text_clean = text.strip()
    text_lower = text_clean.lower()
    words = RE_WORD.findall(text_lower)
    total_w = max(len(words), 1)

    raw_sentences = split_sentences(text_clean)
    num_s = max(len(raw_sentences), 1)
    s_lens = [max(len(RE_WORD.findall(s)), 1) for s in raw_sentences] or [total_w]

    mean_sl = float(np.mean(s_lens))
    std_sl = float(np.std(s_lens))
    cv_burst = float(std_sl / mean_sl) if mean_sl > 0 else 0.0
    fano_factor = float(std_sl ** 2 / mean_sl) if mean_sl > 0 else 0.0
    delta_sl = float(np.mean([abs(s_lens[i] - s_lens[i - 1]) for i in range(1, len(s_lens))])) if len(s_lens) > 1 else 0.0
    min_sl = float(min(s_lens))
    max_sl = float(max(s_lens))

    word_lens = [len(w) for w in words]
    mean_wl = float(np.mean(word_lens)) if word_lens else 5.0
    std_wl = float(np.std(word_lens)) if word_lens else 1.5

    unique_words = set(words)
    ttr = len(unique_words) / total_w
    guiraud_r = len(unique_words) / math.sqrt(total_w)
    
    word_freq = {}
    for w in words:
        word_freq[w] = word_freq.get(w, 0) + 1
    hapax_ratio = sum(1 for c in word_freq.values() if c == 1) / total_w
    entropy = -sum((c / total_w) * math.log2(c / total_w) for c in word_freq.values() if c > 0)

    ai_cliche_hits = sum(len(p.findall(text_lower)) for p in AI_CLICHE_PATTERNS)
    cliche_density = ai_cliche_hits / total_w

    initial_connectors = sum(1 for s in raw_sentences if s.strip().lower().startswith(TRANSITION_STARTS))
    initial_ratio = initial_connectors / num_s

    pronoun_density = sum(1 for w in words if w in PRONOUNS) / total_w
    contractions = len(RE_CONTRACTION.findall(text_lower)) / total_w
    passive_matches = len(RE_PASSIVE.findall(text_lower))
    passive_density = passive_matches / total_w

    comma_density = text_clean.count(",") / total_w
    semicolon_colon = (text_clean.count(";") + text_clean.count(":")) / total_w
    excl_quest = (text_clean.count("!") + text_clean.count("?")) / num_s
    parentheses_dash = (text_clean.count("(") + text_clean.count(")") + text_clean.count("-") + text_clean.count("—")) / total_w
    quotes_density = (text_clean.count('"') + text_clean.count("'")) / total_w

    upper_words = len(RE_UPPER.findall(text_clean))
    upper_density = upper_words / total_w

    short_sentence_ratio = sum(1 for l in s_lens if l <= 6) / num_s
    long_sentence_ratio = sum(1 for l in s_lens if l >= 32) / num_s

    vowels = len(RE_VOWELS.findall(text_lower))
    syllables_per_word = vowels / total_w
    char_count_no_spaces = len(text_clean.replace(" ", ""))
    ari_readability = 4.71 * (char_count_no_spaces / total_w) + 0.5 * (total_w / num_s) - 21.43

    return [
        mean_sl, std_sl, cv_burst, fano_factor, delta_sl, min_sl, max_sl,
        mean_wl, std_wl, ttr, guiraud_r, hapax_ratio, entropy,
        cliche_density, initial_ratio, pronoun_density, contractions,
        passive_density, comma_density, semicolon_colon, excl_quest,
        parentheses_dash, quotes_density, upper_density,
        short_sentence_ratio, long_sentence_ratio, syllables_per_word, ari_readability
    ]


def extract_sequence_features(text: str):
    """18-dimensional sequence context and transition dynamics feature vector."""
    text_clean = text.strip()
    raw_sentences = split_sentences(text_clean)
    num_s = len(raw_sentences)

    words_per_s = [RE_WORD.findall(s.lower()) for s in raw_sentences]
    s_lens = [max(len(w), 1) for w in words_per_s]

    deltas = [abs(s_lens[i] - s_lens[i - 1]) for i in range(1, num_s)] if num_s > 1 else [0.0]
    mean_delta = float(np.mean(deltas))
    std_delta = float(np.std(deltas)) if len(deltas) > 1 else 0.0

    ratios = [s_lens[i] / (s_lens[i - 1] + 1e-5) for i in range(1, num_s)] if num_s > 1 else [1.0]
    ratio_var = float(np.var(ratios)) if len(ratios) > 1 else 0.0

    second_diffs = [abs((s_lens[i + 2] - s_lens[i + 1]) - (s_lens[i + 1] - s_lens[i])) for i in range(num_s - 2)] if num_s > 2 else [0.0]
    mean_jerk = float(np.mean(second_diffs))

    if num_s > 3 and np.std(s_lens) > 1e-4:
        with np.errstate(divide="ignore", invalid="ignore"):
            corr = np.corrcoef(s_lens[:-1], s_lens[1:])[0, 1]
            autocorr = float(corr) if not np.isnan(corr) else 0.0
    else:
        autocorr = 0.0

    end_marks = [s[-1] if s and s[-1] in ".!?" else "." for s in raw_sentences]
    punct_switches = sum(1 for i in range(1, num_s) if end_marks[i] != end_marks[i - 1])
    punct_switch_rate = punct_switches / max(num_s - 1, 1)

    clause_delims = [len(RE_CLAUSE_DELIM.findall(s)) for s in raw_sentences]
    delim_deltas = [abs(clause_delims[i] - clause_delims[i - 1]) for i in range(1, num_s)] if num_s > 1 else [0.0]
    mean_delim_delta = float(np.mean(delim_deltas))

    jaccards = []
    for i in range(1, num_s):
        set_a = set(words_per_s[i - 1])
        set_b = set(words_per_s[i])
        union_len = len(set_a | set_b)
        jaccards.append(len(set_a & set_b) / max(union_len, 1))
    if not jaccards:
        jaccards = [0.0]
    mean_jaccard = float(np.mean(jaccards))
    std_jaccard = float(np.std(jaccards)) if len(jaccards) > 1 else 0.0

    jaccard_drops = sum(1 for i in range(1, len(jaccards)) if jaccards[i] < jaccards[i - 1] - 0.15)
    jaccard_drop_rate = jaccard_drops / max(len(jaccards) - 1, 1)

    first_words = [w[0] if w else "" for w in words_per_s]
    opener_repeats = sum(1 for i in range(1, num_s) if first_words[i] and first_words[i] == first_words[i - 1])
    opener_repeat_rate = opener_repeats / max(num_s - 1, 1)

    is_trans = [s.strip().lower().startswith(TRANSITION_STARTS) for s in raw_sentences]
    trans_pairs = sum(1 for i in range(1, num_s) if is_trans[i] and is_trans[i - 1])
    trans_pair_rate = trans_pairs / max(num_s - 1, 1)

    pronoun_openers = sum(1 for w in first_words if w in PRONOUNS) / max(num_s, 1)
    the_openers = sum(1 for w in first_words if w in ("the", "this", "these", "that", "those")) / max(num_s, 1)

    uniform_runs = 0
    cur_run = 0
    for i in range(1, num_s):
        if abs(s_lens[i] - s_lens[i - 1]) <= 3:
            cur_run += 1
            if cur_run >= 2:
                uniform_runs += 1
        else:
            cur_run = 0
    uniform_run_ratio = uniform_runs / max(num_s - 1, 1)

    bins = [0 if l <= 10 else 1 if l <= 22 else 2 for l in s_lens]
    trans_counts = {}
    for i in range(1, len(bins)):
        pair = (bins[i - 1], bins[i])
        trans_counts[pair] = trans_counts.get(pair, 0) + 1
    total_trans = max(len(bins) - 1, 1)
    trans_entropy = -sum((c / total_trans) * math.log2(c / total_trans) for c in trans_counts.values() if c > 0)

    term_words = [w[-3:] if len(w) >= 3 else w for w in words_per_s]
    term_len_var = float(np.var([sum(len(t) for t in tw) for tw in term_words])) if num_s > 1 else 0.0

    len_span = max(s_lens) - min(s_lens)
    smoothness = float(mean_delta / (len_span + 1.0))

    return [
        mean_delta, std_delta, ratio_var, mean_jerk, autocorr,
        punct_switch_rate, mean_delim_delta, mean_jaccard, std_jaccard,
        jaccard_drop_rate, opener_repeat_rate, trans_pair_rate,
        pronoun_openers, the_openers, uniform_run_ratio, trans_entropy,
        term_len_var, smoothness
    ]
