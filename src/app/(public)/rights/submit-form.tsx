"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { DSR_TYPES } from "@/lib/enums";
import { submitRequest, type SubmitState } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  access: "Access my data",
  correction: "Correct my data",
  deletion: "Delete my data",
  withdrawal: "Withdraw consent",
};

export function SubmitForm({
  orgs,
}: {
  orgs: { slug: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitRequest,
    {},
  );

  if (state.refCode) {
    return (
      <div className="rounded-lg border border-primary/30 bg-secondary p-6">
        <p className="text-sm text-muted-foreground">Your reference code</p>
        <p className="figure mt-1 text-3xl font-bold tracking-wide">
          {state.refCode}
        </p>
        <p className="mt-3 text-sm">
          Save this code. You can{" "}
          <Link
            href="/rights/track"
            className="font-semibold text-primary hover:underline"
          >
            track your request
          </Link>{" "}
          using this code and your email.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">What do you want to do?</Label>
        <Select id="type" name="type" required defaultValue="">
          <option value="" disabled>
            Select a request type…
          </option>
          {DSR_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t] ?? t}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="orgSlug">Organization</Label>
        <Select id="orgSlug" name="orgSlug" required defaultValue="">
          <option value="" disabled>
            Select the organization…
          </option>
          {orgs.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Your email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
        />
        <p className="text-xs text-muted-foreground">
          We store only a secure hash of your email, never the address itself.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="detail">Details (optional)</Label>
        <Textarea
          id="detail"
          name="detail"
          placeholder="e.g. Please delete the marketing data you hold about me."
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
