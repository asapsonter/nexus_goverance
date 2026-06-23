"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/audit";
import type { VerificationStatus } from "@/lib/enums";

/** Verify / reject / reset a settlement milestone (recomputes progress). */
export async function setMilestoneVerification(
  milestoneId: string,
  formData: FormData,
) {
  const user = await requireCan("settlement.verify");
  const status = String(formData.get("status") ?? "") as VerificationStatus;

  const milestone = await prisma.settlementMilestone.update({
    where: { id: milestoneId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "verified" ? new Date() : null,
    },
  });

  await logAudit({
    actor: user,
    action: "settlement.verify",
    entityType: "SettlementMilestone",
    entityId: milestoneId,
    metadata: { status },
  });

  revalidatePath(`/settlements/${milestone.settlementId}`);
}

/** Record submitted evidence (a file reference) against a milestone. */
export async function recordMilestoneEvidence(
  milestoneId: string,
  formData: FormData,
) {
  const user = await requireCan("settlement.manage");
  const evidenceRef = String(formData.get("evidenceRef") ?? "").trim() || null;

  const milestone = await prisma.settlementMilestone.update({
    where: { id: milestoneId },
    // New evidence resets verification — it must be re-checked.
    data: { evidenceRef, verificationStatus: "pending", verifiedAt: null },
  });

  await logAudit({
    actor: user,
    action: "settlement.evidence_record",
    entityType: "SettlementMilestone",
    entityId: milestoneId,
  });

  revalidatePath(`/settlements/${milestone.settlementId}`);
}

/** Add a new milestone to a settlement. */
export async function addMilestone(settlementId: string, formData: FormData) {
  await requireCan("settlement.manage");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!title || !category || !deadlineRaw) return;

  await prisma.settlementMilestone.create({
    data: {
      settlementId,
      title,
      category,
      description,
      deadline: new Date(deadlineRaw),
      verificationStatus: "pending",
    },
  });

  revalidatePath(`/settlements/${settlementId}`);
}
