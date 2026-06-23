import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBandBadge } from "@/components/console/status-badge";
import {
  SectorTrendChart,
  type TrendRow,
  type TrendSeries,
} from "@/components/console/sector-trend-chart";
import {
  getCertifiedOrganizations,
  getPublicOrganizationScores,
  getPublishedSettlements,
  getSectorTrends,
} from "@/lib/public-data";

const SECTOR_STYLE: Record<string, { color: string; emphasize?: boolean }> = {
  fintech: { color: "#c0362c", emphasize: true },
  telco: { color: "#008751" },
  health: { color: "#b58a00" },
  ecommerce: { color: "#2563eb" },
  gov: { color: "#6b7280" },
};

export default async function TransparencyPage() {
  const [scores, certified, trends, settlements] = await Promise.all([
    getPublicOrganizationScores(),
    getCertifiedOrganizations(),
    getSectorTrends(),
    getPublishedSettlements(),
  ]);

  // Pivot sector trends into one row per period for the chart.
  const rowByPeriod = new Map<string, TrendRow>();
  for (const t of trends) {
    for (const p of t.points) {
      const row = rowByPeriod.get(p.period) ?? { period: p.period };
      row[t.sectorKey] = p.avgRiskScore;
      rowByPeriod.set(p.period, row);
    }
  }
  const trendRows = [...rowByPeriod.values()].sort((a, b) =>
    a.period.localeCompare(b.period),
  );
  const series: TrendSeries[] = trends.map((t) => ({
    key: t.sectorKey,
    name: t.sectorName,
    color: SECTOR_STYLE[t.sectorKey]?.color ?? "#6b7280",
    emphasize: SECTOR_STYLE[t.sectorKey]?.emphasize,
  }));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Public Transparency"
        title="Data protection in Nigeria"
        description="Privacy compliance scores, certified organizations and sector trends — published by the Nigeria Data Protection Commission."
        actions={
          <Link
            href="/transparency/search"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Search a company
          </Link>
        }
      />

      {/* Sector trends */}
      <Card>
        <CardHeader>
          <CardTitle>Sector compliance trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            Average risk score by sector (aggregated, anonymized). Lower is
            better.
          </p>
        </CardHeader>
        <CardContent>
          <SectorTrendChart data={trendRows} series={series} />
        </CardContent>
      </Card>

      {/* Privacy scores (bands only) */}
      <section className="flex flex-col gap-4">
        <h2 className="display display-md">Privacy scores</h2>
        <p className="text-muted-foreground">
          Organizations are rated in bands — Low, Medium or High risk. Detailed
          internal scores are not public.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Risk band</TableHead>
              <TableHead>Certified</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scores.map((o) => (
              <TableRow key={o.slug}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {o.sector}
                </TableCell>
                <TableCell>
                  <RiskBandBadge band={o.riskBand} />
                </TableCell>
                <TableCell>
                  {o.certified ? (
                    <Badge variant="success">Certified</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Certified directory */}
      <section className="flex flex-col gap-4">
        <h2 className="display display-md">Certified organizations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certified.map((o) => (
            <Card key={o.slug}>
              <CardHeader>
                <CardTitle>{o.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{o.sector}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {o.certifications.map((c) => (
                  <div key={c.certNumber} className="text-sm">
                    <Badge variant="success">{c.scheme}</Badge>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {c.certNumber}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Published enforcement outcomes (settlements) */}
      {settlements.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="display display-md">Enforcement outcomes</h2>
          <p className="text-muted-foreground">
            Progress on agreed corrective actions. Evidence remains confidential.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {settlements.map((s) => (
              <Card key={s.ref}>
                <CardHeader>
                  <CardTitle>{s.organization}</CardTitle>
                  <p className="text-sm text-muted-foreground">{s.sector}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <p className="text-sm">{s.summary}</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <p className="figure text-sm tabular-nums">
                    {s.progress}% verified
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Looking for resolved cases?{" "}
        <Link
          href="/transparency/advisories"
          className="font-medium text-primary hover:underline"
        >
          Read public advisories →
        </Link>
      </p>
    </div>
  );
}
