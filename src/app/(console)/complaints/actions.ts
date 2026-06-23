"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import type { ComplaintStatus } from "@/lib/enums";

/** Triage a complaint: set status, assignee, and (on resolve) a resolution. */
export async function updateComplaint(complaintId: string, formData: FormData) {
  await requireCan("complaint.assign");

  const status = String(formData.get("status") ?? "") as ComplaintStatus;
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const resolution = String(formData.get("resolution") ?? "").trim() || null;

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      assignedToId: assigneeId,
      resolution,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });

  revalidatePath("/complaints");
}
