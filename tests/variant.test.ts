import { describe, expect, it } from "vitest";
import { classifyVariant } from "../src/lib/variant";

const cases: Array<[string, string]> = [
  ["c.1234A>G", "snv"],
  ["NM_004006.2:c.10171C>T", "snv"],
  ["p.Arg3381Ter", "snv"],
  ["p.(Gly12Asp)", "snv"],
  ["R553X", "snv"],
  ["missense", "snv"],
  ["c.6614+1G>A", "snv"],
  ["c.123del", "indel"],
  ["c.123_125delinsAT", "indel"],
  ["c.5899dup", "indel"],
  ["p.Leu45fs", "indel"],
  ["F508del", "indel"],
  ["frameshift", "indel"],
  ["deletion of exons 45-50", "exon_cnv"],
  ["del ex45-52", "exon_cnv"],
  ["exon 2 duplication", "exon_cnv"],
  ["Δ45-50", "exon_cnv"],
  ["c.(6438+1_6439-1)_(7098+1_7099-1)del", "exon_cnv"],
  ["deletion", "exon_cnv"],
  ["22q11.2 deletion", "large_cnv"],
  ["arr[GRCh38] 15q11.2q13.1(22770421_28823722)x1", "large_cnv"],
  ["whole gene deletion", "large_cnv"],
  ["CGG repeat 200", "repeat"],
  ["(CAG)45", "repeat"],
  ["GAA expansion", "repeat"],
  ["m.3243A>G", "mtdna"],
  ["MT-ND4 m.11778G>A", "mtdna"],
  ["mtDNA deletion", "mtdna"],
  ["loss of methylation at KvDMR1", "methylation"],
  ["paternal UPD", "methylation"],
  ["", "unknown"],
  ["something odd", "unknown"],
];

describe("classifyVariant", () => {
  it.each(cases)("%s -> %s", (input, kind) => {
    expect(classifyVariant(input).kind).toBe(kind);
  });
  it("flags deep intronic changes", () => {
    expect(classifyVariant("c.6614+3310G>T").hints).toContain("deep_intronic");
  });
  it("flags splice changes", () => {
    expect(classifyVariant("c.6614+1G>A").hints).toContain("splice");
  });
  it("handles null", () => {
    expect(classifyVariant(null).kind).toBe("unknown");
  });
});
