import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { logAudit } from "@/lib/auth/audit";

/**
 * Proves the audit mechanism that `revealEvidence()` relies on: logging an
 * evidence view writes an AuditLog row. Requires a seeded DB (`pnpm db:seed`).
 */
const db = new PrismaClient();
afterAll(async () => {
  await db.$disconnect();
});

describe("audit: viewing evidence creates an audit row", () => {
  it("logAudit('evidence.view') persists a row tied to the evidence", async () => {
    const evidence = await db.evidence.findFirstOrThrow();
    // Use a real seeded user — actorId is a FK to RegulatorUser (in the app the
    // actor always comes from a valid session).
    const investigator = await db.regulatorUser.findFirstOrThrow({
      where: { role: "investigator" },
    });
    const before = await db.auditLog.count({
      where: { action: "evidence.view", entityId: evidence.id },
    });

    await logAudit({
      actor: { id: investigator.id, email: investigator.email },
      action: "evidence.view",
      entityType: "Evidence",
      entityId: evidence.id,
      metadata: { investigationId: evidence.investigationId },
    });

    const after = await db.auditLog.findMany({
      where: { action: "evidence.view", entityId: evidence.id },
      orderBy: { createdAt: "desc" },
    });

    expect(after.length).toBe(before + 1);
    expect(after[0].actorEmail).toBe(investigator.email);
    expect(after[0].entityType).toBe("Evidence");
  });
});
