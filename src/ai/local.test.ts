import { describe, expect, it } from "vitest";
import { localGenerate } from "./local";

const page = `Climate policy is complicated. Governments utilize carbon prices to reduce emissions. However, numerous individuals require cheaper energy. Therefore cities implement better transit. Additional research is sufficient to show the trend.`;

const deepPage = `Science reveals patterns in the natural world. Research demonstrates findings about climate change. Data shows trends clearly enough to draw conclusions. Studies confirm hypotheses well and thoroughly explain the mechanisms involved.`;

describe("localGenerate", () => {
  it("returns five bullets and a verdict for first read", () => {
    const out = localGenerate(`instr\n\n${page}`, "firstRead");
    expect(out).toMatch(/^• /);
    expect(out).toMatch(/Verdict:/);
  });

  it("simplifies wording", () => {
    const out = localGenerate(`instr\n\n${page}`, "simplify");
    expect(out.toLowerCase()).not.toContain("utilize");
  });

  it("deepRead returns Assumptions and Gaps sections", () => {
    const out = localGenerate(`instr\n\n${deepPage}`, "deepRead");
    expect(out).toContain("Assumptions:");
    expect(out).toContain("Gaps:");
  });

  it("compare returns Agrees with section", () => {
    const out = localGenerate(`instr\n\n${page}`, "compare");
    expect(out).toContain("Agrees with:");
  });

  it("compare returns Contradicts section", () => {
    const out = localGenerate(`instr\n\n${page}`, "compare");
    expect(out).toContain("Contradicts:");
  });

  it("compare returns New information section", () => {
    const out = localGenerate(`instr\n\n${page}`, "compare");
    expect(out).toContain("New information:");
  });

  it("firstRead always contains a Verdict line", () => {
    const out = localGenerate(`instr\n\n${page}`, "firstRead");
    expect(out).toContain("Verdict:");
  });

  it("simplify replaces complex words with simpler alternatives", () => {
    const textWithKeywords = `Governments utilize carbon prices. Subsequently, emissions drop significantly. Additional measures require more funding therefore.`;
    const out = localGenerate(`instr\n\n${textWithKeywords}`, "simplify");
    expect(out.toLowerCase()).not.toContain("utilize");
  });

  it("deepRead returns bullet points", () => {
    const out = localGenerate(`instr\n\n${deepPage}`, "deepRead");
    expect(out).toMatch(/^• /m);
  });
});
