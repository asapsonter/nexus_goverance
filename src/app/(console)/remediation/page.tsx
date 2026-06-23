import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/console/status-badge";
import { REMEDIATION_STATUSES } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { updateRemediationStatus } from "./actions";

const isOverdue = (dueDate: Date | null, status: string) =>
  dueDate !== null && dueDate < new Date() && status !== "completed";

export default async function RemediationPage() {
  const user = await requireUser();
  const canManage = can(user, "remediation.manage");

  const actions = await prisma.remediationAction.findMany({
    orderBy: [{ dueDate: "asc" }],
    include: {
      notice: {
        select: { ref: true, org: { select: { name: true } } },
      },
    },
  });

  const overdueCount = actions.filter((a) =>
    isOverdue(a.dueDate, a.status),
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Remediation"
        description="Corrective actions tied to enforcement notices."
        actions={
          overdueCount > 0 ? (
            <Badge variant="destructive">{overdueCount} overdue</Badge>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Notice</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead>Update</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((a) => {
                const overdue = isOverdue(a.dueDate, a.status);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">
                      {a.notice.ref}
                    </TableCell>
                    <TableCell>{a.notice.org.name}</TableCell>
                    <TableCell>
                      <p className="font-medium">{a.milestone}</p>
                      {a.description ? (
                        <p className="text-xs text-muted-foreground">
                          {a.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className={
                        overdue ? "font-semibold text-destructive" : undefined
                      }
                    >
                      {a.dueDate ? a.dueDate.toLocaleDateString("en-NG") : "—"}
                    </TableCell>
                    <TableCell>
                      {overdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <StatusBadge status={a.status} />
                      )}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <form
                          action={updateRemediationStatus.bind(null, a.id)}
                          className="flex items-center gap-2"
                        >
                          <Select
                            name="status"
                            defaultValue={a.status}
                            className="h-8 w-32 text-xs"
                          >
                            {REMEDIATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                          <Button size="sm" type="submit">
                            Save
                          </Button>
                        </form>
                      </TableCell>
                    ) : null}
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
