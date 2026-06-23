import type { RegulatorRole } from "@/lib/enums";
import type { SessionUser } from "./token";

/**
 * Role-based access control.
 *
 * `can(user, action)` is the single guard used across the console — pages call
 * it to show/hide controls, and Server Actions call `assertCan` to enforce.
 *
 * The 5 roles map to a fixed set of actions. superadmin is "*". The key
 * acceptance constraint: an ANALYST cannot issue notices.
 */

export const ACTIONS = [
  "dashboard.view",
  "investigation.view",
  "investigation.manage", // change case status
  "evidence.view", // audit-logged
  "evidence.verify",
  "complaint.view",
  "complaint.assign",
  "complaint.resolve",
  "notice.view",
  "notice.issue", // audit-logged
  "remediation.view",
  "remediation.manage",
  "settlement.view",
  "settlement.manage",
  "settlement.verify", // audit-logged
  "organization.manage", // register/onboard organizations
  "user.manage", // register regulator staff (lead officers)
] as const;

export type Action = (typeof ACTIONS)[number];

// Role → allowed actions ("*" = all).
const MATRIX: Record<RegulatorRole, readonly Action[] | "*"> = {
  superadmin: "*",

  investigator: [
    "dashboard.view",
    "investigation.view",
    "investigation.manage",
    "evidence.view",
    "evidence.verify",
    "complaint.view",
    "complaint.assign",
    "complaint.resolve",
    "notice.view",
    "notice.issue",
    "remediation.view",
    "remediation.manage",
    "settlement.view",
    "organization.manage",
  ],

  analyst: [
    "dashboard.view",
    "investigation.view",
    "evidence.view",
    "complaint.view",
    "complaint.assign",
    "complaint.resolve",
    "notice.view",
    // NOTE: no "notice.issue" — analysts cannot issue notices.
    "remediation.view",
    "settlement.view",
    "organization.manage",
  ],

  settlement_officer: [
    "dashboard.view",
    "investigation.view",
    "notice.view",
    "remediation.view",
    "settlement.view",
    "settlement.manage",
    "settlement.verify",
  ],

  read_only: [
    "dashboard.view",
    "investigation.view",
    "complaint.view",
    "notice.view",
    "remediation.view",
    "settlement.view",
    // NOTE: no "evidence.view" — evidence is the most sensitive surface.
  ],
};

export function can(
  user: Pick<SessionUser, "role"> | null | undefined,
  action: Action,
): boolean {
  if (!user) return false;
  const perms = MATRIX[user.role];
  if (!perms) return false;
  return perms === "*" || perms.includes(action);
}

/** Throws when the user lacks the permission — use inside Server Actions. */
export function assertCan(
  user: Pick<SessionUser, "role"> | null | undefined,
  action: Action,
): void {
  if (!can(user, action)) {
    throw new Error(`Forbidden: missing permission "${action}"`);
  }
}
