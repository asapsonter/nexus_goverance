"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireCan } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/audit";
import { REGULATOR_ROLES } from "@/lib/enums";

export type FormState = { error?: string; ok?: string };

/** Turn a name into a unique URL-safe slug. */
async function uniqueOrgSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "org";
  let slug = base;
  let n = 2;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Register a regulator staff member (e.g. a lead investigation officer). */
export async function registerOfficer(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCan("user.manage");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !role) {
    return { error: "Name, email and role are required." };
  }
  if (!(REGULATOR_ROLES as readonly string[]).includes(role)) {
    return { error: "Choose a valid role." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.regulatorUser.findUnique({ where: { email } });
  if (existing) return { error: "A user with that email already exists." };

  const created = await prisma.regulatorUser.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });

  await logAudit({
    actor: user,
    action: "user.create",
    entityType: "RegulatorUser",
    entityId: created.id,
    metadata: { role },
  });

  revalidatePath("/onboarding");
  return { ok: `Registered ${name} as ${role.replace(/_/g, " ")}.` };
}

/** Register an organization to be monitored (data entry for org names). */
export async function registerOrganization(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireCan("organization.manage");

  const name = String(formData.get("name") ?? "").trim();
  const sectorId = String(formData.get("sectorId") ?? "");
  const headquarters = String(formData.get("headquarters") ?? "").trim() || null;

  if (!name || !sectorId) {
    return { error: "Organization name and sector are required." };
  }

  const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
  if (!sector) return { error: "Choose a valid sector." };

  const created = await prisma.organization.create({
    data: {
      name,
      slug: await uniqueOrgSlug(name),
      sectorId,
      headquarters,
      // New orgs start internal + unrated; published & scored later.
      riskScore: 0,
      riskBand: "low",
      visibility: "internal",
    },
  });

  await logAudit({
    actor: user,
    action: "organization.create",
    entityType: "Organization",
    entityId: created.id,
    metadata: { sector: sector.key },
  });

  revalidatePath("/onboarding");
  return { ok: `Added ${name} to ${sector.name}.` };
}
