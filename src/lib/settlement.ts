/**
 * Pure settlement helpers (no DB, no server-action directive) so they can be
 * imported from both Server Components and the publish layer.
 */

export type MilestoneLike = { verificationStatus: string };

/** Progress = verified milestones / total, as a 0–100 integer. */
export function computeProgress(milestones: MilestoneLike[]): number {
  if (milestones.length === 0) return 0;
  const verified = milestones.filter(
    (m) => m.verificationStatus === "verified",
  ).length;
  return Math.round((verified / milestones.length) * 100);
}
