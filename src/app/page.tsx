import Link from "next/link";
import { BrandHeader } from "@/components/brand/brand-header";
import { PageHeader } from "@/components/brand/page-header";

const ENTRIES = [
  {
    href: "/dashboard",
    title: "Regulator Console",
    note: "NDPC staff — authenticated",
  },
  {
    href: "/transparency",
    title: "Public Transparency",
    note: "Citizens — no sign-in",
  },
];

export default function Home() {
  return (
    <div className="theme-console flex min-h-dvh flex-col bg-background text-foreground">
      <BrandHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-12 sm:px-6">
        <PageHeader
          eyebrow="NDPC · Nigeria Data Protection Commission"
          accentEyebrow
          title="RegWatch NG"
          description="Regulator console and public transparency platform. One codebase, two audiences, separated by a hard confidentiality boundary."
        />
        <nav className="grid gap-4 sm:grid-cols-2">
          {ENTRIES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="flex flex-col gap-1 rounded-lg border border-border p-5 transition-colors hover:border-primary hover:bg-secondary"
            >
              <span className="display display-sm">{e.title}</span>
              <span className="text-sm text-muted-foreground">{e.note}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
