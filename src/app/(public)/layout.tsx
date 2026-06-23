import Link from "next/link";
import { BrandHeader } from "@/components/brand/brand-header";

const NAV = [
  { href: "/transparency", label: "Transparency" },
  { href: "/transparency/advisories", label: "Advisories" },
  { href: "/rights", label: "Your rights" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-public flex min-h-dvh flex-col bg-background text-foreground">
      <BrandHeader homeHref="/transparency">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1.5 text-header-foreground/85 transition-colors hover:bg-white/10 hover:text-header-foreground"
          >
            {item.label}
          </Link>
        ))}
      </BrandHeader>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
