import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicOrganizationScores } from "@/lib/public-data";
import { SubmitForm } from "./submit-form";

export default async function RightsPage() {
  // Only published orgs are valid request targets; reuse the public read layer.
  const scores = await getPublicOrganizationScores();
  const orgs = scores.map((o) => ({ slug: o.slug, name: o.name }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Your data rights"
        title="Exercise your data protection rights"
        description="Under the Nigeria Data Protection Act you can ask any organization to give you a copy of, correct, or delete your personal data, or withdraw your consent."
        actions={
          <Link
            href="/rights/track"
            className="rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            Track a request
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Submit a request</CardTitle>
          <p className="text-sm text-muted-foreground">
            We will route your request to the organization’s Data Protection
            Officer and give you a reference code to track it.
          </p>
        </CardHeader>
        <CardContent>
          <SubmitForm orgs={orgs} />
        </CardContent>
      </Card>
    </div>
  );
}
