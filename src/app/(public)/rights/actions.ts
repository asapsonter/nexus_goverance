"use server";

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashEmail } from "@/lib/hash";
import { DSR_TYPES } from "@/lib/enums";

const SLA_DAYS = 30;

export type SubmitState = { error?: string; refCode?: string };

/** Submit a data-subject request. Generates a ref code and routes to the DPO. */
export async function submitRequest(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const type = String(formData.get("type") ?? "");
  const orgSlug = String(formData.get("orgSlug") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim() || null;

  if (!(DSR_TYPES as readonly string[]).includes(type) || !orgSlug || !email) {
    return { error: "Please choose a request type, an organization and your email." };
  }

  // Only published organizations are valid targets (keeps the public surface clean).
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, visibility: "public", publishedAt: { not: null } },
    select: { id: true, name: true },
  });
  if (!org) return { error: "Please select a valid organization." };

  const refCode = `RW-${randomBytes(3).toString("hex").toUpperCase()}`;
  const slaDueAt = new Date(Date.now() + SLA_DAYS * 86_400_000);

  await prisma.dataSubjectRequest.create({
    data: {
      refCode,
      orgId: org.id,
      type,
      status: "routed",
      requesterEmailHash: hashEmail(email),
      detail,
      slaDueAt,
      events: {
        create: [
          { status: "submitted", note: "Request received via the /rights portal." },
          {
            status: "routed",
            note: `Routed to the Data Protection Officer at ${org.name} (email notification stubbed for MVP).`,
          },
        ],
      },
    },
  });

  return { refCode };
}

export type TrackedEvent = {
  status: string;
  note: string | null;
  createdAt: string;
};

export type TrackState = {
  error?: string;
  request?: {
    refCode: string;
    type: string;
    status: string;
    organization: string;
    submittedAt: string;
    slaDueAt: string;
    escalated: boolean;
  };
  events?: TrackedEvent[];
};

/** Look up a request by reference code + email (OTP stubbed for MVP). */
export async function trackRequest(
  _prev: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const refCode = String(formData.get("refCode") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim();
  // const otp = formData.get("otp") — stubbed for MVP, any value accepted.

  if (!refCode || !email) {
    return { error: "Enter your reference code and email." };
  }

  const dsr = await prisma.dataSubjectRequest.findUnique({
    where: { refCode },
    include: {
      org: { select: { name: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  // Verify ownership via the email hash. Vague error to avoid leaking existence.
  if (!dsr || dsr.requesterEmailHash !== hashEmail(email)) {
    return {
      error: "No matching request found for that reference code and email.",
    };
  }

  return {
    request: {
      refCode: dsr.refCode,
      type: dsr.type,
      status: dsr.status,
      organization: dsr.org.name,
      submittedAt: dsr.submittedAt.toISOString(),
      slaDueAt: dsr.slaDueAt.toISOString(),
      escalated: dsr.escalated,
    },
    events: dsr.events.map((e) => ({
      status: e.status,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
