import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Crest } from "@/components/brand/crest";
import { FlagStripe } from "@/components/brand/flag-stripe";
import { Wordmark } from "@/components/brand/brand-header";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · RegWatch NG Console",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already signed in? Skip the form.
  if (await getSession()) redirect("/dashboard");

  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <div className="theme-console flex min-h-dvh flex-col bg-background text-foreground">
      <FlagStripe />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Crest size={48} className="text-primary" />
            <Wordmark className="items-center" />
            <p className="text-sm text-muted-foreground">
              Regulator Console — staff sign-in
            </p>
          </div>

          <LoginForm next={safeNext} />

          <div className="mt-6 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            <p className="font-semibold">Demo accounts (password: RegWatch#2026)</p>
            <p className="mt-1 text-muted-foreground">
              aisha.bello@ndpc.gov.ng — superadmin
              <br />
              ngozi.eze@ndpc.gov.ng — analyst
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
