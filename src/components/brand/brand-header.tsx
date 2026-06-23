import Link from "next/link";
import { cn } from "@/lib/utils";
import { Crest } from "./crest";
import { FlagStripe } from "./flag-stripe";

/**
 * Official wordmark lockup: the platform name "RegWatch" over the issuing-body
 * line "NDPC · Nigeria Data Protection Commission". Exported on its own so it
 * can sit in footers or print headers too.
 */
export function Wordmark({
  className,
  onHeader = false,
}: {
  className?: string;
  /** Tints the body line for legibility on the dark header surface. */
  onHeader?: boolean;
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="display display-sm font-bold tracking-tight">
        RegWatch
      </span>
      <span
        className={cn(
          "mt-1 text-[0.7rem] font-medium uppercase tracking-[0.14em]",
          onHeader ? "text-header-muted" : "text-muted-foreground",
        )}
      >
        NDPC · Nigeria Data Protection Commission
      </span>
    </span>
  );
}

type BrandHeaderProps = {
  /** Where the wordmark links to. Defaults to home. */
  homeHref?: string;
  /** Right-hand slot — nav links, user menu, or sign-in. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * The shared masthead: a thin green-white-green flag stripe over a deep-forest
 * bar carrying the crest, the wordmark lockup, and an optional actions slot.
 * Identical chrome across both themes (it reads the shared --header tokens).
 */
export function BrandHeader({
  homeHref = "/",
  children,
  className,
}: BrandHeaderProps) {
  return (
    <header className={cn("w-full", className)}>
      <FlagStripe />
      <div className="bg-header text-header-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={homeHref}
            className="flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-header-accent"
          >
            <Crest size={38} className="text-header-accent" />
            <Wordmark onHeader className="text-header-foreground" />
          </Link>
          {children ? (
            <nav className="flex items-center gap-1 text-sm">{children}</nav>
          ) : null}
        </div>
      </div>
    </header>
  );
}
