import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/console/stat-card";
import { RiskBandBadge } from "@/components/console/status-badge";
import {
  SectorTrendChart,
  type TrendRow,
  type TrendSeries,
} from "@/components/console/sector-trend-chart";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { escalateOverdueRequests } from "@/lib/dsr";

// Sector → line colour. Fintech is red + emphasized to flag its risk.
const SECTOR_STYLE: Record<string, { color: string; emphasize?: boolean }> = {
  fintech: { color: "#c0362c", emphasize: true },
  telco: { color: "#008751" },
  health: { color: "#b58a00" },
  ecommerce: { color: "#2563eb" },
  gov: { color: "#6b7280" },
};

const OPEN_INV = ["open", "active"];
const OPEN_CMP_EXCLUDE = ["resolved", "dismissed"];

async function getDashboardData() {
  const now = new Date();

  // Sweep overdue data-subject requests into "escalated" so they surface here.
  await escalateOverdueRequests();

  const [
    sectors,
    trends,
    topOrgs,
    totalOrganizations,
    openInvestigations,
    openComplaints,
    overdueNotices,
    escalatedRequests,
    invByOrg,
    cmpByOrg,
    allInvByOrg,
    noticeByOrg,
  ] = await Promise.all([
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
    prisma.complianceTrend.findMany({
      orderBy: { periodStart: "asc" },
      include: { sector: true },
    }),
    prisma.organization.findMany({
      orderBy: { riskScore: "desc" },
      take: 6,
      include: { sector: true },
    }),
    prisma.organization.count(),
    prisma.investigation.count({ where: { status: { in: OPEN_INV } } }),
    prisma.complaint.count({
      where: { status: { notIn: OPEN_CMP_EXCLUDE } },
    }),
    prisma.enforcementNotice.count({
      where: {
        dueDate: { lt: now },
        status: { notIn: ["closed", "acknowledged"] },
      },
    }),
    prisma.dataSubjectRequest.count({ where: { escalated: true } }),
    prisma.investigation.groupBy({
      by: ["orgId"],
      where: { status: { in: OPEN_INV } },
      _count: { _all: true },
    }),
    prisma.complaint.groupBy({
      by: ["orgId"],
      where: { status: { notIn: OPEN_CMP_EXCLUDE } },
      _count: { _all: true },
    }),
    // All-time enforcement actions per org (for repeat-violator detection).
    prisma.investigation.groupBy({ by: ["orgId"], _count: { _all: true } }),
    prisma.enforcementNotice.groupBy({ by: ["orgId"], _count: { _all: true } }),
  ]);

  // A repeat violator is an org with 2+ enforcement actions on record
  // (investigations + enforcement notices, all-time).
  const enforcementByOrg = new Map<string, number>();
  for (const r of allInvByOrg) {
    enforcementByOrg.set(r.orgId, (enforcementByOrg.get(r.orgId) ?? 0) + r._count._all);
  }
  for (const r of noticeByOrg) {
    enforcementByOrg.set(r.orgId, (enforcementByOrg.get(r.orgId) ?? 0) + r._count._all);
  }
  const repeatViolators = [...enforcementByOrg.values()].filter(
    (n) => n >= 2,
  ).length;

  // Shape trends into one row per period: { period, fintech: 80, telco: 49, … }
  const rowByPeriod = new Map<string, TrendRow>();
  for (const t of trends) {
    const row = rowByPeriod.get(t.period) ?? { period: t.period };
    row[t.sector.key] = t.avgRiskScore;
    rowByPeriod.set(t.period, row);
  }
  const trendRows = [...rowByPeriod.values()];
  const series: TrendSeries[] = sectors.map((s) => ({
    key: s.key,
    name: s.name,
    color: SECTOR_STYLE[s.key]?.color ?? "#6b7280",
    emphasize: SECTOR_STYLE[s.key]?.emphasize,
  }));

  // Issue counts per org.
  const invCount = new Map(invByOrg.map((r) => [r.orgId, r._count._all]));
  const cmpCount = new Map(cmpByOrg.map((r) => [r.orgId, r._count._all]));
  const highRisk = topOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    sector: o.sector.name,
    sectorKey: o.sector.key,
    riskScore: o.riskScore,
    riskBand: o.riskBand,
    consentRisk: o.consentRisk,
    crossBorderRisk: o.crossBorderRisk,
    issues: (invCount.get(o.id) ?? 0) + (cmpCount.get(o.id) ?? 0),
  }));

  return {
    trendRows,
    series,
    highRisk,
    kpis: {
      totalOrganizations,
      repeatViolators,
      openInvestigations,
      openComplaints,
      overdueNotices,
      escalatedRequests,
    },
  };
}

export default async function DashboardPage() {
  await requireUser();
  const { trendRows, series, highRisk, kpis } = await getDashboardData();

  // The NDPC example: fintech's elevated consent + cross-border risk.
  const fintechFlag = highRisk.find((o) => o.sectorKey === "fintech");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Dashboard"
        description="Sector compliance trends, high-risk organizations, and live caseload."
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Organizations"
          value={kpis.totalOrganizations}
          hint="Monitored entities"
        />
        <StatCard
          label="Repeat violators"
          value={kpis.repeatViolators}
          alert
          hint="2+ enforcement actions"
        />
        <StatCard label="Open investigations" value={kpis.openInvestigations} />
        <StatCard label="Open complaints" value={kpis.openComplaints} />
        <StatCard
          label="Overdue notices"
          value={kpis.overdueNotices}
          alert
          hint="Past due date, not closed"
        />
        <StatCard
          label="Escalated requests"
          value={kpis.escalatedRequests}
          alert
          hint="DSRs past SLA"
        />
      </div>

      {/* NDPC fintech flag */}
      {fintechFlag ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">
            ⚠ Sector flag — Financial Technology
          </p>
          <p className="mt-1 text-sm text-foreground">
            {fintechFlag.name} shows high consent risk (
            <span className="figure font-semibold">
              {fintechFlag.consentRisk}
            </span>
            ) and cross-border transfer risk (
            <span className="figure font-semibold">
              {fintechFlag.crossBorderRisk}
            </span>
            ). Fintech leads all sectors on data-protection risk.
          </p>
        </div>
      ) : null}

      {/* Trends chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sector compliance trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Average risk score by sector, 2026 (lower is better).
          </p>
        </CardHeader>
        <CardContent>
          <SectorTrendChart data={trendRows} series={series} />
        </CardContent>
      </Card>

      {/* High-risk organizations */}
      <Card>
        <CardHeader>
          <CardTitle>High-risk organizations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sorted by risk score. Issue counts in red.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Risk score</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Open issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highRisk.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.sector}
                  </TableCell>
                  <TableCell className="figure tabular-nums">
                    {o.riskScore}
                  </TableCell>
                  <TableCell>
                    <RiskBandBadge band={o.riskBand} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        o.issues > 0
                          ? "figure font-semibold text-destructive"
                          : "figure text-muted-foreground"
                      }
                    >
                      {o.issues}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-right text-sm">
            <Link
              href="/investigations"
              className="font-medium text-primary hover:underline"
            >
              Go to investigations →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
