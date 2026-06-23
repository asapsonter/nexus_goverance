import { prisma } from "@/lib/prisma";
import type { SessionUser } from "./token";

/**
 * Append-only audit trail for sensitive actions (viewing evidence, issuing a
 * notice, verifying settlement evidence). Call this from the Server Action that
 * performs the action, AFTER authorization has passed.
 */
export async function logAudit(params: {
  actor: Pick<SessionUser, "id" | "email"> | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: params.actor?.id ?? null,
      actorEmail: params.actor?.email ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
