import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * THE PUBLIC READ BOUNDARY.
 *
 * The public portal (Modules 14 & 15) may ONLY read through this module. Two
 * independent guarantees keep confidential data on the other side of the wall:
 *
 *  1. COMPILE-TIME: `publicReader` is typed to expose only the safe model
 *     delegates. Confidential tables (investigation, evidence, complaint,
 *     settlementMilestone, dataSubjectRequest, remediationAction, auditLog,
 *     regulatorUser) are absent from its type — `publicReader.evidence` does
 *     not type-check, so a leak can't compile.
 *
 *  2. RUNTIME: every query filters `visibility: "public"` AND
 *     `publishedAt != null`, and projects results into DTOs that omit internal
 *     fields (e.g. raw riskScore → coarse riskBand only).
 */

// The only model delegates the public layer is allowed to touch. Settlement is
// publicly-surfaceable (it carries visibility/publishedAt), but note that the
// confidential SettlementMilestone delegate is deliberately NOT here — the
// public layer can never read milestone evidence.
type PublicModelKey =
  | "organization"
  | "sector"
  | "complianceTrend"
  | "advisory"
  | "certification"
  | "settlement";

export type PublicReader = Pick<PrismaClient, PublicModelKey>;

// The full client structurally satisfies the narrowed type; assigning it here
// is the single, intentional bottleneck. Everything below uses `publicReader`,
// never `prisma`, so confidential delegates are unreachable from this file.
export const publicReader: PublicReader = prisma;

// Reused predicate: a row is public iff it is explicitly published.
const PUBLISHED = {
  visibility: "public",
  publishedAt: { not: null },
} as const;

// ---------------------------------------------------------------------------
// DTOs — the exact shapes that may cross the boundary. No internal fields.
// ---------------------------------------------------------------------------

export type PublicScore = {
  name: string;
  slug: string;
  sector: string;
  riskBand: string; // band only — never the raw 0–100 score
  certified: boolean;
};

export type PublicCertification = {
  scheme: string;
  certNumber: string;
  status: string;
  issuedAt: Date;
  expiresAt: Date | null;
};

export type PublicCertifiedOrg = {
  name: string;
  slug: string;
  sector: string;
  certifications: PublicCertification[];
};

export type PublicTrendPoint = { period: string; avgRiskScore: number };

export type PublicSectorTrend = {
  sectorKey: string;
  sectorName: string;
  points: PublicTrendPoint[];
};

export type PublicAdvisory = {
  slug: string;
  title: string;
  summary: string;
  type: string;
  severity: string | null;
  sector: string | null;
  // Only an explicit display label is ever exposed — never a traversed org name.
  organization: string | null;
  publishedAt: Date | null;
};

export type PublicWarning = {
  slug: string;
  title: string;
  summary: string;
  severity: string | null;
};

export type PublicSettlement = {
  ref: string;
  organization: string;
  sector: string;
  summary: string; // sanitized publicSummary only
  progress: number; // published snapshot %
  status: string;
};

export type PublicOrgSearchResult = {
  name: string;
  slug: string;
  sector: string;
  riskBand: string;
  certified: boolean;
  certifications: PublicCertification[];
  warnings: PublicWarning[];
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** General privacy scores as bands (not raw scores) for published orgs. */
export async function getPublicOrganizationScores(): Promise<PublicScore[]> {
  const rows = await publicReader.organization.findMany({
    where: PUBLISHED,
    select: {
      name: true,
      slug: true,
      riskBand: true,
      certified: true,
      sector: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((o) => ({
    name: o.name,
    slug: o.slug,
    sector: o.sector.name,
    riskBand: o.riskBand,
    certified: o.certified,
  }));
}

/** Directory of certified organizations with their active public certs. */
export async function getCertifiedOrganizations(): Promise<
  PublicCertifiedOrg[]
> {
  const rows = await publicReader.organization.findMany({
    where: { ...PUBLISHED, certified: true },
    select: {
      name: true,
      slug: true,
      sector: { select: { name: true } },
      certifications: {
        where: { ...PUBLISHED, status: "active" },
        select: {
          scheme: true,
          certNumber: true,
          status: true,
          issuedAt: true,
          expiresAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((o) => ({
    name: o.name,
    slug: o.slug,
    sector: o.sector.name,
    certifications: o.certifications,
  }));
}

/**
 * Published settlement progress. Returns only the sanitized snapshot
 * (publicSummary + publishedProgress) — milestones and their evidence are never
 * selected, and SettlementMilestone is not even reachable from publicReader.
 */
export async function getPublishedSettlements(): Promise<PublicSettlement[]> {
  const rows = await publicReader.settlement.findMany({
    where: { ...PUBLISHED, progressPublished: true },
    select: {
      ref: true,
      status: true,
      publicSummary: true,
      publishedProgress: true,
      org: { select: { name: true, sector: { select: { name: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return rows.map((s) => ({
    ref: s.ref,
    organization: s.org.name,
    sector: s.org.sector.name,
    summary: s.publicSummary ?? "",
    progress: s.publishedProgress ?? 0,
    status: s.status,
  }));
}

/** Anonymized, sector-level compliance trends for charts. */
export async function getSectorTrends(): Promise<PublicSectorTrend[]> {
  const rows = await publicReader.complianceTrend.findMany({
    where: PUBLISHED,
    select: {
      period: true,
      avgRiskScore: true,
      sector: { select: { key: true, name: true } },
    },
    orderBy: { periodStart: "asc" },
  });

  const bySector = new Map<string, PublicSectorTrend>();
  for (const r of rows) {
    const existing = bySector.get(r.sector.key);
    const point = { period: r.period, avgRiskScore: r.avgRiskScore };
    if (existing) {
      existing.points.push(point);
    } else {
      bySector.set(r.sector.key, {
        sectorKey: r.sector.key,
        sectorName: r.sector.name,
        points: [point],
      });
    }
  }
  return [...bySector.values()];
}

/** Published advisories and resolved-case writeups. */
export async function getAdvisories(
  type?: string,
): Promise<PublicAdvisory[]> {
  const rows = await publicReader.advisory.findMany({
    where: { ...PUBLISHED, ...(type ? { type } : {}) },
    select: {
      slug: true,
      title: true,
      summary: true,
      type: true,
      severity: true,
      orgNameOverride: true,
      publishedAt: true,
      sector: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return rows.map((a) => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    type: a.type,
    severity: a.severity,
    sector: a.sector?.name ?? null,
    organization: a.orgNameOverride ?? null,
    publishedAt: a.publishedAt,
  }));
}

/**
 * Citizen search: find published orgs by name, returning certification status
 * and any unresolved PUBLIC compliance warnings (sourced from advisories, never
 * from raw complaints/investigations).
 */
export async function searchOrganizations(
  query: string,
): Promise<PublicOrgSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await publicReader.organization.findMany({
    where: { ...PUBLISHED, name: { contains: q } },
    select: {
      name: true,
      slug: true,
      riskBand: true,
      certified: true,
      sector: { select: { name: true } },
      certifications: {
        where: { ...PUBLISHED, status: "active" },
        select: {
          scheme: true,
          certNumber: true,
          status: true,
          issuedAt: true,
          expiresAt: true,
        },
      },
      advisories: {
        where: { ...PUBLISHED, type: "warning" },
        select: {
          slug: true,
          title: true,
          summary: true,
          severity: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return rows.map((o) => ({
    name: o.name,
    slug: o.slug,
    sector: o.sector.name,
    riskBand: o.riskBand,
    certified: o.certified,
    certifications: o.certifications,
    warnings: o.advisories,
  }));
}
