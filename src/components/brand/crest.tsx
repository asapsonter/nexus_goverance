import { cn } from "@/lib/utils";

type CrestProps = {
  /** Pixel size of the square emblem. */
  size?: number;
  className?: string;
  /** Accessible label; rendered as the SVG <title>. */
  title?: string;
};

/**
 * Placeholder for the NDPC coat-of-arms / eagle emblem. A real crest asset
 * drops in here later; until then this is an inline SVG so it inherits theme
 * colours (currentColor) and needs no network request.
 *
 * Labelled "NDPC crest" per the brief.
 */
export function Crest({ size = 40, className, title = "NDPC crest" }: CrestProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="none"
    >
      <title>{title}</title>
      {/* Shield outline */}
      <path
        d="M24 3.5 41 9v13.5C41 33 33.6 41 24 44.5 14.4 41 7 33 7 22.5V9l17-5.5Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Stylised eagle — wings + body, a placeholder for the national emblem */}
      <path
        d="M24 14c2.4 2.2 5.4 3.4 8.5 3.6-1.6 1.7-3.7 2.7-6 3 1.5 1 2.6 2.5 3.1 4.3-2-1-3.8-1.2-5.6-.6v8.1c-1.3-1-2.2-2.4-2.6-4-.4 1.6-1.3 3-2.6 4v-8.1c-1.8-.6-3.6-.4-5.6.6.5-1.8 1.6-3.3 3.1-4.3-2.3-.3-4.4-1.3-6-3 3.1-.2 6.1-1.4 8.5-3.6.9.8 1.9 1.4 3 1.7v-.1c1.1-.3 2.1-.9 3-1.6Z"
        fill="currentColor"
      />
      {/* Base band */}
      <rect
        x="16"
        y="35.5"
        width="16"
        height="2.4"
        rx="1.2"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}
