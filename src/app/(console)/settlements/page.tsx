import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/console/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { computeProgress } from "@/lib/settlement";

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function SettlementsPage() {
  await requireUser();

  const settlements = await prisma.settlement.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      org: { select: { name: true } },
      milestones: { select: { verificationStatus: true, deadline: true } },
    },
  });

  const now = new Date();
  const rows = settlements.map((s) => {
    const progress = computeProgress(s.milestones);
    const pending = s.milestones
      .filter((m) => m.verificationStatus !== "verified")
      .map((m) => m.deadline)
      .sort((a, b) => a.getTime() - b.getTime());
    const nearest = pending[0] ?? null;
    const nearestOverdue = nearest !== null && nearest < now;
    return { ...s, progress, nearest, nearestOverdue };
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console · Module 13"
        title="Smart Settlement Tracker"
        description="Convert fines into measurable corrective action. Track verified-milestone progress and nearest deadlines."
      />

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Fine</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Nearest deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Public</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      href={`/settlements/${s.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s.ref}
                    </Link>
                  </TableCell>
                  <TableCell>{s.org.name}</TableCell>
                  <TableCell className="figure tabular-nums">
                    {NGN.format(s.totalFine)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                      <span className="figure text-xs tabular-nums">
                        {s.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={
                      s.nearestOverdue
                        ? "font-semibold text-destructive"
                        : undefined
                    }
                  >
                    {s.nearest
                      ? s.nearest.toLocaleDateString("en-NG")
                      : "All verified"}
                    {s.nearestOverdue ? " (overdue)" : ""}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell>
                    {s.progressPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="outline">Internal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
