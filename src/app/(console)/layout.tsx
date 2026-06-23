import Link from "next/link";
import { BrandHeader } from "@/components/brand/brand-header";
import { requireUser } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/investigations", label: "Investigations" },
  { href: "/complaints", label: "Complaints" },
  { href: "/notices", label: "Notices" },
  { href: "/remediation", label: "Remediation" },
  { href: "/settlements", label: "Settlements" },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  investigator: "Investigator",
  analyst: "Analyst",
  settlement_officer: "Settlement Officer",
  read_only: "Read Only",
};

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates these routes; this also gives us the user object
  // for display and redirects defensively if the session is somehow absent.
  const user = await requireUser();

  // Onboarding is admin-only; show it to those who can register staff or orgs.
  const nav = [
    ...NAV,
    ...(can(user, "user.manage") || can(user, "organization.manage")
      ? [{ href: "/onboarding", label: "Onboarding" }]
      : []),
  ];

  return (
    <div className="theme-console flex min-h-dvh flex-col bg-background text-foreground">
      <BrandHeader>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-1.5 text-header-foreground/85 transition-colors hover:bg-white/10 hover:text-header-foreground"
          >
            {item.label}
          </Link>
        ))}
        <span className="mx-2 hidden h-5 w-px bg-white/20 sm:block" />
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-medium text-header-foreground">
            {user.name}
          </span>
          <span className="text-[0.7rem] text-header-muted">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 text-header-foreground/85 transition-colors hover:bg-white/10 hover:text-header-foreground"
          >
            Sign out
          </button>
        </form>
      </BrandHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
