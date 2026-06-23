import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdvisories } from "@/lib/public-data";

const TYPE_LABEL: Record<string, string> = {
  advisory: "Advisory",
  resolved_case: "Resolved case",
  warning: "Warning",
};

const SEVERITY_VARIANT: Record<
  string,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  info: "secondary",
  warning: "warning",
  critical: "destructive",
};

export default async function AdvisoriesPage() {
  const advisories = await getAdvisories();

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
          title="Advisories & resolved cases"
          description="Public guidance and the outcomes of resolved data-protection cases."
        />
      </div>

      <div className="flex flex-col gap-4">
        {advisories.map((a) => (
          <Card key={a.slug}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{TYPE_LABEL[a.type] ?? a.type}</Badge>
                {a.severity ? (
                  <Badge variant={SEVERITY_VARIANT[a.severity] ?? "secondary"}>
                    {a.severity}
                  </Badge>
                ) : null}
                {a.sector ? (
                  <span className="text-xs text-muted-foreground">
                    {a.sector}
                  </span>
                ) : null}
              </div>
              <CardTitle className="mt-1">{a.title}</CardTitle>
              {a.organization ? (
                <p className="text-sm text-muted-foreground">
                  Re: {a.organization}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <p>{a.summary}</p>
              {a.publishedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Published {a.publishedAt.toLocaleDateString("en-NG")}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {advisories.length === 0 ? (
          <p className="text-muted-foreground">No advisories published yet.</p>
        ) : null}
      </div>
    </div>
  );
}
