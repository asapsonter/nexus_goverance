"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/console/status-badge";
import { trackRequest, type TrackState } from "../actions";

const TYPE_LABEL: Record<string, string> = {
  access: "Access",
  correction: "Correction",
  deletion: "Deletion",
  withdrawal: "Withdraw consent",
};

export function TrackForm() {
  const [state, formAction, pending] = useActionState<TrackState, FormData>(
    trackRequest,
    {},
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refCode">Reference code</Label>
          <Input id="refCode" name="refCode" required placeholder="RW-XXXXXX" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email used</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="otp">One-time code</Label>
          <Input id="otp" name="otp" placeholder="Any 6 digits (demo)" />
          <p className="text-xs text-muted-foreground">
            OTP verification is stubbed for the MVP — any value is accepted.
          </p>
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
            {pending ? "Looking up…" : "Track request"}
          </Button>
        </div>
      </form>

      {state.request ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="figure text-lg font-bold">
              {state.request.refCode}
            </span>
            <Badge variant="outline">{TYPE_LABEL[state.request.type]}</Badge>
            <StatusBadge status={state.request.status} />
            {state.request.escalated ? (
              <Badge variant="destructive">Escalated</Badge>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {state.request.organization} · SLA due{" "}
            {new Date(state.request.slaDueAt).toLocaleDateString("en-NG")}
          </p>

          <ol className="mt-5 flex flex-col gap-4 border-l border-border pl-5">
            {state.events?.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.6rem] top-1 size-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2">
                  <StatusBadge status={e.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString("en-NG")}
                  </span>
                </div>
                {e.note ? <p className="mt-1 text-sm">{e.note}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
