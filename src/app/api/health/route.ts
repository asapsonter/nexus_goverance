import { NextResponse } from "next/server";

/**
 * Liveness/health probe. Intentionally trivial and dependency-free so it can be
 * used by deploy checks without touching the database or auth.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    app: "regwatch-ng",
    timestamp: new Date().toISOString(),
  });
}
