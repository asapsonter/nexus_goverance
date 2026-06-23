import { createHash } from "node:crypto";

/**
 * SHA-256 of a normalized email. We store only this hash for data-subject
 * requests — never the raw address — and the requester reproduces it (via their
 * email) to track a request. Mirrors the hashing used by the seed.
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
