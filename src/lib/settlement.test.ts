import { describe, expect, it } from "vitest";
import { computeProgress } from "@/lib/settlement";

describe("settlement: computeProgress", () => {
  it("is 0 with no milestones", () => {
    expect(computeProgress([])).toBe(0);
  });

  it("counts only verified milestones", () => {
    const milestones = [
      { verificationStatus: "verified" },
      { verificationStatus: "verified" },
      { verificationStatus: "pending" },
      { verificationStatus: "rejected" },
    ];
    expect(computeProgress(milestones)).toBe(50);
  });

  it("verifying one more milestone increases progress", () => {
    const before = computeProgress([
      { verificationStatus: "verified" },
      { verificationStatus: "pending" },
    ]);
    const after = computeProgress([
      { verificationStatus: "verified" },
      { verificationStatus: "verified" },
    ]);
    expect(after).toBeGreaterThan(before);
    expect(after).toBe(100);
  });
});
