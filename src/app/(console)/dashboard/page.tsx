export default function ConsoleDashboardPlaceholder() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 p-8">
      <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
        NDPC Console
      </p>
      <h1 className="text-3xl font-semibold">Regulator Console</h1>
      <p className="text-neutral-600">
        Authenticated workspace for NDPC staff (Modules 12 &amp; 13). Dashboard,
        investigations, complaints, notices, remediation and settlements will
        live here.
      </p>
      <p className="text-sm text-neutral-400">
        Placeholder scaffold — Prompt 0. Route group{" "}
        <code className="rounded bg-neutral-100 px-1">(console)</code>.
      </p>
    </main>
  );
}
