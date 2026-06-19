import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          NDPC · Nigeria Data Protection Commission
        </p>
        <h1 className="text-4xl font-semibold">RegWatch NG</h1>
        <p className="text-neutral-600">
          Regulator console and public transparency platform. One codebase, two
          audiences, separated by a hard confidentiality boundary.
        </p>
      </header>

      <nav className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-200 px-5 py-4 transition hover:border-neutral-400"
        >
          <span className="block font-medium">Regulator Console →</span>
          <span className="text-sm text-neutral-500">
            NDPC staff (authenticated)
          </span>
        </Link>
        <Link
          href="/transparency"
          className="rounded-lg border border-neutral-200 px-5 py-4 transition hover:border-neutral-400"
        >
          <span className="block font-medium">Public Transparency →</span>
          <span className="text-sm text-neutral-500">Citizens (no auth)</span>
        </Link>
      </nav>
    </main>
  );
}
