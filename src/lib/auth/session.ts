import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signToken,
  verifyToken,
  type SessionUser,
} from "./token";

/**
 * Cookie-backed session helpers for Server Components / Server Actions.
 * (Middleware uses `verifyToken` from ./token directly against request cookies.)
 */

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export type { SessionUser };
