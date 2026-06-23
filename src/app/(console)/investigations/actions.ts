"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/audit";
import type { InvestigationStatus, VerificationStatus } from "@/lib/enums";

/** Change an investigation's case status. */
export async function updateInvestigationStatus(
  investigationId: string,
  status: InvestigationStatus,
) {
  const user = await requireCan("investigation.manage");
  await prisma.investigation.update({
    where: { id: investigationId },
    data: {
      status,
      closedAt: status === "closed" ? new Date() : null,
    },
  });
  await logAudit({
    actor: user,
    action: "investigation.status_change",
    entityType: "Investigation",
    entityId: investigationId,
    metadata: { status },
  });
  revalidatePath(`/investigations/${investigationId}`);
}

/**
 * Reveal an evidence file reference. THIS is the audit-logged "view evidence"
 * action — every reveal writes an AuditLog row.
 */
export async function revealEvidence(
  evidenceId: string,
): Promise<{ fileRef: string }> {
  const user = await requireCan("evidence.view");
  const evidence = await prisma.evidence.findUniqueOrThrow({
    where: { id: evidenceId },
  });

  await logAudit({
    actor: user,
    action: "evidence.view",
    entityType: "Evidence",
    entityId: evidenceId,
    metadata: { investigationId: evidence.investigationId },
  });

  return { fileRef: evidence.fileRef };
}

/** Mark an evidence item verified/rejected/pending. */
export async function setEvidenceVerification(
  evidenceId: string,
  formData: FormData,
) {
  const user = await requireCan("evidence.verify");
  const status = String(formData.get("status") ?? "") as VerificationStatus;

  const evidence = await prisma.evidence.update({
    where: { id: evidenceId },
    data: { verificationStatus: status },
  });

  await logAudit({
    actor: user,
    action: "evidence.verify",
    entityType: "Evidence",
    entityId: evidenceId,
    metadata: { status },
  });

  revalidatePath(`/investigations/${evidence.investigationId}`);
}
