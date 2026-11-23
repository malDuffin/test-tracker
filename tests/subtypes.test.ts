import { describe, expect, it } from "vitest";
import { applySubtype, choiceFromParams, parseFshdVariant, subtypeFromParams, subtypeOption, subtypeSetFor, unitsFromEcoRIkb, SUBTYPE_SETS } from "../src/data/subtypes";
import { profileFor } from "../src/lib/rules";
import { abilitiesFromGtr, judgeCoverage, F_SEQ, F_DELDUP, F_D4Z4 } from "../src/lib/coverage";
import { classifyVariant } from "../src/lib/variant";
import { OFFERS } from "../src/data/labs";
import { KITS, kitLine } from "../src/data/consumer";
import { parseParams } from "../src/lib/params";
import special from "../public/data/gtr/special.json";

const FSHD = { label: "Facioscapulohumeral muscular dystrophy", genes: ["SMCHD1", "DUX4", "DNMT3B", "LRIF1"], kind: "g" as const };
const set = subtypeSetFor(FSHD)!;
const prof = (id: string, ru: number | null = null) => applySubtype(profileFor(FSHD), subtypeOption(set, id), { id, ru }, set);

describe("FSHD subtypes", () => {
  it("matches FSHD by name or DUX4, not other conditions", () => {
    expect(set.id).toBe("fshd");
    expect(subtypeSetFor({ label: "FSHD2", genes: [] })?.id).toBe("fshd");
    expect(subtypeSetFor({ label: "Duchenne muscular dystrophy", genes: ["DMD"] })).toBeNull();
    expect(subtypeSetFor(null)).toBeNull();
  });

  it("has the stable ids shared with RDP and VV, Unknown first", () => {
    expect(set.options.map((o) => o.id)).toEqual(["unknown", "fshd1", "fshd2-smchd1", "fshd2-dnmt3b", "fshd2-lrif1", "fshd1-fshd2", "fshd1-mosaic", "fshd1-4q-deletion", "custom"]);
    expect(subtypeOption(set, null)?.id).toBe("unknown");
    expect(subtypeOption(set, "nonsense")?.id).toBe("unknown");
    expect(set.options.find((o) => o.id === "fshd2-dnmt3b")!.label).toMatch(/FSHD4/);
    expect(set.options.find((o) => o.id === "fshd2-lrif1")!.label).toMatch(/FSHD3/);
  });

  it("repeat box only for FSHD1, combined and mosaic", () => {
    expect(set.options.filter((o) => o.repeats).map((o) => o.id)).toEqual(["fshd1", "fshd1-fshd2", "fshd1-mosaic", "fshd1-4q-deletion"]);
  });

  it("Unknown and FSHD1 put D4Z4 sizing first and say panels cannot measure it", () => {
    for (const id of ["unknown", "fshd1", "custom"]) {
      const p = prof(id);
      expect(p.needed).toEqual(["d4z4"]);
      expect(p.specialTests).toBe("fshd-d4z4");
      expect(p.steps[0].title).toMatch(/D4Z4 sizing/);
      expect(p.steps[0].why).toMatch(/panels, exomes, genomes and consumer DNA kits cannot measure D4Z4/);
      expect(p.steps[1].title).toMatch(/FSHD2/);
    }
    expect(profileFor(FSHD).needed).toEqual(["d4z4"]);
  });

  it("FSHD2 options show that gene and mention 4qA and D4Z4 methylation", () => {
    const p = prof("fshd2-dnmt3b");
    expect(p.genes).toEqual(["DNMT3B"]);
    expect(p.specialTests).toBeUndefined();
    expect(p.needed).toContain("snv");
    expect(JSON.stringify(p.steps)).toMatch(/4qA/);
    expect(JSON.stringify(p.steps)).toMatch(/D4Z4 methylation/);
  });

  it("combined needs D4Z4 sizing and SMCHD1: a panel alone is only Partly", () => {
    const p = prof("fshd1-fshd2");
    expect(p.specialTests).toBe("fshd-d4z4");
    expect(p.genes?.[0]).toBe("SMCHD1");
    expect(p.needed).toEqual(expect.arrayContaining(["d4z4", "snv"]));
    expect(judgeCoverage(abilitiesFromGtr(F_SEQ | F_DELDUP, 1, "SMCHD1"), true, p.needed).verdict).toBe("partly");
  });

  it("mosaic asks for sizing that can detect mosaicism", () => {
    const p = prof("fshd1-mosaic");
    expect(p.steps[0].title).toMatch(/mosaicism/);
    expect(p.steps[0].title).toMatch(/optical genome mapping|Southern blot/);
    expect(p.specialTests).toBe("fshd-d4z4");
  });

  it("4q deletion: sizing that sees deletions, extended blot, no panels or kits", () => {
    const o = subtypeOption(set, "fshd1-4q-deletion")!;
    expect(o.label).toBe("FSHD1 with a 4q deletion");
    const p = prof("fshd1-4q-deletion");
    expect(p.needed).toEqual(["d4z4"]);
    expect(p.steps[0].title).toMatch(/optical genome mapping/);
    expect(p.steps[1].why).toMatch(/p13E-11/);
    expect(JSON.stringify(p.notes)).toMatch(/panels, exomes, genomes and consumer DNA kits cannot detect a 4q deletion/);
    expect(p.sources.map((s) => s.url)).toContain("https://www.ncbi.nlm.nih.gov/books/NBK1443/");
    const g = (special as unknown as Record<string, { t: [string, number, string, string, string][] }>)["fshd-d4z4"];
    const shown = g.t.filter((r) => o.specialMethods!.test(r[3]));
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((r) => /optical|combing/i.test(r[3]))).toBe(true);
  });

  it("repeat unit notes by range", () => {
    expect(JSON.stringify(prof("fshd1", 5).notes)).toMatch(/usual FSHD1 range/);
    expect(JSON.stringify(prof("fshd1", 9).notes)).toMatch(/borderline/);
    expect(JSON.stringify(prof("fshd1", 2).notes)).toMatch(/earlier onset/);
    expect(JSON.stringify(prof("fshd1", 14).notes)).toMatch(/11 or more/);
    expect(JSON.stringify(prof("fshd2-smchd1", 9).notes)).not.toMatch(/borderline/);
  });

  it("EcoRI kb helper: (kb - 5) / 3.3", () => {
    expect(unitsFromEcoRIkb(18)).toBe(4);
    expect(unitsFromEcoRIkb(40)).toBe(11);
    expect(unitsFromEcoRIkb(4)).toBeNull();
    expect(unitsFromEcoRIkb(NaN)).toBeNull();
  });

  it("exomes, genomes, microarrays and kits cannot find D4Z4", () => {
    for (const o of OFFERS.filter((o) => o.type !== "visit")) {
      expect(["no", "unknown"], o.id).toContain(judgeCoverage(o.abilities, true, ["d4z4"]).verdict);
    }
    for (const k of KITS) expect(kitLine(k, ["d4z4"], null).text).toMatch(/D4Z4/);
  });

  it("GTR: sequencing tests say No for D4Z4, D4Z4 sizing tests say Yes", () => {
    expect(judgeCoverage(abilitiesFromGtr(F_SEQ | F_DELDUP, 1, "SMCHD1"), true, ["d4z4"]).verdict).toBe("no");
    expect(judgeCoverage(abilitiesFromGtr(F_D4Z4, 1, "DUX4"), true, ["d4z4"]).verdict).toBe("yes");
  });

  it("special.json lists only real GTR D4Z4 sizing tests with explicit methods", () => {
    const g = (special as unknown as Record<string, { badge: string; t: [string, number, string, string, string][] }>)["fshd-d4z4"];
    expect(g.t.length).toBeGreaterThanOrEqual(1);
    expect(g.badge).toMatch(/D4Z4/);
    for (const [acc, , , methods, date] of g.t) {
      expect(acc).toMatch(/^GTR\d+\.\d+$/);
      expect(methods).toMatch(/optical|southern|combing/i);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("FSHD ?variant formats (shared with RDP and VV)", () => {
  it("reads the shared stored strings", () => {
    expect(parseFshdVariant("Unknown")).toMatchObject({ id: "unknown" });
    expect(parseFshdVariant("FSHD1: 6 RU, 4qA")).toMatchObject({ id: "fshd1", ru: 6, hap: "4qA" });
    expect(parseFshdVariant("FSHD2 (SMCHD1): c.1876A>G")).toMatchObject({ id: "fshd2-smchd1", change: "c.1876A>G" });
    expect(parseFshdVariant("FSHD1 + FSHD2: 9 RU, SMCHD1 c.1876A>G")).toMatchObject({ id: "fshd1-fshd2", ru: 9 });
    expect(parseFshdVariant("Mosaic FSHD1: 4 RU")).toMatchObject({ id: "fshd1-mosaic", ru: 4 });
    expect(parseFshdVariant("FSHD1 with a 4q deletion: 3 RU")).toMatchObject({ id: "fshd1-4q-deletion", ru: 3 });
    expect(parseFshdVariant("FSHD4")).toMatchObject({ id: "fshd2-dnmt3b" });
    expect(parseFshdVariant("FSHD3")).toMatchObject({ id: "fshd2-lrif1" });
    expect(parseFshdVariant("proximally extended deletion")).toMatchObject({ id: "fshd1-4q-deletion" });
    expect(parseFshdVariant("")).toBeNull();
  });

  it("keeps Custom text exactly as written (trimmed only)", () => {
    expect(parseFshdVariant("Custom: EcoRI/BlnI fragment 24 kb")).toMatchObject({ id: "custom", custom: "EcoRI/BlnI fragment 24 kb" });
    expect(parseFshdVariant("custom:   hybrid 4q-10q allele  ")).toMatchObject({ id: "custom", custom: "hybrid 4q-10q allele" });
    expect(parseFshdVariant("cis-duplication")).toMatchObject({ id: "custom", custom: "cis-duplication" });
    const c = { id: "custom", custom: "EcoRI/BlnI fragment 24 kb" };
    expect(set.display!(c, subtypeOption(set, "custom")!)).toBe("Custom: EcoRI/BlnI fragment 24 kb");
  });

  it("display strings match the shared stored strings", () => {
    const d = (c: { id: string; ru?: number | null; hap?: "4qA" | "4qB" | "4A166" | null; change?: string | null }) => set.display!(c, subtypeOption(set, c.id)!);
    expect(d({ id: "fshd1", ru: 5, hap: "4qA" })).toBe("FSHD1: 5 RU, 4qA");
    expect(d({ id: "fshd1" })).toBe("FSHD1");
    expect(d({ id: "fshd2-smchd1", change: "c.1876A>G" })).toBe("FSHD2 (SMCHD1): c.1876A>G");
    expect(d({ id: "fshd1-mosaic", ru: 4 })).toBe("Mosaic FSHD1: 4 RU");
    expect(d({ id: "fshd1-4q-deletion" })).toBe("FSHD1 with a 4q deletion");
    expect(d({ id: "unknown" })).toBe("Unknown");
  });

  it("haplotype notes", () => {
    const p = applySubtype(profileFor(FSHD), subtypeOption(set, "fshd1"), { id: "fshd1", ru: 5, hap: "4qB" }, set);
    expect(JSON.stringify(p.notes)).toMatch(/non-permissive/);
    expect(parseParams("?d4z4_hap=4qa").d4z4Hap).toBe("4qA");
    expect(parseParams("?d4z4_hap=xyz").d4z4Hap).toBeNull();
    expect(choiceFromParams(set, "fshd1", null, 6, "4qA")).toEqual({ id: "fshd1", ru: 6, hap: "4qA" });
  });

  it("?subtype, ?variant and ?d4z4_ru combine; nothing else needed", () => {
    expect(choiceFromParams(set, "fshd2-lrif1", null)).toEqual({ id: "fshd2-lrif1" });
    expect(choiceFromParams(set, null, "FSHD1: 6 RU")).toMatchObject({ id: "fshd1", ru: 6 });
    expect(parseParams("?fshd_type=fshd1-mosaic").subtype).toBe("fshd1-mosaic");
    expect(choiceFromParams(set, "fshd1", null, 7)).toEqual({ id: "fshd1", ru: 7 });
    expect(choiceFromParams(set, "mosaic-fshd1", null)).toEqual({ id: "fshd1-mosaic" });
    expect(choiceFromParams(set, "fshd1", "FSHD1: 6 RU, 4qA")).toMatchObject({ id: "fshd1", ru: 6, hap: "4qA" });
    expect(choiceFromParams(set, null, null)).toEqual({ id: "unknown" });
    expect(subtypeFromParams(set, null, "FSHD2 (SMCHD1): c.1234A>G")).toBe("fshd2-smchd1");
    expect(choiceFromParams(null, "fshd1", null)).toBeNull();
    expect(parseParams("?subtype=FSHD1").subtype).toBe("fshd1");
    expect(parseParams("?subtype=<x>").subtype).toBeNull();
    expect(parseParams("?fshd_type=fshd1-4q-deletion").subtype).toBe("fshd1-4q-deletion");
    expect(choiceFromParams(set, "fshd1-4q-deletion", null)).toEqual({ id: "fshd1-4q-deletion" });
    expect(parseParams("?d4z4_ru=5").d4z4Ru).toBe(5);
    expect(parseParams("?d4z4_ru=0").d4z4Ru).toBeNull();
    expect(parseParams("?d4z4_ru=abc").d4z4Ru).toBeNull();
  });

  it("classifies D4Z4 wording as a D4Z4 change", () => {
    expect(classifyVariant("D4Z4 contraction (7 units)").kind).toBe("d4z4");
    expect(classifyVariant("4q35 deletion").kind).toBe("d4z4");
  });

  it("every subtype set has a default first option and unique ids", () => {
    for (const s of SUBTYPE_SETS) {
      expect(s.options[0].id).toBe("unknown");
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length);
    }
  });
});
