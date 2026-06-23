import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { escalateOverdueRequests } from "@/lib/dsr";
import { hashEmail } from "@/lib/hash";

/**
 * Proves the escalation sweep: a request past its SLA flips to "escalated" and
 * gains a timeline event. Requires a seeded DB.
 */
const db = new PrismaClient();
afterAll(async () => {
  await db.$disconnect();
});

describe("dsr: escalateOverdueRequests", () => {
  it("flips an overdue, unresolved request to escalated", async () => {
    const org = await db.organization.findFirstOrThrow();
    const refCode = "RW-TEST01";

    // Clean any prior run, then create an overdue, non-escalated request.
    await db.dataSubjectRequest.deleteMany({ where: { refCode } });
    const created = await db.dataSubjectRequest.create({
      data: {
        refCode,
        orgId: org.id,
        type: "deletion",
        status: "routed",
        requesterEmailHash: hashEmail("overdue@example.com"),
        submittedAt: new Date(Date.now() - 40 * 86_400_000),
        slaDueAt: new Date(Date.now() - 5 * 86_400_000), // 5 days overdue
        escalated: false,
      },
    });

    const count = await escalateOverdueRequests();
    expect(count).toBeGreaterThanOrEqual(1);

    const after = await db.dataSubjectRequest.findUniqueOrThrow({
      where: { id: created.id },
      include: { events: true },
    });
    expect(after.escalated).toBe(true);
    expect(after.status).toBe("escalated");
    expect(after.events.some((e) => e.status === "escalated")).toBe(true);

    // Clean up (events cascade on delete).
    await db.dataSubjectRequest.delete({ where: { id: created.id } });
  });
});
