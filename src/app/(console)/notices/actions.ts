"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/audit";

export type NoticeFormState = { error?: string; ok?: boolean };

/** Issue an enforcement notice. Requires the notice.issue permission. */
export async function issueNotice(
  _prev: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const user = await requireCan("notice.issue");

  const orgId = String(formData.get("orgId") ?? "");
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const dueRaw = String(formData.get("dueDate") ?? "");
  const publish = formData.get("publish") === "on";

  if (!orgId || !type || !title) {
    return { error: "Organization, type and title are required." };
  }

  const year = new Date().getFullYear();
  const count = await prisma.enforcementNotice.count();
  const ref = `NTC-${year}-${String(count + 1).padStart(3, "0")}`;

  const notice = await prisma.enforcementNotice.create({
    data: {
      ref,
      orgId,
      type,
      title,
      summary,
      status: "issued",
      issuedAt: new Date(),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      issuedById: user.id,
      visibility: publish ? "public" : "internal",
      publishedAt: publish ? new Date() : null,
    },
  });

  await logAudit({
    actor: user,
    action: "notice.issue",
    entityType: "EnforcementNotice",
    entityId: notice.id,
    metadata: { ref, type },
  });

  revalidatePath("/notices");
  return { ok: true };
}
