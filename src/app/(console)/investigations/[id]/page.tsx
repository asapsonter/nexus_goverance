import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/brand/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/console/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { CaseStatusControl, EvidencePanel } from "./case-controls";

export default async function InvestigationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      org: { include: { sector: true } },
      leadOfficer: { select: { name: true } },
      evidence: {
        orderBy: { collectedAt: "desc" },
        // NB: fileRef is intentionally NOT selected — it is only disclosed via
        // the audited revealEvidence() action.
        select: {
          id: true,
          type: true,
          description: true,
          verificationStatus: true,
          collectedAt: true,
        },
      },
    },
  });

  if (!investigation) notFound();

  const canManage = can(user, "investigation.manage");
  const canView = can(user, "evidence.view");
  const canVerify = can(user, "evidence.verify");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/investigations"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All investigations
        </Link>
        <PageHeader
          eyebrow={investigation.caseRef}
          title={investigation.title}
          description={investigation.summary ?? undefined}
          actions={<StatusBadge status={investigation.status} />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Case details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div>
              <p className="eyebrow">Organization</p>
              <p className="font-medium">{investigation.org.name}</p>
              <p className="text-muted-foreground">
                {investigation.org.sector.name}
              </p>
            </div>
            <div>
              <p className="eyebrow">Lead officer</p>
              <p>{investigation.leadOfficer?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="eyebrow">Opened</p>
              <p>{investigation.openedAt.toLocaleDateString("en-NG")}</p>
            </div>
            <div>
              <p className="eyebrow">Status</p>
              {canManage ? (
                <CaseStatusControl
                  investigationId={investigation.id}
                  status={investigation.status}
                  disabled={false}
                />
              ) : (
                <StatusBadge status={investigation.status} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Evidence review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Revealing a file reference is recorded in the audit log.
            </p>
          </CardHeader>
          <CardContent>
            <EvidencePanel
              canView={canView}
              canVerify={canVerify}
              items={investigation.evidence.map((e) => ({
                id: e.id,
                type: e.type,
                description: e.description,
                verificationStatus: e.verificationStatus,
                collectedAt: e.collectedAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
