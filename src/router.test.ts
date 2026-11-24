import { describe, expect, it } from "vitest";
import { decideRoute } from "./router";
import { taskById } from "./tasks";

const ctx = (over: Partial<{ charCount: number; nanoAvailable: boolean; offline: boolean }>) => ({
  charCount: 1000, nanoAvailable: true, offline: false, ...over,
});

describe("decideRoute", () => {
  it("forces cloud when the task needs user history", () => {
    expect(decideRoute(taskById("compare"), ctx({ offline: true })).route).toBe("cloud");
  });
  it("falls back to cloud when Nano is missing", () => {
    expect(decideRoute(taskById("firstRead"), ctx({ nanoAvailable: false })).route).toBe("cloud");
  });
  it("routes long pages to cloud", () => {
    expect(decideRoute(taskById("deepRead"), ctx({ charCount: 5000 })).why).toContain("4,000");
  });
  it("stays on device when offline and the model is ready", () => {
    expect(decideRoute(taskById("firstRead"), ctx({ offline: true }))).toEqual(
      expect.objectContaining({ route: "device", why: "offline" })
    );
  });
  it("skips AI entirely on tiny pages", () => {
    expect(decideRoute(taskById("firstRead"), ctx({ charCount: 50 })).why).toMatch(/too short/);
  });

  it("routes to device when nano is available, online, within charLimit", () => {
    expect(decideRoute(taskById("firstRead"), ctx({}))).toEqual(
      expect.objectContaining({ route: "device", why: "fits local model" })
    );
  });
  it("simplify task routes cloud when over 6000 chars", () => {
    expect(decideRoute(taskById("simplify"), ctx({ charCount: 7000 })).route).toBe("cloud");
  });
  it("deepRead over 4000 chars goes cloud", () => {
    expect(decideRoute(taskById("deepRead"), ctx({ charCount: 4500 })).route).toBe("cloud");
  });
  it("compare always goes cloud even when nano available and online", () => {
    expect(decideRoute(taskById("compare"), ctx({ offline: false, nanoAvailable: true })).route).toBe("cloud");
  });
  it("firstRead within 8000 chars stays on device", () => {
    expect(decideRoute(taskById("firstRead"), ctx({ charCount: 7999 })).route).toBe("device");
  });
  it("why message contains the task char limit for cloud routing", () => {
    const result = decideRoute(taskById("simplify"), ctx({ charCount: 9000 }));
    expect(result.route).toBe("cloud");
    expect(result.why).toContain("6,000");
  });
});
