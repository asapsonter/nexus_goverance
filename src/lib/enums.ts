/**
   * Centralized literal unions for the schema's String "enum" columns.
   *
   * SQLite can't store native enums, so these are the single source of truth for
   * allowed values — used by the seed, server actions, and UI. Each `*_VALUES`
   * array is handy for selects/validation; each `*` type is the union.
   */

export const VISIBILITY_VALUES = ["internal", "public"] as const;
  export type Visibility = (typeof VISIBILITY_VALUES)[number];

  export const SECTOR_KEYS = [
    "fintech", 
    "telco",
    "health",
    "ecommerce",
    "gov",
  ] as const;

export type SectorKey = (typeof SECTOR_KEYS)[number];

  export const RISK_BANDS = ["low", "medium", "high"] as const;
  export type RiskBand = (typeof RISK_BANDS)[number];

  export const INVESTIGATION_STATUSES = ["open", "active", "closed"] as const;
  export type InvestigationStatus = (typeof INVESTIGATION_STATUSES)[number];
  
  export const EVIDENCE_TYPES = [
    "document",
    "screenshot",
    "log",
    "testimony",
    "dataset",
  ] as const;
  export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

  export const VERIFICATION_STATUSES = [
    "pending",
    "verified",
    "rejected",
  ] as const;
  export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

  export const COMPLAINT_CHANNELS = [
    "web",
    "email",
    "phone",
    "walk_in",
  ] as const;
  export type ComplaintChannel = (typeof COMPLAINT_CHANNELS)[number];

  export const COMPLAINT_STATUSES = [
    "new",  
    "triage",
    "investigating",
    "resolved",
    "dismissed",
  ] as const;
  export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

  export const NOTICE_TYPES = [ 
    "warning",
    "compliance_order",
    "fine",
    "suspension",
  ] as const;
  export type NoticeType = (typeof NOTICE_TYPES)[number];

  export const NOTICE_STATUSES = [ 
    "draft",
    "issued",
    "acknowledged",
    "overdue",
    "closed",
  ] as const;
  export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

  export const REMEDIATION_STATUSES = [
    "pending",
    "in_progress",
    "completed",
    "overdue",
  ] as const;
  export type RemediationStatus = (typeof REMEDIATION_STATUSES)[number];

  export const SETTLEMENT_STATUSES = [
    "active",
    "completed",
    "breached",
  ] as const;
  export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

  export const MILESTONE_CATEGORIES = [
    "hosting",
    "consent",
    "public_benefit",
    "other",
  ] as const;
  export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

  export const DSR_TYPES = [
    "access",
    "correction",
    "deletion",
    "withdrawal",
  ] as const;
  export type DsrType = (typeof DSR_TYPES)[number];

  export const DSR_STATUSES = [
    "submitted",
    "routed",
    "in_progress",
    "completed",
    "rejected",
    "escalated",
  ] as const;
  export type DsrStatus = (typeof DSR_STATUSES)[number];

  export const ADVISORY_TYPES = [
    "advisory",
    "resolved_case",
    "warning",
  ] as const;
  export type AdvisoryType = (typeof ADVISORY_TYPES)[number];

  export const ADVISORY_SEVERITIES = ["info", "warning", "critical"] as const;
  export type AdvisorySeverity = (typeof ADVISORY_SEVERITIES)[number];

  export const CERTIFICATION_STATUSES = [
    "active",
    "expired",
    "revoked",
  ] as const;
  export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

  export const REGULATOR_ROLES = [ 
    "superadmin",
    "investigator",
    "analyst",
    "settlement_officer",
    "read_only",
  ] as const;
  export type RegulatorRole = (typeof REGULATOR_ROLES)[number];  