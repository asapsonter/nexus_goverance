import { cn } from "@/lib/utils";

type PageHeaderProps = {
  /** Page title — rendered in the serif display face. */
  title: string;
  /** Optional uppercase eyebrow above the title. */
  eyebrow?: string;
  /** Use the gold accent for the eyebrow (emphasis only). */
  accentEyebrow?: boolean;
  /** Optional supporting sentence below the title. */
  description?: string;
  /** Right-hand slot — primary action buttons, filters, etc. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Standard page heading block: eyebrow + serif title + lead description, with an
 * optional actions slot. Sits below the BrandHeader on console and public pages.
 */
export function PageHeader({
  title,
  eyebrow,
  accentEyebrow = false,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        {eyebrow ? (
          <span className={cn("eyebrow", accentEyebrow && "eyebrow-accent")}>
            {eyebrow}
          </span>
        ) : null}
        <h1 className="display display-lg">{title}</h1>
        {description ? (
          <p className="lead max-w-2xl text-balance">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
