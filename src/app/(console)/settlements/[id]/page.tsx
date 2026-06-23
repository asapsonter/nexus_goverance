import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/brand/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/console/status-badge";
import {
  MILESTONE_CATEGORIES,
  VERIFICATION_STATUSES,
} from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { computeProgress } from "@/lib/settlement";
import { publishSettlement, unpublishSettlement } from "@/lib/publish";
import {
  addMilestone,
  recordMilestoneEvidence,
  setMilestoneVerification,
} from "../actions";

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const CATEGORY_LABEL: Record<string, string> = {
  hosting: "Local hosting",
  consent: "Consent redesign",
  public_benefit: "Public benefit",
  other: "Other",
};

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      org: { include: { sector: true } },
      milestones: { orderBy: { deadline: "asc" } },
    },
  });
  if (!settlement) notFound();

  const canVerify = can(user, "settlement.verify");
  const canManage = can(user, "settlement.manage");
  const progress = computeProgress(settlement.milestones);
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/settlements"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All settlements
        </Link>
        <PageHeader
          eyebrow={`${settlement.ref} · ${settlement.org.name}`}
          title="Settlement"
          description={settlement.summary}
          actions={<StatusBadge status={settlement.status} />}
        />
      </div>

      {/* Top summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total fine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="figure text-2xl font-semibold tabular-nums">
              {NGN.format(settlement.totalFine)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="figure text-2xl font-semibold tabular-nums">
              {progress}%
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Verified milestones
            </p>
          </CardContent>
        </Card>

        {/* Publish toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Public progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {settlement.progressPublished ? (
              <>
                <Badge variant="success">
                  Published · {settlement.publishedProgress ?? progress}%
                </Badge>
                <p className="text-xs text-muted-foreground">
                  A sanitized summary is visible on the transparency portal. No
                  evidence is exposed.
                </p>
                {canManage ? (
                  <form action={unpublishSettlement.bind(null, settlement.id)}>
                    <Button size="sm" variant="outline" type="submit">
                      Unpublish
                    </Button>
                  </form>
                ) : null}
              </>
            ) : (
              <>
                <Badge variant="outline">Internal only</Badge>
                <p className="text-xs text-muted-foreground">
                  Publish a sanitized progress summary to the public portal.
                </p>
                {canManage ? (
                  <form action={publishSettlement.bind(null, settlement.id)}>
                    <Button size="sm" type="submit">
                      Publish progress
                    </Button>
                  </form>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <p className="text-sm text-muted-foreground">
            Required corrective actions, deadlines and verification.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {settlement.milestones.map((m) => {
            const overdue =
              m.deadline < now && m.verificationStatus !== "verified";
            return (
              <div key={m.id} className="flex flex-col gap-3 py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{m.title}</p>
                      <Badge variant="secondary">
                        {CATEGORY_LABEL[m.category] ?? m.category}
                      </Badge>
                    </div>
                    {m.description ? (
                      <p className="text-sm text-muted-foreground">
                        {m.description}
                      </p>
                    ) : null}
                    <p
                      className={`mt-1 text-xs ${
                        overdue
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      Deadline: {m.deadline.toLocaleDateString("en-NG")}
                      {overdue ? " · OVERDUE" : ""}
                    </p>
                  </div>
                  <StatusBadge status={m.verificationStatus} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Evidence:{" "}
                    {m.evidenceRef ? (
                      <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                        {m.evidenceRef}
                      </code>
                    ) : (
                      "none submitted"
                    )}
                  </span>
                </div>

                {(canManage || canVerify) && (
                  <div className="flex flex-wrap items-end gap-4">
                    {canManage ? (
                      <form
                        action={recordMilestoneEvidence.bind(null, m.id)}
                        className="flex items-end gap-2"
                      >
                        <div className="flex flex-col gap-1">
                          <Label htmlFor={`ev-${m.id}`} className="text-xs">
                            Record evidence
                          </Label>
                          <Input
                            id={`ev-${m.id}`}
                            name="evidenceRef"
                            placeholder="file reference"
                            className="h-8 w-48 text-xs"
                          />
                        </div>
                        <Button size="sm" variant="outline" type="submit">
                          Save
                        </Button>
                      </form>
                    ) : null}

                    {canVerify ? (
                      <form
                        action={setMilestoneVerification.bind(null, m.id)}
                        className="flex items-end gap-2"
                      >
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`vs-${m.id}`}
                            className="text-xs"
                          >
                            Verification
                          </Label>
                          <Select
                            id={`vs-${m.id}`}
                            name="status"
                            defaultValue={m.verificationStatus}
                            className="h-8 w-32 text-xs"
                          >
                            {VERIFICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <Button size="sm" type="submit">
                          Apply
                        </Button>
                      </form>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Add milestone */}
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add milestone</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={addMilestone.bind(null, settlement.id)}
              className="grid items-end gap-3 sm:grid-cols-4"
            >
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" required defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  {MILESTONE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input id="deadline" name="deadline" type="date" required />
              </div>
              <div className="sm:col-span-4">
                <Button type="submit">Add milestone</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
