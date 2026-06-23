"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { NOTICE_TYPES } from "@/lib/enums";
import { issueNotice, type NoticeFormState } from "./actions";

export function NoticeForm({
  orgs,
}: {
  orgs: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<NoticeFormState, FormData>(
    issueNotice,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orgId">Organization</Label>
          <Select id="orgId" name="orgId" required defaultValue="">
            <option value="" disabled>
              Select organization…
            </option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Notice type</Label>
          <Select id="type" name="type" required defaultValue="">
            <option value="" disabled>
              Select type…
            </option>
            {NOTICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required placeholder="Short notice title" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" placeholder="What is required and why" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="publish" className="size-4" />
          Publish to transparency portal
        </label>
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
          Notice issued.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Issuing…" : "Issue notice"}
        </Button>
      </div>
    </form>
  );
}
