import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getAdvisories,
  getCertifiedOrganizations,
  getPublicOrganizationScores,
  getPublishedSettlements,
  getSectorTrends,
  publicReader,
  searchOrganizations,
} from "@/lib/public-data";

/**
 * Boundary tests. They prove the public-data layer:
 *   (a) returns ONLY published rows (no internal data leaks), and
 *   (b) cannot even reach the confidential tables (compile-time + source scan).
 *
 * Requires a seeded database: run `pnpm db:seed` first.
 */

// A SEPARATE full-access client, used ONLY by the test to independently verify
// the truth about each row the public layer returned.
const fullDb = new PrismaClient();

afterAll(async () => {
  await fullDb.$disconnect();
});

const isPublished = (row: { visibility: string; publishedAt: Date | null }) =>
  row.visibility === "public" && row.publishedAt !== null;

describe("public-data: no internal rows leak", () => {
  it("scores: every returned org is genuinely published", async () => {
    const scores = await getPublicOrganizationScores();
    expect(scores.length).toBeGreaterThan(0);

    // Cross-check each against the full database.
    for (const s of scores) {
      const real = await fullDb.organization.findUniqueOrThrow({
        where: { slug: s.slug },
      });
      expect(isPublished(real)).toBe(true);
    }

    // Count parity: public count == truly-published count.
    const publishedCount = await fullDb.organization.count({
      where: { visibility: "public", publishedAt: { not: null } },
    });
    expect(scores.length).toBe(publishedCount);
  });

  it("scores: the internal-only org never appears", async () => {
    const scores = await getPublicOrganizationScores();
    // Seed marks "Lagoon Capital Fintech" visibility=internal.
    expect(scores.find((s) => s.slug === "lagoon-capital")).toBeUndefined();

    const lagoon = await fullDb.organization.findUniqueOrThrow({
      where: { slug: "lagoon-capital" },
    });
    expect(lagoon.visibility).toBe("internal"); // it exists, just hidden
  });

  it("scores: DTOs expose bands only — never raw scores", async () => {
    const scores = await getPublicOrganizationScores();
    for (const s of scores) {
      expect(s).toHaveProperty("riskBand");
      expect(s).not.toHaveProperty("riskScore");
      expect(s).not.toHaveProperty("consentRisk");
      expect(s).not.toHaveProperty("crossBorderRisk");
    }
  });

  it("certified directory: only certified + published orgs", async () => {
    const certified = await getCertifiedOrganizations();
    expect(certified.length).toBeGreaterThan(0);
    for (const c of certified) {
      const real = await fullDb.organization.findUniqueOrThrow({
        where: { slug: c.slug },
      });
      expect(real.certified).toBe(true);
      expect(isPublished(real)).toBe(true);
    }
  });

  it("advisories: the internal draft is excluded", async () => {
    const advisories = await getAdvisories();
    expect(advisories.length).toBeGreaterThan(0);
    expect(
      advisories.find((a) => a.slug === "draft-pending-enforcement"),
    ).toBeUndefined();

    for (const a of advisories) {
      const real = await fullDb.advisory.findUniqueOrThrow({
        where: { slug: a.slug },
      });
      expect(isPublished(real)).toBe(true);
    }
  });

  it("sector trends: only published trend rows feed the charts", async () => {
    const trends = await getSectorTrends();
    expect(trends.length).toBeGreaterThan(0);
    const publishedTrendCount = await fullDb.complianceTrend.count({
      where: { visibility: "public", publishedAt: { not: null } },
    });
    const returnedPoints = trends.reduce((n, t) => n + t.points.length, 0);
    expect(returnedPoints).toBe(publishedTrendCount);
  });

  it("search: returns a seeded certified org with its certification", async () => {
    const results = await searchOrganizations("Kano");
    const kano = results.find((r) => r.slug === "kano-crafts");
    expect(kano).toBeDefined();
    expect(kano?.certified).toBe(true);
    expect(kano?.certifications.length).toBeGreaterThan(0);
  });

  it("search: surfaces public warnings but never complaint internals", async () => {
    const results = await searchOrganizations("MediCare");
    const medicare = results.find((r) => r.slug === "medicare-hmo");
    expect(medicare).toBeDefined();
    // Warning comes from a published advisory, not the underlying complaint.
    expect(medicare?.warnings.length).toBeGreaterThan(0);
    expect(JSON.stringify(medicare)).not.toContain("CMP-"); // no complaint ref
  });

  it("search: the internal-only org cannot be rendered (unpublished)", async () => {
    const results = await searchOrganizations("Lagoon");
    expect(results).toHaveLength(0);
  });

  it("settlements: only published progress, no milestone/evidence fields", async () => {
    const settlements = await getPublishedSettlements();
    expect(settlements.length).toBeGreaterThan(0);

    for (const s of settlements) {
      const real = await fullDb.settlement.findUniqueOrThrow({
        where: { ref: s.ref },
      });
      expect(isPublished(real)).toBe(true);
      expect(real.progressPublished).toBe(true);
      // DTO carries only sanitized fields — no milestones/evidence leak through.
      expect(s).not.toHaveProperty("milestones");
      expect(s).not.toHaveProperty("totalFine");
      expect(JSON.stringify(s)).not.toContain("evidence");
    }
  });
});

describe("public-data: confidential tables are structurally unreachable", () => {
  it("publicReader has no confidential delegates (compile-time)", () => {
    // These lines must FAIL to type-check. `pnpm typecheck` enforces it; if any
    // confidential delegate became reachable, @ts-expect-error would error.

    // @ts-expect-error — evidence is not on PublicReader
    void publicReader.evidence;
    // @ts-expect-error — investigation is not on PublicReader
    void publicReader.investigation;
    // @ts-expect-error — complaint is not on PublicReader
    void publicReader.complaint;
    // @ts-expect-error — dataSubjectRequest is not on PublicReader
    void publicReader.dataSubjectRequest;
    // @ts-expect-error — auditLog is not on PublicReader
    void publicReader.auditLog;
    // @ts-expect-error — regulatorUser is not on PublicReader
    void publicReader.regulatorUser;
    // @ts-expect-error — settlementMilestone (evidence!) is not on PublicReader
    void publicReader.settlementMilestone;

    expect(true).toBe(true);
  });

  it("the source never references a confidential delegate", () => {
    const raw = readFileSync(
      fileURLToPath(new URL("./public-data.ts", import.meta.url)),
      "utf8",
    );
    // Strip comments first — the docstring intentionally mentions
    // `publicReader.evidence` as a "does not compile" example. We only care
    // about actual code accessing a confidential delegate.
    const src = raw
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    for (const forbidden of [
      ".investigation",
      ".evidence",
      ".complaint",
      ".settlementMilestone",
      ".dataSubjectRequest",
      ".remediationAction",
      ".auditLog",
      ".regulatorUser",
    ]) {
      expect(src).not.toContain(forbidden);
    }
  });
});
