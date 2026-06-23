import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { RiskBandBadge } from "@/components/console/status-badge";
import { searchOrganizations } from "@/lib/public-data";

export default async function TransparencySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchOrganizations(query) : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/transparency"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Transparency
        </Link>
        <PageHeader
          eyebrow="Public Transparency"
          title="Check a company"
          description="Search for an organization to see whether it is certified and whether it has any public compliance warnings."
        />
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="q">Company name</Label>
          <Input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="e.g. Kano Crafts"
            className="max-w-md"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {query ? (
        results.length === 0 ? (
          <p className="text-muted-foreground">
            No published organizations match “{query}”.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map((o) => (
              <Card key={o.slug}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{o.name}</CardTitle>
                    {o.certified ? (
                      <Badge variant="success">Certified</Badge>
                    ) : (
                      <Badge variant="outline">Not certified</Badge>
                    )}
                    <RiskBandBadge band={o.riskBand} />
                  </div>
                  <p className="text-sm text-muted-foreground">{o.sector}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {o.certifications.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold">Certifications</p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {o.certifications.map((c) => (
                          <li key={c.certNumber} className="text-sm">
                            {c.scheme} ·{" "}
                            <span className="font-mono text-xs text-muted-foreground">
                              {c.certNumber}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {o.warnings.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-destructive">
                        Public compliance warnings
                      </p>
                      <ul className="mt-1 flex flex-col gap-2">
                        {o.warnings.map((w) => (
                          <li
                            key={w.slug}
                            className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
                          >
                            <p className="font-medium">{w.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {w.summary}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No public compliance warnings on record.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <p className="text-muted-foreground">
          Enter a company name to begin.
        </p>
      )}
    </div>
  );
}
