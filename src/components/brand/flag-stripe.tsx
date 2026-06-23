import { cn } from "@/lib/utils";

type FlagStripeProps = {
  /** Stripe thickness. Defaults to a thin 3px accent bar. */
  height?: number;
  className?: string;
};

/**
 * Thin green-white-green accent bar echoing the Nigerian flag. Used as the top
 * edge of headers. Colours come from semantic tokens so a re-skin flows through.
 */
export function FlagStripe({ height = 3, className }: FlagStripeProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn("flex w-full", className)}
      style={{ height }}
    >
      <span className="h-full flex-1 bg-flag-green" />
      <span className="h-full flex-1 bg-flag-white" />
      <span className="h-full flex-1 bg-flag-green" />
    </div>
  );
}
