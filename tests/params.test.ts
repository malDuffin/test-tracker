import { describe, expect, it } from "vitest";
import { parseParams } from "../src/lib/params";

describe("parseParams", () => {
  it("reads all parameters", () => {
    const p = parseParams("?name=Duchenne%20muscular%20dystrophy&gene=dmd&variant=c.1234A%3EG&country=gb&nation=sct&lang=fr");
    expect(p).toEqual({ name: "Duchenne muscular dystrophy", gene: "DMD", variant: "c.1234A>G", country: "GB", nation: "sct", lang: "fr", undiagnosed: false, subtype: null, d4z4Ru: null });
  });
  it("accepts UK as GB and ignores nation outside the UK", () => {
    expect(parseParams("country=UK").country).toBe("GB");
    expect(parseParams("country=IE&nation=sct").nation).toBeNull();
  });
  it("rejects bad values", () => {
    const p = parseParams("?gene=<script>&country=Ireland&lang=../../x");
    expect(p.gene).toBeNull();
    expect(p.country).toBeNull();
    expect(p.lang).toBeNull();
  });
  it("strips angle brackets and caps length", () => {
    expect(parseParams("?name=<b>Angelman</b>").name).toBe("bAngelman/b");
    expect(parseParams(`?variant=${"x".repeat(500)}`).variant!.length).toBe(200);
  });
  it("supports the undiagnosed mode and empty values", () => {
    expect(parseParams("?mode=undiagnosed").undiagnosed).toBe(true);
    expect(parseParams("?name=&gene=").name).toBeNull();
  });
});
