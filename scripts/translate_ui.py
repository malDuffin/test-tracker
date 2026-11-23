#!/usr/bin/env python3
"""Machine-translate public/i18n/en.json into the suite languages with an offline model.

Uses NLLB-200 distilled 1.3B (CTranslate2 int8 build), run locally: no text leaves the machine.
Translations are machine made and NOT medically reviewed; public/i18n/_meta.json says so and the
app shows a notice in every non-English language.

Setup (about 1.6 GB, delete afterwards):
  python3 -m venv /tmp/nllb/venv && /tmp/nllb/venv/bin/pip install ctranslate2 sentencepiece
  download config.json, model.bin, sentencepiece.bpe.model, shared_vocabulary.txt from
  https://huggingface.co/JustFrederik/nllb-200-distilled-1.3B-ct2-int8 into /tmp/nllb
Run:
  NLLB_DIR=/tmp/nllb /tmp/nllb/venv/bin/python scripts/translate_ui.py [lang ...]
Only missing or changed keys are translated; existing translations are kept.
"""
import json, os, re, sys, datetime
import ctranslate2, sentencepiece as spm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(ROOT, "public", "i18n")
MODEL = os.environ.get("NLLB_DIR", "/workspace/tt-nllb")
CODES = {
    "ar": "arb_Arab", "de": "deu_Latn", "el": "ell_Grek", "es": "spa_Latn", "fa": "pes_Arab", "fi": "fin_Latn",
    "fr": "fra_Latn", "ga": "gle_Latn", "he": "heb_Hebr", "hi": "hin_Deva", "hr": "hrv_Latn", "ja": "jpn_Jpan",
    "ko": "kor_Hang", "nl": "nld_Latn", "pt-BR": "por_Latn", "ru": "rus_Cyrl", "sk": "slk_Latn", "sr": "srp_Cyrl",
    "sv": "swe_Latn", "tr": "tur_Latn", "vi": "vie_Latn", "zh-Hans": "zho_Hans", "zh-Hant": "zho_Hant",
}
# Words kept exactly as they are (names, abbreviations, gene-like tokens)
KEEP = ["Test Tracker", "Rare Disease Planet", "Rare Disease Body", "Variant Visual", "Genome Medical", "Northway Clinic",
        "Probably Genetic", "Blueprint Genetics", "CENTOGENE", "CeGaT", "23andMe", "AncestryDNA", "UDNF", "GTR", "NIH",
        "NHS", "HSE", "AWMGS", "MLPA", "FSHD", "D4Z4", "SMCHD1", "SMN1", "SMN2", "DMD", "CMA", "CNV", "mtDNA", "RNA", "GP",
        "team@rarediseaseplanet.com", "ncbi.nlm.nih.gov/gtr", "udnf.org", "Medicaid"]
PH = re.compile(r"\{\{\w+\}\}")

def protect(s):
    toks = []
    def sub(m):
        toks.append(m.group(0))
        return f"[{len(toks)}]"
    s = PH.sub(sub, s)
    for w in sorted(KEEP, key=len, reverse=True):
        if w in s:
            toks.append(w)
            s = s.replace(w, f"[{len(toks)}]")
    return s, toks

def restore(s, toks):
    for i, tok in enumerate(toks, 1):
        if f"[{i}]" not in s:
            return None
        s = s.replace(f"[{i}]", tok)
    return s

SPLIT = re.compile(r"(?<=[.?!])\s+(?=[A-Z(])")
CJK = {"ja", "zh-Hans", "zh-Hant", "ko"}

def looks_bad(src, out, lang):
    if not out or "\u2047" in out or "??" in out:
        return True
    ratio = len(out) / max(1, len(src))
    lo, hi = (0.2, 2.5) if lang in CJK else (0.45, 3.0)
    return not (lo <= ratio <= hi)

def main():
    langs = sys.argv[1:] or list(CODES)
    en = json.load(open(os.path.join(I18N, "en.json")))
    sp = spm.SentencePieceProcessor(model_file=os.path.join(MODEL, "sentencepiece.bpe.model"))
    tr = ctranslate2.Translator(MODEL, device="cpu", compute_type="int8", intra_threads=int(os.environ.get("THREADS", "2")))
    stats = {}
    for lang in langs:
        path = os.path.join(I18N, f"{lang}.json")
        old = json.load(open(path)) if os.path.exists(path) else {}
        todo = [k for k in en if k not in old]
        # Translate sentence by sentence (the model tends to drop later sentences), then rejoin.
        pieces = []  # (key index, sentence index, protected text, tokens)
        for ki, k in enumerate(todo):
            for si, sent in enumerate(SPLIT.split(k)):
                ptxt, toks = protect(sent)
                pieces.append((ki, si, sent, ptxt, toks))
        src = [["eng_Latn"] + sp.encode(p[3], out_type=str) + ["</s>"] for p in pieces]
        done = {}
        for i in range(0, len(src), 16):
            batch = src[i:i + 16]
            res = tr.translate_batch(batch, target_prefix=[[CODES[lang]]] * len(batch), beam_size=2, max_decoding_length=200)
            for j, r in enumerate(res):
                ki, si, sent, ptxt, toks = pieces[i + j]
                text = sp.decode(r.hypotheses[0][1:]).strip()
                fixed = restore(text, toks)
                if fixed is None or looks_bad(ptxt, text, lang):
                    fixed = None
                done.setdefault(ki, {})[si] = fixed
        out = {}
        fails = 0
        for ki, k in enumerate(todo):
            parts = done.get(ki, {})
            n = len(SPLIT.split(k))
            if any(parts.get(si) is None for si in range(n)):
                fails += 1
                continue  # leave it out: the app falls back to English
            joiner = "" if lang in CJK else " "
            out[k] = joiner.join(parts[si] for si in range(n)).replace("\u2014", ",")
        merged = {k: v for k, v in {**old, **out}.items() if k in en}
        json.dump(dict(sorted(merged.items())), open(path, "w"), ensure_ascii=False, indent=1)
        stats[lang] = {"translated": len(merged), "fallbackToEnglish": len(en) - len(merged), "newFails": fails}
        print(lang, stats[lang], flush=True)
    meta_path = os.path.join(I18N, "_meta.json")
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    meta.update({
        "note": "All non-English files are machine translated (NLLB-200 distilled 600M, offline) and not medically reviewed. Missing keys fall back to English.",
        "updated": datetime.date.today().isoformat(),
        "languages": {**meta.get("languages", {}), **stats},
    })
    json.dump(meta, open(meta_path, "w"), indent=1)

if __name__ == "__main__":
    main()
