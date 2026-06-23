import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
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

export default async function InvestigationsPage() {
  await requireUser();

  const investigations = await prisma.investigation.findMany({
    orderBy: [{ status: "asc" }, { openedAt: "desc" }],
    include: {
      org: { select: { name: true, sector: { select: { name: true } } } },
      leadOfficer: { select: { name: true } },
      _count: { select: { evidence: true } },
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Investigations"
        description="Active and historical cases. Open a case to review evidence and manage status."
      />

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Lead officer</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investigations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link
                      href={`/investigations/${inv.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {inv.caseRef}
                    </Link>
                    <p className="text-xs text-muted-foreground">{inv.title}</p>
                  </TableCell>
                  <TableCell>
                    {inv.org.name}
                    <p className="text-xs text-muted-foreground">
                      {inv.org.sector.name}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.leadOfficer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="figure tabular-nums">
                    {inv._count.evidence}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={inv.status} />
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
