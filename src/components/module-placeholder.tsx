import { PageHeader } from "@/components/brand/page-header";

type ModulePlaceholderProps = {
  /** Small uppercase eyebrow, e.g. "NDPC Console" or "Public Transparency". */
  group: string;
  /** Page title. */
  title: string;
  /** One- or two-sentence description of what will live here. */
  description: string;
  /** Which build prompt fills this in, e.g. "Prompt 4 — Module 12". */
  prompt: string;
  /** Route group label shown in the footer, e.g. "(console)". */
  routeGroup: "(console)" | "(public)";
};

/**
 * Shared scaffold page used by every route stub until its module is built.
 * Renders inside the route-group layout (which supplies the masthead + main),
 * so it uses the design-system PageHeader rather than its own page chrome.
 * Replaced per-route in Prompts 4–7.
 */
export function ModulePlaceholder({
  group,
  title,
  description,
  prompt,
  routeGroup,
}: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={group} title={title} description={description} />
      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Placeholder scaffold — {prompt}. Route group{" "}
        <code className="rounded bg-secondary px-1 font-mono text-secondary-foreground">
          {routeGroup}
        </code>
        .
      </div>
    </div>
  );
}
