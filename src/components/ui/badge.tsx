import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        /** Primary state — Nigerian green. */
        default: "bg-primary text-primary-foreground",
        /** Neutral, low-emphasis tag. */
        secondary: "bg-secondary text-secondary-foreground",
        /** Gold emphasis — use sparingly. */
        accent: "bg-accent text-accent-foreground",
        /** Certified / verified / on-track. */
        success: "bg-success text-success-foreground",
        /** Due soon / pending attention. */
        warning: "bg-warning text-warning-foreground",
        /** Issue counts, overdue, rejected — the "red" convention. */
        destructive: "bg-destructive text-destructive-foreground",
        /** Quiet outline tag. */
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
