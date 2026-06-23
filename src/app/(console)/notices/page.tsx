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
import { StatusBadge } from "@/components/console/status-badge";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { NoticeForm } from "./notice-form";

function isOverdue(dueDate: Date | null, status: string) {
  return (
    dueDate !== null &&
    dueDate < new Date() &&
    status !== "closed" &&
    status !== "acknowledged"
  );
}

export default async function NoticesPage() {
  const user = await requireUser();
  const canIssue = can(user, "notice.issue");

  const [orgs, notices] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.enforcementNotice.findMany({
      orderBy: { issuedAt: "desc" },
      include: { org: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Enforcement Notices"
        description="Issue and track enforcement notices and their due dates."
      />

      {canIssue ? (
        <Card>
          <CardHeader>
            <CardTitle>Issue a notice</CardTitle>
          </CardHeader>
          <CardContent>
            <NoticeForm orgs={orgs} />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Your role can view notices but cannot issue them.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All notices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((n) => {
                const overdue = isOverdue(n.dueDate, n.status);
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.ref}</TableCell>
                    <TableCell>{n.org.name}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {n.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      {n.issuedAt.toLocaleDateString("en-NG")}
                    </TableCell>
                    <TableCell
                      className={
                        overdue ? "font-semibold text-destructive" : undefined
                      }
                    >
                      {n.dueDate ? n.dueDate.toLocaleDateString("en-NG") : "—"}
                      {overdue ? " (overdue)" : ""}
                    </TableCell>
                    <TableCell>
                      {overdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <StatusBadge status={n.status} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
