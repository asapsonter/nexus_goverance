"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { StatusBadge } from "@/components/console/status-badge";
import {
  INVESTIGATION_STATUSES,
  VERIFICATION_STATUSES,
  type InvestigationStatus,
} from "@/lib/enums";
import {
  revealEvidence,
  setEvidenceVerification,
  updateInvestigationStatus,
} from "../actions";

export function CaseStatusControl({
  investigationId,
  status,
  disabled,
}: {
  investigationId: string;
  status: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      defaultValue={status}
      disabled={disabled || pending}
      className="w-44"
      onChange={(e) =>
        startTransition(() =>
          updateInvestigationStatus(
            investigationId,
            e.target.value as InvestigationStatus,
          ),
        )
      }
    >
      {INVESTIGATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}

type EvidenceItem = {
  id: string;
  type: string;
  description: string | null;
  verificationStatus: string;
  collectedAt: string;
};

export function EvidencePanel({
  items,
  canView,
  canVerify,
}: {
  items: EvidenceItem[];
  canView: boolean;
  canVerify: boolean;
}) {
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const reveal = (id: string) =>
    startTransition(async () => {
      const { fileRef } = await revealEvidence(id);
      setRevealed((prev) => ({ ...prev, [id]: fileRef }));
    });

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No evidence recorded for this case.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((ev) => (
        <li key={ev.id} className="flex flex-col gap-2 py-4 first:pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium capitalize">{ev.type}</p>
              {ev.description ? (
                <p className="text-sm text-muted-foreground">
                  {ev.description}
                </p>
              ) : null}
            </div>
            <StatusBadge status={ev.verificationStatus} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canView ? (
              revealed[ev.id] ? (
                <code className="rounded bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
                  {revealed[ev.id]}
                </code>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => reveal(ev.id)}
                >
                  Reveal file (audited)
                </Button>
              )
            ) : (
              <span className="text-xs text-muted-foreground">
                Evidence access restricted for your role
              </span>
            )}

            {canVerify ? (
              <form
                action={setEvidenceVerification.bind(null, ev.id)}
                className="flex items-center gap-2"
              >
                <Select
                  name="status"
                  defaultValue={ev.verificationStatus}
                  className="h-8 w-32 text-xs"
                >
                  {VERIFICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <Button size="sm" type="submit">
                  Save
                </Button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
