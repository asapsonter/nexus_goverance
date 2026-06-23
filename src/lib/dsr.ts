import { prisma } from "@/lib/prisma";

/**
 * Escalation sweep: any data-subject request past its SLA and still unresolved
 * is flipped to "escalated" (with a timeline event). The console dashboard runs
 * this on load so escalations surface to regulators automatically.
 *
 * Returns the number of requests escalated this run.
 */
export async function escalateOverdueRequests(): Promise<number> {
  const now = new Date();
  const overdue = await prisma.dataSubjectRequest.findMany({
    where: {
      slaDueAt: { lt: now },
      escalated: false,
      status: { notIn: ["completed", "rejected", "escalated"] },
    },
    select: { id: true },
  });

  for (const r of overdue) {
    await prisma.dataSubjectRequest.update({
      where: { id: r.id },
      data: {
        escalated: true,
        escalatedAt: now,
        status: "escalated",
        events: {
          create: {
            status: "escalated",
            note: "SLA elapsed without resolution — auto-escalated to the Commission.",
          },
        },
      },
    });
  }

  return overdue.length;
}
