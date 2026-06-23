import { Badge } from "@/components/ui/badge";

type Variant = React.ComponentProps<typeof Badge>["variant"];

// Maps any domain status string to a badge variant. The "issue" states
// (overdue, rejected, breached, escalated) are red per the project convention.
const STATUS_VARIANT: Record<string, Variant> = {
  // positive / done
  verified: "success",
  completed: "success",
  resolved: "success",
  active: "success",
  acknowledged: "success",
  certified: "success",
  // neutral / in-flight
  closed: "secondary",
  dismissed: "secondary",
  draft: "outline",
  new: "secondary",
  submitted: "secondary",
  routed: "secondary",
  triage: "warning",
  pending: "warning",
  in_progress: "warning",
  investigating: "warning",
  issued: "warning",
  open: "warning",
  // red issues
  overdue: "destructive",
  rejected: "destructive",
  breached: "destructive",
  escalated: "destructive",
};

const labelize = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {labelize(status)}
    </Badge>
  );
}

export function RiskBandBadge({ band }: { band: string }) {
  const variant: Variant =
    band === "high" ? "destructive" : band === "medium" ? "warning" : "success";
  return <Badge variant={variant}>{labelize(band)}</Badge>;
}
