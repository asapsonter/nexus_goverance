import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/**
 * KPI stat card. When `alert` is set and the value is non-zero, the figure
 * turns red — the "issue counts are red" convention.
 */
export function StatCard({
  label,
  value,
  hint,
  alert = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  alert?: boolean;
}) {
  const isAlerting = alert && Number(value) > 0;
  return (
    <Card className="p-5">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          "figure mt-2 text-3xl font-semibold tabular-nums",
          isAlerting ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
