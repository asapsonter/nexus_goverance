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
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { OfficerForm } from "./officer-form";
import { OrganizationForm } from "./organization-form";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  investigator: "Investigator",
  analyst: "Analyst",
  settlement_officer: "Settlement Officer",
  read_only: "Read Only",
};

export default async function OnboardingPage() {
  const user = await requireUser();
  const canManageUsers = can(user, "user.manage");
  const canManageOrgs = can(user, "organization.manage");

  if (!canManageUsers && !canManageOrgs) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="NDPC Console"
          title="Onboarding"
          description="Register lead officers and organizations."
        />
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Your role does not have onboarding permissions.
        </div>
      </div>
    );
  }

  const [sectors, officers, orgs] = await Promise.all([
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
    canManageUsers
      ? prisma.regulatorUser.findMany({ orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    canManageOrgs
      ? prisma.organization.findMany({
          orderBy: { createdAt: "desc" },
          include: { sector: { select: { name: true } } },
          take: 12,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="NDPC Console"
        title="Onboarding"
        description="Register lead officers who can handle investigations, and add the organizations the Commission monitors."
      />

      {/* Officers */}
      {canManageUsers ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Register a lead officer</CardTitle>
              <p className="text-sm text-muted-foreground">
                Investigators can be assigned to lead cases.
              </p>
            </CardHeader>
            <CardContent>
              <OfficerForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officers.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ROLE_LABEL[o.role] ?? o.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Organizations */}
      {canManageOrgs ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add an organization</CardTitle>
              <p className="text-sm text-muted-foreground">
                New organizations start internal and unrated — score and publish
                them later.
              </p>
            </CardHeader>
            <CardContent>
              <OrganizationForm
                sectors={sectors.map((s) => ({ id: s.id, name: s.name }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Visibility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {o.sector.name}
                      </TableCell>
                      <TableCell>
                        {o.visibility === "public" ? (
                          <Badge variant="success">Public</Badge>
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
      ) : null}
    </div>
  );
}
