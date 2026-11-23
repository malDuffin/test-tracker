#!/usr/bin/env python3
"""Build a compact gene -> tests index from the NCBI Genetic Testing Registry (GTR).

GTR data is public domain (US National Library of Medicine). Credit: NCBI GTR,
https://www.ncbi.nlm.nih.gov/gtr/ . NIH does not verify lab submissions or endorse labs.

Usage (read-only download, about 13 MB; the raw file is deleted afterwards unless --keep):
  python3 scripts/build_gtr_index.py            # downloads test_version.gz to gtr-raw/
  python3 scripts/build_gtr_index.py --raw /path/test_version.gz --keep

Only genes in scripts/.catalogue-genes.txt (written by sync-catalogue.ts) are indexed.
Output:
  public/data/gtr/meta.json      build date, GTR file date, lab table, gene -> shard
  public/data/gtr/<shard>.json   per-gene summaries and up to MAX_LABS tests (best test per lab)
"""
import csv, gzip, json, os, re, sys, urllib.request, collections, email.utils

URL = "https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/test_version.gz"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data", "gtr")
MAX_LABS = 40
csv.field_size_limit(10**9)

# GTR lab_id -> curated lab id in src/data/labs.ts (hand-checked rows with prices etc.)
CURATED = {
    "500031": "invitae", "26957": "genedx", "500105": "fulgent", "239772": "preventiongenetics",
    "167595": "revvity", "61756": "ambry", "1006": "baylor", "506526": "variantyx",
    "500188": "blueprint", "279559": "centogene", "319947": "cegat",
}

F_SEQ, F_SEQ_PART, F_DELDUP, F_REPEAT, F_METH, F_TARGETED, F_CYTO, F_RNA, F_UPD = 1, 2, 4, 8, 16, 32, 64, 128, 256

def fix_text(s: str) -> str:
    """Some GTR names are double-encoded (UTF-8 read as Latin-1, e.g. 'UnityÂ®'). Undo that when it round-trips."""
    if any(ch in s for ch in "ÂÃâ"):
        try:
            return s.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            return s
    return s

def flags(cats: str, methods: str) -> int:
    c, m = cats.lower(), methods.lower()
    f = 0
    if "entire coding region" in c: f |= F_SEQ
    if "select exons" in c: f |= F_SEQ_PART
    if "deletion/duplication" in c: f |= F_DELDUP
    if re.search(r"repeat|southern", m): f |= F_REPEAT
    if "methylation" in c: f |= F_METH
    if "targeted variant" in c: f |= F_TARGETED
    if re.search(r"karyotyp|fish|in situ", c) or "microarray" in m: f |= F_CYTO
    if "rna analysis" in c: f |= F_RNA
    if "uniparental" in c: f |= F_UPD
    return f

def main():
    args = sys.argv[1:]
    raw = args[args.index("--raw") + 1] if "--raw" in args else os.path.join(ROOT, "gtr-raw", "test_version.gz")
    keep = "--keep" in args
    file_date = None
    if not os.path.exists(raw):
        os.makedirs(os.path.dirname(raw), exist_ok=True)
        print("downloading", URL)
        with urllib.request.urlopen(URL) as r, open(raw, "wb") as f:
            lm = r.headers.get("Last-Modified")
            if lm: file_date = email.utils.parsedate_to_datetime(lm).date().isoformat()
            f.write(r.read())
    if not file_date:
        try:
            req = urllib.request.Request(URL, method="HEAD")
            with urllib.request.urlopen(req) as r:
                file_date = email.utils.parsedate_to_datetime(r.headers["Last-Modified"]).date().isoformat()
        except Exception:
            file_date = None

    want = {g.strip().upper() for g in open(os.path.join(ROOT, "scripts", ".catalogue-genes.txt")) if g.strip()}
    labs = {}         # lab_id -> [name, country, curated]
    per_gene = collections.defaultdict(list)
    n_current = 0
    with gzip.open(raw, "rt", encoding="utf-8", errors="replace") as fh:
        for d in csv.DictReader(fh, delimiter="\t"):
            if (d["now_current"], d["test_currStat"], d["test_pubStat"], d["lab_currStat"]) != ("1", "1", "3", "1"):
                continue
            n_current += 1
            genes = [g.upper() for g in d["genes"].strip('"').split("|") if g]
            hits = [g for g in genes if g in want]
            if not hits:
                continue
            lid = d["lab_id"]
            if lid not in labs:
                labs[lid] = [fix_text(d["name_of_laboratory"].strip()), d["facility_country"].strip(), CURATED.get(lid)]
            fl = flags(d["method_categories"], d["methods"])
            row = (d["test_accession_ver"], lid, fix_text(d["lab_test_name"].strip())[:90], fl, len(genes), d["last_touch_date"][:10])
            for g in hits:
                per_gene[g].append(row)

    lab_ids = sorted(labs, key=lambda k: labs[k][0].lower())
    lab_index = {k: i for i, k in enumerate(lab_ids)}
    shards = collections.defaultdict(dict)
    gene_shard = {}
    stats = {"genes_with_tests": 0, "genes_with_deldup": 0, "genes_with_repeat": 0}
    for g, rows in per_gene.items():
        cap = collections.Counter()
        countries = set()
        best = {}
        for r in rows:
            fl = r[3]
            for name, bit in (("s", F_SEQ), ("p", F_SEQ_PART), ("d", F_DELDUP), ("r", F_REPEAT), ("m", F_METH), ("t", F_TARGETED), ("c", F_CYTO), ("u", F_UPD)):
                # GTR lists methods per test, not per gene. Repeat sizing and methylation on a
                # big panel usually apply to only a few genes, so only count focused tests (3 genes or fewer).
                if name in ("r", "m", "u") and r[4] > 3: continue
                if fl & bit: cap[name] += 1
            countries.add(labs[r[1]][1])
            score = (bin(fl & (F_SEQ | F_DELDUP | F_REPEAT | F_METH)).count("1"), -min(r[4], 100000), r[5])
            if r[1] not in best or score > best[r[1]][0]:
                best[r[1]] = (score, r)
        chosen = sorted((b[1] for b in best.values()), key=lambda r: (labs[r[1]][2] is None, -int(r[5].replace("-", "") or 0)))
        tests = [[r[0], lab_index[r[1]], r[2], r[3], r[4], r[5]] for r in chosen[:MAX_LABS]]
        shard = re.sub(r"[^A-Z0-9]", "_", g[:1])
        shards[shard][g] = {"n": len(rows), "l": len(best), "c": sorted(x for x in countries if x), "cap": dict(cap), "t": tests}
        gene_shard[g] = shard
        stats["genes_with_tests"] += 1
        if cap["d"]: stats["genes_with_deldup"] += 1
        if cap["r"]: stats["genes_with_repeat"] += 1

    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".json"): os.remove(os.path.join(OUT, f))
    for s, data in shards.items():
        with open(os.path.join(OUT, f"{s}.json"), "w") as f:
            json.dump(data, f, separators=(",", ":"))
    import datetime
    meta = {
        "built": datetime.date.today().isoformat(),
        "gtrFile": "test_version.gz",
        "gtrFileDate": file_date,
        "source": "NCBI Genetic Testing Registry (public domain). https://www.ncbi.nlm.nih.gov/gtr/",
        "currentTestsInGtr": n_current,
        "catalogueGenes": len(want),
        **stats,
        "labs": [labs[k] for k in lab_ids],
        "genes": gene_shard,
    }
    with open(os.path.join(OUT, "meta.json"), "w") as f:
        json.dump(meta, f, separators=(",", ":"))
    print(json.dumps({k: v for k, v in meta.items() if k not in ("labs", "genes")}), "labs:", len(lab_ids))
    if not keep and raw.startswith(os.path.join(ROOT, "gtr-raw")):
        os.remove(raw)
        print("deleted raw dump", raw)

if __name__ == "__main__":
    main()
