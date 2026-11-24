import { describe, expect, it } from "vitest";
import { countChars, sentences } from "./extract";

describe("extract helpers", () => {
  it("counts compact characters", () => {
    expect(countChars("  hello   world  ")).toBe(11);
  });

  it("splits sentences", () => {
    const parts = sentences("First claim is here. Second claim follows! Short.");
    expect(parts.some((s) => s.includes("First claim"))).toBe(true);
    expect(parts.some((s) => s.includes("Second claim"))).toBe(true);
  });

  it("returns empty array for empty string", () => {
    expect(sentences("")).toEqual([]);
  });

  it("handles single short sentence under min length", () => {
    expect(sentences("Hi.")).toEqual([]);
  });

  it("sentences: long enough sentences are kept", () => {
    const s = sentences("This is a long enough sentence to pass the filter. Another equally long sentence follows here.");
    expect(s.length).toBeGreaterThanOrEqual(1);
  });

  it("countChars handles already compact string", () => {
    expect(countChars("hello world")).toBe(11);
  });

  it("countChars returns 0 for empty string", () => {
    expect(countChars("")).toBe(0);
  });

  it("sentences handles multiple exclamation marks", () => {
    const parts = sentences("Breaking news happened today. Everything changed forever! Nothing will ever be the same again.");
    expect(parts.length).toBeGreaterThanOrEqual(1);
  });
});
