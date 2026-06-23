"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import type { RegulatorRole } from "@/lib/enums";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || "/dashboard";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.regulatorUser.findUnique({ where: { email } });
  // Always run a compare-shaped path to avoid leaking which emails exist.
  const ok =
    user && user.active && (await bcrypt.compare(password, user.passwordHash));

  if (!ok || !user) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as RegulatorRole,
  });

  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
