import type { RegulatorRole } from "@/lib/enums";

/**
 * Stateless session token — a compact `payload.signature` string signed with
 * HMAC-SHA256 via the Web Crypto API. Web Crypto is available in BOTH the edge
 * (middleware) and Node (server action) runtimes, so this file has zero
 * dependencies and, crucially, does NOT import `next/headers` — that keeps it
 * importable from middleware.
 */

export const SESSION_COOKIE = "regwatch_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8-hour shift

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: RegulatorRole;
};

type TokenPayload = { user: SessionUser; exp: number };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Web Crypto wants `BufferSource`; TS types TextEncoder/Uint8Array output as
// `Uint8Array<ArrayBufferLike>`, which it won't narrow automatically. This cast
// bridges that one gap in a single, well-labelled place.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Fail loudly in any real run; tests/build without a secret would be insecure.
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    bs(encoder.encode(getSecret())),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign a session for the given user; returns the cookie value. */
export async function signToken(user: SessionUser): Promise<string> {
  const payload: TokenPayload = {
    user,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const data = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), bs(encoder.encode(data)));
  return `${data}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Verify a token's signature + expiry; returns the user or null. */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      bs(fromBase64Url(signature)),
      bs(encoder.encode(data)),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(data))) as TokenPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload.user;
  } catch {
    return null;
  }
}
