import Link from "next/link";
import { PageHeader } from "@/components/brand/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackForm } from "./track-form";

export default function TrackPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/rights"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Submit a request
        </Link>
        <PageHeader
          eyebrow="Your data rights"
          title="Track your request"
          description="Enter your reference code and the email you used to see the status timeline."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackForm />
        </CardContent>
      </Card>
    </div>
  );
}
