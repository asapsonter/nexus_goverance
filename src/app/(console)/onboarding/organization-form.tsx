"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { registerOrganization, type FormState } from "./actions";

export function OrganizationForm({
  sectors,
}: {
  sectors: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    registerOrganization,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          name="name"
          required
          placeholder="e.g. Sterling Microfinance Bank"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-sector">Sector</Label>
          <Select id="org-sector" name="sectorId" required defaultValue="">
            <option value="" disabled>
              Select sector…
            </option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="org-hq">Headquarters</Label>
          <Input id="org-hq" name="headquarters" placeholder="e.g. Lagos" />
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          role="status"
          className="rounded-md border border-primary/30 bg-secondary px-3 py-2 text-sm text-secondary-foreground"
        >
          {state.ok}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add organization"}
        </Button>
      </div>
    </form>
  );
}
