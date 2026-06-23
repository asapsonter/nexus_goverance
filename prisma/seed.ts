import "dotenv/config";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

/**
 * RegWatch NG seed — a realistic but ENTIRELY FICTIONAL Nigerian dataset.
 *
 * Company names are invented; assigning real firms high-risk/violation profiles
 * would be defamatory. The data deliberately exercises the confidentiality
 * boundary: most orgs are published (visibility "public"), but at least one is
 * internal-only so tests can prove it never surfaces publicly.
 *
 * Run via `prisma db seed` (configured in package.json) or `tsx prisma/seed.ts`.
 */

const prisma = new PrismaClient();

// ---- date + hashing helpers ------------------------------------------------
const DAY = 86_400_000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY);
const monthStart = (year: number, month1to12: number) =>
  new Date(Date.UTC(year, month1to12 - 1, 1));

// Never store a raw email — only a SHA-256 the requester can reproduce.
const hashEmail = (email: string) =>
  createHash("sha256").update(email.trim().toLowerCase()).digest("hex");

async function main() {
  // -------------------------------------------------------------------------
  // Clear existing data, children before parents (FK-safe).
  // -------------------------------------------------------------------------
  await prisma.auditLog.deleteMany();
  await prisma.dataSubjectRequestEvent.deleteMany();
  await prisma.dataSubjectRequest.deleteMany();
  await prisma.settlementMilestone.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.remediationAction.deleteMany();
  await prisma.enforcementNotice.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.advisory.deleteMany();
  await prisma.complianceTrend.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.regulatorUser.deleteMany();

  // -------------------------------------------------------------------------
  // Sectors
  // -------------------------------------------------------------------------
  const sectorDefs = [
    { key: "fintech", name: "Financial Technology" },
    { key: "telco", name: "Telecommunications" },
    { key: "health", name: "Healthcare" },
    { key: "ecommerce", name: "E-Commerce" },
    { key: "gov", name: "Government" },
  ];
  const sectors: Record<string, string> = {};
  for (const s of sectorDefs) {
    const row = await prisma.sector.create({ data: s });
    sectors[s.key] = row.id;
  }

  // -------------------------------------------------------------------------
  // Regulator staff — one per role. Shared dev password.
  // -------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("RegWatch#2026", 10);
  const userDefs = [
    { email: "aisha.bello@ndpc.gov.ng", name: "Aisha Bello", role: "superadmin" },
    { email: "chidi.okeke@ndpc.gov.ng", name: "Chidi Okeke", role: "investigator" },
    { email: "ngozi.eze@ndpc.gov.ng", name: "Ngozi Eze", role: "analyst" },
    { email: "tunde.adeyemi@ndpc.gov.ng", name: "Tunde Adeyemi", role: "settlement_officer" },
    { email: "fatima.sani@ndpc.gov.ng", name: "Fatima Sani", role: "read_only" },
  ];
  const users: Record<string, string> = {};
  for (const u of userDefs) {
    const row = await prisma.regulatorUser.create({
      data: { ...u, passwordHash },
    });
    users[u.role] = row.id;
  }

  // -------------------------------------------------------------------------
  // Organizations (12). riskBand: <35 low, 35–65 medium, >65 high.
  // `Lagoon Capital` is INTERNAL-only (under investigation, not published) so
  // the boundary test can assert it never appears publicly.
  // -------------------------------------------------------------------------
  const orgDefs = [
    // fintech
    { slug: "nairaswift", name: "NairaSwift Payments Ltd", sector: "fintech", hq: "Lagos",
      riskScore: 82, riskBand: "high", consentRisk: 88, crossBorderRisk: 90, certified: false, visibility: "public" },
    { slug: "kobotrust", name: "KoboTrust MFB", sector: "fintech", hq: "Abuja",
      riskScore: 64, riskBand: "medium", consentRisk: 60, crossBorderRisk: 55, certified: false, visibility: "public" },
    { slug: "lagoon-capital", name: "Lagoon Capital Fintech", sector: "fintech", hq: "Lagos",
      riskScore: 70, riskBand: "high", consentRisk: 72, crossBorderRisk: 68, certified: false, visibility: "internal" },
    // telco
    { slug: "sahel-telecom", name: "Sahel Telecom Nigeria", sector: "telco", hq: "Kano",
      riskScore: 58, riskBand: "medium", consentRisk: 52, crossBorderRisk: 64, certified: false, visibility: "public" },
    { slug: "greenline-mobile", name: "GreenLine Mobile", sector: "telco", hq: "Port Harcourt",
      riskScore: 40, riskBand: "medium", consentRisk: 38, crossBorderRisk: 35, certified: false, visibility: "public" },
    // health
    { slug: "medicare-hmo", name: "MediCare HMO Nigeria", sector: "health", hq: "Lagos",
      riskScore: 72, riskBand: "high", consentRisk: 70, crossBorderRisk: 48, certified: false, visibility: "public" },
    { slug: "sparrow-health", name: "Sparrow Health Systems", sector: "health", hq: "Ibadan",
      riskScore: 45, riskBand: "medium", consentRisk: 44, crossBorderRisk: 30, certified: false, visibility: "public" },
    { slug: "vitalscloud", name: "VitalsCloud Diagnostics", sector: "health", hq: "Enugu",
      riskScore: 22, riskBand: "low", consentRisk: 20, crossBorderRisk: 18, certified: true, visibility: "public" },
    // ecommerce
    { slug: "markethub", name: "MarketHub NG", sector: "ecommerce", hq: "Lagos",
      riskScore: 50, riskBand: "medium", consentRisk: 55, crossBorderRisk: 40, certified: false, visibility: "public" },
    { slug: "kano-crafts", name: "Kano Crafts Marketplace", sector: "ecommerce", hq: "Kano",
      riskScore: 18, riskBand: "low", consentRisk: 15, crossBorderRisk: 12, certified: true, visibility: "public" },
    // gov
    { slug: "federal-records", name: "Federal Records Bureau", sector: "gov", hq: "Abuja",
      riskScore: 48, riskBand: "medium", consentRisk: 42, crossBorderRisk: 25, certified: false, visibility: "public" },
    { slug: "lagos-digital", name: "Lagos State Digital Services", sector: "gov", hq: "Lagos",
      riskScore: 25, riskBand: "low", consentRisk: 22, crossBorderRisk: 15, certified: true, visibility: "public" },
  ];
  const orgs: Record<string, string> = {};
  for (const o of orgDefs) {
    const row = await prisma.organization.create({
      data: {
        slug: o.slug,
        name: o.name,
        sectorId: sectors[o.sector],
        headquarters: o.hq,
        riskScore: o.riskScore,
        riskBand: o.riskBand,
        consentRisk: o.consentRisk,
        crossBorderRisk: o.crossBorderRisk,
        certified: o.certified,
        visibility: o.visibility,
        publishedAt: o.visibility === "public" ? daysAgo(30) : null,
      },
    });
    orgs[o.slug] = row.id;
  }

  // -------------------------------------------------------------------------
  // Compliance trends — 6 monthly published snapshots per sector (Jan–Jun 2026).
  // Fintech trends high and rising on consent + cross-border risk.
  // -------------------------------------------------------------------------
  const trendSeries: Record<string, number[]> = {
    fintech: [70, 72, 74, 77, 79, 80],
    telco: [52, 51, 53, 50, 49, 49],
    health: [55, 56, 58, 57, 59, 60],
    ecommerce: [40, 41, 39, 38, 37, 36],
    gov: [44, 43, 42, 40, 39, 37],
  };
  for (const [key, scores] of Object.entries(trendSeries)) {
    for (let i = 0; i < scores.length; i++) {
      const month = i + 1; // 2026-01 .. 2026-06
      await prisma.complianceTrend.create({
        data: {
          sectorId: sectors[key],
          period: `2026-${String(month).padStart(2, "0")}`,
          periodStart: monthStart(2026, month),
          avgRiskScore: scores[i],
          certifiedCount: key === "fintech" ? 0 : 1,
          openIssues: key === "fintech" ? 6 : 2,
          consentRisk: key === "fintech" ? 80 + i : 40,
          crossBorderRisk: key === "fintech" ? 82 + i : 35,
          visibility: "public",
          publishedAt: monthStart(2026, month),
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Investigations + Evidence — CONFIDENTIAL.
  // -------------------------------------------------------------------------
  const invNairaswift = await prisma.investigation.create({
    data: {
      caseRef: "INV-2026-001",
      orgId: orgs["nairaswift"],
      title: "Unlawful cross-border transfer & defective consent",
      status: "active",
      summary:
        "Examining NairaSwift's marketing-data sharing with overseas processors and the validity of its bundled consent.",
      leadOfficerId: users["investigator"],
      openedAt: daysAgo(45),
      evidence: {
        create: [
          { type: "document", fileRef: "evidence/nairaswift/dpa-2024.pdf",
            description: "Data-processing agreement with offshore vendor", verificationStatus: "verified", collectedAt: daysAgo(40) },
          { type: "dataset", fileRef: "evidence/nairaswift/transfer-logs.csv",
            description: "90 days of outbound transfer logs", verificationStatus: "pending", collectedAt: daysAgo(20) },
          { type: "screenshot", fileRef: "evidence/nairaswift/consent-screen.png",
            description: "Signup consent screen (single bundled checkbox)", verificationStatus: "verified", collectedAt: daysAgo(38) },
        ],
      },
    },
  });

  await prisma.investigation.create({
    data: {
      caseRef: "INV-2026-002",
      orgId: orgs["lagoon-capital"],
      title: "Retention of dormant account data",
      status: "open",
      summary: "Preliminary review of data-retention practices.",
      leadOfficerId: users["investigator"],
      openedAt: daysAgo(12),
      evidence: {
        create: [
          { type: "log", fileRef: "evidence/lagoon/access-log.txt",
            description: "Admin access logs", verificationStatus: "pending", collectedAt: daysAgo(10) },
        ],
      },
    },
  });

  const invMedicare = await prisma.investigation.create({
    data: {
      caseRef: "INV-2026-003",
      orgId: orgs["medicare-hmo"],
      title: "Patient record sharing with third parties",
      status: "open",
      summary: "Complaint-driven review of health-data sharing.",
      leadOfficerId: users["investigator"],
      openedAt: daysAgo(8),
    },
  });

  await prisma.investigation.create({
    data: {
      caseRef: "INV-2026-004",
      orgId: orgs["federal-records"],
      title: "Access-control audit (closed)",
      status: "closed",
      summary: "Audit concluded; remediation completed.",
      leadOfficerId: users["investigator"],
      openedAt: daysAgo(120),
      closedAt: daysAgo(30),
    },
  });

  // -------------------------------------------------------------------------
  // Complaints
  // -------------------------------------------------------------------------
  await prisma.complaint.createMany({
    data: [
      { ref: "CMP-2026-001", orgId: orgs["nairaswift"], channel: "web",
        subject: "Marketing messages after opting out", status: "investigating",
        isPublic: true, visibility: "internal", assignedToId: users["analyst"],
        investigationId: invNairaswift.id, submittedAt: daysAgo(50) },
      { ref: "CMP-2026-002", orgId: orgs["medicare-hmo"], channel: "email",
        subject: "HMO shared my records with an employer", status: "investigating",
        isPublic: true, visibility: "internal", assignedToId: users["analyst"],
        investigationId: invMedicare.id, submittedAt: daysAgo(15) },
      { ref: "CMP-2026-003", orgId: orgs["sahel-telecom"], channel: "phone",
        subject: "SIM registration data resold", status: "triage",
        isPublic: false, visibility: "internal", submittedAt: daysAgo(6) },
      { ref: "CMP-2026-004", orgId: orgs["markethub"], channel: "web",
        subject: "Cannot delete my account", status: "resolved",
        resolution: "Org confirmed deletion within SLA.", isPublic: false,
        visibility: "internal", submittedAt: daysAgo(40), resolvedAt: daysAgo(33) },
      { ref: "CMP-2026-005", orgId: orgs["greenline-mobile"], channel: "walk_in",
        subject: "Unsolicited promotional calls", status: "new",
        isPublic: false, visibility: "internal", submittedAt: daysAgo(2) },
    ],
  });

  // -------------------------------------------------------------------------
  // Enforcement notices + remediation
  // -------------------------------------------------------------------------
  const noticeNairaswift = await prisma.enforcementNotice.create({
    data: {
      ref: "NTC-2026-001",
      orgId: orgs["nairaswift"],
      type: "compliance_order",
      title: "Order to remediate consent & halt unlawful transfers",
      summary:
        "NairaSwift must redesign consent capture and suspend offshore transfers pending safeguards.",
      issuedAt: daysAgo(20),
      dueDate: daysFromNow(10),
      status: "issued",
      visibility: "public",
      publishedAt: daysAgo(20),
      issuedById: users["superadmin"],
      remediationActions: {
        create: [
          { milestone: "Implement granular, unbundled consent", status: "in_progress",
            dueDate: daysFromNow(10), description: "Replace single checkbox with purpose-specific toggles" },
          { milestone: "Localize transfer data or execute SCCs", status: "overdue",
            dueDate: daysAgo(3), description: "Either host in-country or sign standard contractual clauses" },
        ],
      },
    },
  });

  await prisma.enforcementNotice.create({
    data: {
      ref: "NTC-2026-002",
      orgId: orgs["medicare-hmo"],
      type: "warning",
      title: "Warning: tighten third-party data-sharing controls",
      summary: "Formal warning pending the outcome of INV-2026-003.",
      issuedAt: daysAgo(5),
      status: "issued",
      visibility: "public",
      publishedAt: daysAgo(5),
      issuedById: users["superadmin"],
    },
  });

  // -------------------------------------------------------------------------
  // Settlement (Module 13 flagship — the NDPC example).
  // A large platform agreeing to stop silent tracking and redesign consent.
  // -------------------------------------------------------------------------
  await prisma.settlement.create({
    data: {
      ref: "STL-2026-001",
      orgId: orgs["markethub"],
      totalFine: 250_000_000,
      currency: "NGN",
      status: "active",
      summary:
        "MarketHub NG settlement: cease silent background tracking, rebuild consent, localize data, and fund a public-benefit programme.",
      progressPublished: true,
      publicSummary:
        "MarketHub NG has agreed to stop silent tracking and redesign its consent experience. Remediation is underway and independently verified.",
      publishedProgress: 50, // 2 of 4 milestones verified at publish time
      visibility: "public",
      publishedAt: daysAgo(25),
      milestones: {
        create: [
          { title: "Cease silent background tracking", category: "consent",
            deadline: daysAgo(10), evidenceRef: "stl/markethub/tracking-off.pdf",
            verificationStatus: "verified", verifiedAt: daysAgo(8) },
          { title: "Redesign consent flow (granular opt-in)", category: "consent",
            deadline: daysFromNow(20), evidenceRef: "stl/markethub/consent-v2.pdf",
            verificationStatus: "pending" },
          { title: "Migrate user data to local hosting", category: "hosting",
            deadline: daysAgo(2), evidenceRef: null, verificationStatus: "pending" },
          { title: "Fund digital-literacy public-benefit programme", category: "public_benefit",
            deadline: daysAgo(15), evidenceRef: "stl/markethub/grant-letter.pdf",
            verificationStatus: "verified", verifiedAt: daysAgo(12) },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Data Subject Requests (Module 15). One escalated past SLA (NDPC example).
  // -------------------------------------------------------------------------
  const dsrDeletion = await prisma.dataSubjectRequest.create({
    data: {
      refCode: "RW-7F3A2B",
      orgId: orgs["nairaswift"],
      type: "deletion",
      status: "escalated",
      requesterEmailHash: hashEmail("amaka.user@example.com"),
      detail: "Requesting deletion of all marketing data held about me.",
      submittedAt: daysAgo(40),
      slaDueAt: daysAgo(10), // SLA passed with no resolution
      escalated: true,
      escalatedAt: daysAgo(9),
      events: {
        create: [
          { status: "submitted", note: "Request received via /rights portal", createdAt: daysAgo(40) },
          { status: "routed", note: "Routed to DPO at NairaSwift", createdAt: daysAgo(39) },
          { status: "escalated", note: "SLA elapsed without response — escalated to console", createdAt: daysAgo(9) },
        ],
      },
    },
  });

  await prisma.dataSubjectRequest.create({
    data: {
      refCode: "RW-9C1D04",
      orgId: orgs["sahel-telecom"],
      type: "access",
      status: "in_progress",
      requesterEmailHash: hashEmail("bola.subscriber@example.com"),
      detail: "Copy of all personal data held.",
      submittedAt: daysAgo(5),
      slaDueAt: daysFromNow(25),
      events: {
        create: [
          { status: "submitted", createdAt: daysAgo(5) },
          { status: "routed", note: "Routed to DPO", createdAt: daysAgo(4) },
          { status: "in_progress", note: "Org acknowledged", createdAt: daysAgo(3) },
        ],
      },
    },
  });

  await prisma.dataSubjectRequest.create({
    data: {
      refCode: "RW-2B88E1",
      orgId: orgs["markethub"],
      type: "correction",
      status: "completed",
      requesterEmailHash: hashEmail("ekene.shopper@example.com"),
      submittedAt: daysAgo(30),
      slaDueAt: daysAgo(2),
      resolvedAt: daysAgo(6),
      events: {
        create: [
          { status: "submitted", createdAt: daysAgo(30) },
          { status: "completed", note: "Record corrected", createdAt: daysAgo(6) },
        ],
      },
    },
  });

  // -------------------------------------------------------------------------
  // Advisories — published (public) + one internal draft (must stay hidden).
  // -------------------------------------------------------------------------
  await prisma.advisory.createMany({
    data: [
      { slug: "fintech-consent-overhaul", type: "resolved_case", severity: "info",
        title: "How a major payments provider overhauled consent after NDPC action",
        summary: "An anonymized resolved case on fixing bundled consent and offshore transfers.",
        body: "Following enforcement, the provider unbundled consent, localized data, and signed SCCs…",
        orgNameOverride: "a major payments provider", sectorId: sectors["fintech"],
        visibility: "public", publishedAt: daysAgo(18) },
      { slug: "verify-your-hmo", type: "warning", severity: "warning",
        title: "Verify your HMO's data-sharing practices",
        summary: "Citizens should confirm how their health insurer shares records with third parties.",
        body: "We are reviewing reports of HMO record-sharing without a lawful basis…",
        orgId: orgs["medicare-hmo"], orgNameOverride: "MediCare HMO Nigeria",
        sectorId: sectors["health"], visibility: "public", publishedAt: daysAgo(5) },
      { slug: "cross-border-transfers-explained", type: "advisory", severity: "info",
        title: "Cross-border data transfers: what citizens should know",
        summary: "Your rights when a company moves your data outside Nigeria.",
        body: "Under the NDPA, transfers abroad require adequate safeguards…",
        sectorId: sectors["fintech"], visibility: "public", publishedAt: daysAgo(2) },
      // Internal draft — NEVER public. Boundary test asserts it is excluded.
      { slug: "draft-pending-enforcement", type: "advisory", severity: "critical",
        title: "DRAFT: pending enforcement summary (internal)",
        summary: "Internal working draft — not for publication.",
        body: "Holds confidential pre-decisional notes.",
        visibility: "internal", publishedAt: null },
    ],
  });

  // -------------------------------------------------------------------------
  // Certifications — published, for the 3 certified orgs.
  // -------------------------------------------------------------------------
  await prisma.certification.createMany({
    data: [
      { orgId: orgs["vitalscloud"], scheme: "NDPA Compliance Certified", certNumber: "NDPA-CERT-0007",
        status: "active", issuedAt: daysAgo(90), expiresAt: daysFromNow(275),
        visibility: "public", publishedAt: daysAgo(90) },
      { orgId: orgs["kano-crafts"], scheme: "NDPA Compliance Certified", certNumber: "NDPA-CERT-0011",
        status: "active", issuedAt: daysAgo(60), expiresAt: daysFromNow(305),
        visibility: "public", publishedAt: daysAgo(60) },
      { orgId: orgs["lagos-digital"], scheme: "NDPA Compliance Certified", certNumber: "NDPA-CERT-0014",
        status: "active", issuedAt: daysAgo(45), expiresAt: daysFromNow(320),
        visibility: "public", publishedAt: daysAgo(45) },
    ],
  });

  // -------------------------------------------------------------------------
  // Audit log — sample sensitive actions.
  // -------------------------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      { actorId: users["investigator"], actorEmail: "chidi.okeke@ndpc.gov.ng",
        action: "evidence.view", entityType: "Investigation", entityId: invNairaswift.id,
        createdAt: daysAgo(19) },
      { actorId: users["superadmin"], actorEmail: "aisha.bello@ndpc.gov.ng",
        action: "notice.issue", entityType: "EnforcementNotice", entityId: noticeNairaswift.id,
        createdAt: daysAgo(20) },
      { actorId: users["settlement_officer"], actorEmail: "tunde.adeyemi@ndpc.gov.ng",
        action: "settlement.verify", entityType: "Settlement", entityId: "STL-2026-001",
        createdAt: daysAgo(8) },
    ],
  });

  // Touch the escalated DSR id so linters don't flag the unused binding and so
  // the relationship is obvious when reading the seed.
  void dsrDeletion;

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const counts = {
    sectors: await prisma.sector.count(),
    organizations: await prisma.organization.count(),
    publishedOrgs: await prisma.organization.count({
      where: { visibility: "public", publishedAt: { not: null } },
    }),
    trends: await prisma.complianceTrend.count(),
    investigations: await prisma.investigation.count(),
    evidence: await prisma.evidence.count(),
    complaints: await prisma.complaint.count(),
    notices: await prisma.enforcementNotice.count(),
    settlements: await prisma.settlement.count(),
    dsrs: await prisma.dataSubjectRequest.count(),
    advisories: await prisma.advisory.count(),
    certifications: await prisma.certification.count(),
    users: await prisma.regulatorUser.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
