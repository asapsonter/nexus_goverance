"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import type { RemediationStatus } from "@/lib/enums";

/** Update a remediation action's status. */
export async function updateRemediationStatus(
  actionId: string,
  formData: FormData,
) {
  await requireCan("remediation.manage");
  const status = String(formData.get("status") ?? "") as RemediationStatus;

  await prisma.remediationAction.update({
    where: { id: actionId },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
  });

  revalidatePath("/remediation");
}
