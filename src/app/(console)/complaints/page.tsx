import { PageHeader } from "@/components/brand/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/console/status-badge";
import { COMPLAINT_STATUSES } from "@/lib/enums";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { updateComplaint } from "./actions";

export default async function ComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sector?: string }>;
}) {
  const user = await requireUser();
  const canTriage = can(user, "complaint.assign");
  const { status, sector } = await searchParams;

  const where: Prisma.ComplaintWhereInput = {};
  if (status) where.status = status;
  if (sector) where.org = { sector: { key: sector } };

  const [complaints, sectors, staff] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        org: { select: { name: true, sector: { select: { name: true } } } },
        assignedTo: { select: { id: true, name: true } },
        investigation: { select: { caseRef: true } },
      },
    }),
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
    prisma.regulatorUser.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Complaints"
        description="Triage citizen complaints — filter, assign, and resolve."
      />

      {/* Filters (GET form) */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="w-44"
          >
            <option value="">All statuses</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sector">Sector</Label>
          <Select
            id="sector"
            name="sector"
            defaultValue={sector ?? ""}
            className="w-44"
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        {complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No complaints match these filters.
          </p>
        ) : null}

        {complaints.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-col gap-4 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.ref}
                    </span>
                    <StatusBadge status={c.status} />
                    {c.isPublic ? (
                      <span className="text-xs text-accent-ink">public</span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-medium">{c.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.org.name} · {c.org.sector.name} · via {c.channel}
                    {c.investigation
                      ? ` · linked to ${c.investigation.caseRef}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.submittedAt.toLocaleDateString("en-NG")}
                </span>
              </div>

              {canTriage ? (
                <form
                  action={updateComplaint.bind(null, c.id)}
                  className="grid items-end gap-3 sm:grid-cols-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`status-${c.id}`}>Status</Label>
                    <Select
                      id={`status-${c.id}`}
                      name="status"
                      defaultValue={c.status}
                    >
                      {COMPLAINT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`assignee-${c.id}`}>Assignee</Label>
                    <Select
                      id={`assignee-${c.id}`}
                      name="assigneeId"
                      defaultValue={c.assignedTo?.id ?? ""}
                    >
                      <option value="">Unassigned</option>
                      {staff.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`resolution-${c.id}`}>Resolution</Label>
                    <Input
                      id={`resolution-${c.id}`}
                      name="resolution"
                      defaultValue={c.resolution ?? ""}
                      placeholder="On resolve"
                    />
                  </div>
                  <Button type="submit">Save</Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Assigned to {c.assignedTo?.name ?? "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
