"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/audit";
import { computeProgress } from "@/lib/settlement";

/**
 * THE PUBLISH BOUNDARY (write side).
 *
 * The ONLY way internal records become public. Each function produces a
 * sanitized snapshot — it sets visibility="public" + publishedAt and copies
 * across ONLY the fields safe to disclose. It never copies confidential
 * evidence, complainant identity, or raw internal scores. Every publish/redact
 * is audit-logged.
 *
 * The read side (src/lib/public-data.ts) then exposes only these published rows.
 */

// ---- Settlements ----------------------------------------------------------

/**
 * Publish a settlement's PROGRESS only. We snapshot the verified-milestone
 * percentage into `publishedProgress` and a sanitized `publicSummary`; the
 * milestones themselves (and their evidence) never cross the wall.
 */
export async function publishSettlement(settlementId: string) {
  const user = await requireCan("settlement.manage");

  const settlement = await prisma.settlement.findUniqueOrThrow({
    where: { id: settlementId },
    include: {
      org: { select: { name: true } },
      milestones: { select: { verificationStatus: true } },
    },
  });

  const progress = computeProgress(settlement.milestones);
  const publicSummary =
    settlement.publicSummary ??
    `${settlement.org.name} is delivering court-agreed corrective actions. Progress is independently verified.`;

  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      progressPublished: true,
      publishedProgress: progress,
      publicSummary,
      visibility: "public",
      publishedAt: new Date(),
    },
  });

  await logAudit({
    actor: user,
    action: "settlement.publish",
    entityType: "Settlement",
    entityId: settlementId,
    metadata: { progress },
  });

  revalidatePath(`/settlements/${settlementId}`);
  revalidatePath("/transparency");
}

/** Redact a settlement from the public layer. */
export async function unpublishSettlement(settlementId: string) {
  const user = await requireCan("settlement.manage");

  await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      progressPublished: false,
      publishedProgress: null,
      visibility: "internal",
      publishedAt: null,
    },
  });

  await logAudit({
    actor: user,
    action: "settlement.unpublish",
    entityType: "Settlement",
    entityId: settlementId,
  });

  revalidatePath(`/settlements/${settlementId}`);
  revalidatePath("/transparency");
}

// ---- Advisories -----------------------------------------------------------

/** Publish an advisory/resolved-case writeup to the transparency portal. */
export async function publishAdvisory(advisoryId: string) {
  const user = await requireCan("notice.issue");
  await prisma.advisory.update({
    where: { id: advisoryId },
    data: { visibility: "public", publishedAt: new Date() },
  });
  await logAudit({
    actor: user,
    action: "advisory.publish",
    entityType: "Advisory",
    entityId: advisoryId,
  });
  revalidatePath("/transparency/advisories");
}
