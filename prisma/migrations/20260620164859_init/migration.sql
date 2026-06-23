-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "headquarters" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskBand" TEXT NOT NULL DEFAULT 'low',
    "consentRisk" INTEGER NOT NULL DEFAULT 0,
    "crossBorderRisk" INTEGER NOT NULL DEFAULT 0,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplianceTrend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectorId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "avgRiskScore" INTEGER NOT NULL,
    "certifiedCount" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "consentRisk" INTEGER NOT NULL DEFAULT 0,
    "crossBorderRisk" INTEGER NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplianceTrend_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseRef" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT,
    "leadOfficerId" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investigation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investigation_leadOfficerId_fkey" FOREIGN KEY ("leadOfficerId") REFERENCES "RegulatorUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investigationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileRef" TEXT NOT NULL,
    "description" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL,
    "resolution" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "investigationId" TEXT,
    "assignedToId" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Complaint_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Complaint_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "RegulatorUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnforcementNotice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "issuedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EnforcementNotice_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EnforcementNotice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "RegulatorUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RemediationAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noticeId" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL,
    "evidenceRef" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RemediationAction_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "EnforcementNotice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "totalFine" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progressPublished" BOOLEAN NOT NULL DEFAULT false,
    "publicSummary" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Settlement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SettlementMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "evidenceRef" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SettlementMilestone_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refCode" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requesterEmailHash" TEXT NOT NULL,
    "detail" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDueAt" DATETIME NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalatedAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DataSubjectRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSubjectRequestEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataSubjectRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DataSubjectRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Advisory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT,
    "orgId" TEXT,
    "orgNameOverride" TEXT,
    "sectorId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advisory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Advisory_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "certNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Certification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegulatorUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "RegulatorUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sector_key_key" ON "Sector"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_sectorId_idx" ON "Organization"("sectorId");

-- CreateIndex
CREATE INDEX "Organization_visibility_publishedAt_idx" ON "Organization"("visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "ComplianceTrend_visibility_publishedAt_idx" ON "ComplianceTrend"("visibility", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceTrend_sectorId_period_key" ON "ComplianceTrend"("sectorId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_caseRef_key" ON "Investigation"("caseRef");

-- CreateIndex
CREATE INDEX "Investigation_orgId_idx" ON "Investigation"("orgId");

-- CreateIndex
CREATE INDEX "Investigation_status_idx" ON "Investigation"("status");

-- CreateIndex
CREATE INDEX "Evidence_investigationId_idx" ON "Evidence"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_ref_key" ON "Complaint"("ref");

-- CreateIndex
CREATE INDEX "Complaint_orgId_idx" ON "Complaint"("orgId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnforcementNotice_ref_key" ON "EnforcementNotice"("ref");

-- CreateIndex
CREATE INDEX "EnforcementNotice_orgId_idx" ON "EnforcementNotice"("orgId");

-- CreateIndex
CREATE INDEX "EnforcementNotice_status_idx" ON "EnforcementNotice"("status");

-- CreateIndex
CREATE INDEX "RemediationAction_noticeId_idx" ON "RemediationAction"("noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_ref_key" ON "Settlement"("ref");

-- CreateIndex
CREATE INDEX "Settlement_orgId_idx" ON "Settlement"("orgId");

-- CreateIndex
CREATE INDEX "SettlementMilestone_settlementId_idx" ON "SettlementMilestone"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "DataSubjectRequest_refCode_key" ON "DataSubjectRequest"("refCode");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_orgId_idx" ON "DataSubjectRequest"("orgId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_escalated_idx" ON "DataSubjectRequest"("escalated");

-- CreateIndex
CREATE INDEX "DataSubjectRequestEvent_requestId_idx" ON "DataSubjectRequestEvent"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Advisory_slug_key" ON "Advisory"("slug");

-- CreateIndex
CREATE INDEX "Advisory_type_idx" ON "Advisory"("type");

-- CreateIndex
CREATE INDEX "Advisory_visibility_publishedAt_idx" ON "Advisory"("visibility", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_certNumber_key" ON "Certification"("certNumber");

-- CreateIndex
CREATE INDEX "Certification_orgId_idx" ON "Certification"("orgId");

-- CreateIndex
CREATE INDEX "Certification_visibility_publishedAt_idx" ON "Certification"("visibility", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatorUser_email_key" ON "RegulatorUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
