import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/token";

const asRole = (role: SessionUser["role"]): Pick<SessionUser, "role"> => ({
  role,
});

describe("rbac: can(user, action)", () => {
  it("an analyst CANNOT issue notices", () => {
    expect(can(asRole("analyst"), "notice.issue")).toBe(false);
  });

  it("investigators and superadmins CAN issue notices", () => {
    expect(can(asRole("investigator"), "notice.issue")).toBe(true);
    expect(can(asRole("superadmin"), "notice.issue")).toBe(true);
  });

  it("only superadmin + settlement_officer can verify settlements", () => {
    expect(can(asRole("settlement_officer"), "settlement.verify")).toBe(true);
    expect(can(asRole("superadmin"), "settlement.verify")).toBe(true);
    expect(can(asRole("investigator"), "settlement.verify")).toBe(false);
    expect(can(asRole("analyst"), "settlement.verify")).toBe(false);
  });

  it("read_only cannot view evidence or mutate anything", () => {
    expect(can(asRole("read_only"), "evidence.view")).toBe(false);
    expect(can(asRole("read_only"), "investigation.manage")).toBe(false);
    expect(can(asRole("read_only"), "complaint.resolve")).toBe(false);
    // …but can view dashboards and lists.
    expect(can(asRole("read_only"), "dashboard.view")).toBe(true);
    expect(can(asRole("read_only"), "investigation.view")).toBe(true);
  });

  it("a null user can do nothing", () => {
    expect(can(null, "dashboard.view")).toBe(false);
  });
});
