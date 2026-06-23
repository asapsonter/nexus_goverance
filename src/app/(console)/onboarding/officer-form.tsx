"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { REGULATOR_ROLES } from "@/lib/enums";
import { registerOfficer, type FormState } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  investigator: "Investigator (lead officer)",
  analyst: "Analyst",
  settlement_officer: "Settlement Officer",
  read_only: "Read Only",
};

export function OfficerForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    registerOfficer,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-name">Full name</Label>
          <Input id="o-name" name="name" required placeholder="Chidi Okeke" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="o-role">Role</Label>
          <Select id="o-role" name="role" required defaultValue="investigator">
            {REGULATOR_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r] ?? r}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="o-email">Email</Label>
        <Input
          id="o-email"
          name="email"
          type="email"
          required
          placeholder="name@ndpc.gov.ng"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="o-password">Temporary password</Label>
        <Input
          id="o-password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
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
          {pending ? "Registering…" : "Register officer"}
        </Button>
      </div>
    </form>
  );
}
