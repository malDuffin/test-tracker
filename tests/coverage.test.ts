import { describe, expect, it } from "vitest";
import { abilitiesFromGtr, judgeCoverage, F_SEQ, F_DELDUP, F_REPEAT, F_TARGETED, F_METH } from "../src/lib/coverage";
import { profileFor } from "../src/lib/rules";
import { OFFERS } from "../src/data/labs";

const DMD = profileFor({ label: "Duchenne muscular dystrophy", genes: ["DMD"], kind: "g" });
const FXS = profileFor({ label: "Fragile X syndrome", genes: ["FMR1"], kind: "g" });

describe("judgeCoverage", () => {
  it("No when the gene is not in the test", () => {
    expect(judgeCoverage({ snv: "yes" }, false, ["snv"]).verdict).toBe("no");
  });
  it("Unknown when we cannot check the gene", () => {
    expect(judgeCoverage({ snv: "yes" }, null, ["snv"]).verdict).toBe("unknown");
  });
  it("Yes when every needed kind is found", () => {
    const r = judgeCoverage({ snv: "yes", indel: "yes", exon_cnv: "yes" }, true, DMD.needed);
    expect(r.verdict).toBe("yes");
    expect(r.found).toEqual(["exon_cnv", "snv", "indel"]);
  });
  it("Partly for a DMD sequencing-only test (may miss exon deletions)", () => {
    const r = judgeCoverage(abilitiesFromGtr(F_SEQ, 1, "DMD"), true, DMD.needed);
    expect(r.verdict).toBe("partly");
    expect(r.unclear).toContain("exon_cnv");
  });
  it("Yes for a DMD test with sequencing and del/dup", () => {
    expect(judgeCoverage(abilitiesFromGtr(F_SEQ | F_DELDUP, 1, "DMD"), true, DMD.needed).verdict).toBe("yes");
  });
  it("No for an exome on a repeat condition", () => {
    const exome = OFFERS.find((o) => o.id === "genedx-exome")!;
    expect(judgeCoverage(exome.abilities, true, FXS.needed).verdict).toBe("no");
  });
  it("Yes for a focused FMR1 repeat and methylation test", () => {
    expect(judgeCoverage(abilitiesFromGtr(F_REPEAT | F_METH | F_TARGETED, 1, "FMR1"), true, FXS.needed).verdict).toBe("yes");
  });
  it("Unknown repeat ability on big panels, because GTR lists methods per test", () => {
    const a = abilitiesFromGtr(F_SEQ | F_REPEAT, 300, "FMR1");
    expect(a.repeat).toBe("unknown");
    expect(judgeCoverage(a, true, FXS.needed).verdict).toBe("unknown");
  });
  it("Known variant: exon deletion and an exome without CNV is Unknown, with CNV is Yes", () => {
    const plain = OFFERS.find((o) => o.id === "genedx-exome")!;
    const cnv = OFFERS.find((o) => o.id === "revvity-exome")!;
    expect(judgeCoverage(plain.abilities, true, ["exon_cnv"]).verdict).toBe("unknown");
    expect(judgeCoverage(cnv.abilities, true, ["exon_cnv"]).verdict).toBe("yes");
  });
  it("Known variant: a microarray cannot find a single-letter change", () => {
    const cma = OFFERS.find((o) => o.id === "baylor-cma")!;
    expect(judgeCoverage(cma.abilities, true, ["snv"]).verdict).toBe("no");
  });
  it("mtDNA: Revvity exome includes mitochondrial DNA", () => {
    const rev = OFFERS.find((o) => o.id === "revvity-exome")!;
    expect(judgeCoverage(rev.abilities, true, ["mtdna"]).verdict).toBe("yes");
  });
});

describe("profileFor (testing order)", () => {
  it("DMD: exon del/dup first, then sequencing", () => {
    expect(DMD.category).toBe("dmd");
    expect(DMD.steps[0].title).toMatch(/missing or extra exons/);
    expect(DMD.steps[1].title).toMatch(/sequencing/);
  });
  it("repeat disorders need repeat sizing", () => {
    expect(FXS.category).toBe("repeat");
    expect(FXS.needed[0]).toBe("repeat");
    expect(profileFor({ label: "Huntington disease", genes: ["HTT"], kind: "g" }).category).toBe("repeat");
  });
  it("CACNA1A is a repeat condition only for SCA6", () => {
    expect(profileFor({ label: "Spinocerebellar ataxia type 6", genes: ["CACNA1A"], kind: "g" }).category).toBe("repeat");
    expect(profileFor({ label: "CACNA1A-related epilepsy", genes: ["CACNA1A"], kind: "g" }).category).toBe("gene");
  });
  it("mtDNA conditions need mtDNA testing", () => {
    expect(profileFor({ label: "MELAS", genes: ["MT-TL1"], kind: "m" }).needed).toEqual(["mtdna"]);
  });
  it("region syndromes start with a microarray", () => {
    const p = profileFor({ label: "Williams syndrome", genes: ["ELN"], kind: "rd" });
    expect(p.category).toBe("region");
    expect(p.steps[0].title).toMatch(/microarray/);
  });
  it("imprinting disorders start with methylation", () => {
    expect(profileFor({ label: "Angelman syndrome", genes: ["UBE3A"], kind: "g" }).category).toBe("methylation");
  });
  it("SMA uses an SMN1 copy number test and notes the look-alike gene", () => {
    const p = profileFor({ label: "Spinal muscular atrophy", genes: ["SMN1"], kind: "g" });
    expect(p.category).toBe("smn1");
    expect(p.notes[0].vars?.gene).toBe("SMN1");
  });
  it("non-genetic conditions say a genetic test may not help", () => {
    const p = profileFor({ label: "Myasthenia gravis", genes: [], kind: "n" });
    expect(p.category).toBe("nongene");
    expect(p.needed).toEqual([]);
  });
  it("undiagnosed route suggests exome or genome", () => {
    expect(profileFor(null).steps[0].title).toMatch(/exome or genome/);
  });
});
