import { redirect } from "next/navigation";
import { getSession } from "./session";
import { assertCan, can, type Action } from "./rbac";
import type { SessionUser } from "./token";

/**
 * Server-side guards for Server Components / Server Actions.
 *  - requireUser(): redirect to /login if unauthenticated, else return the user.
 *  - requireCan(): like requireUser, but also enforce a permission.
 */

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireCan(action: Action): Promise<SessionUser> {
  const user = await requireUser();
  assertCan(user, action);
  return user;
}

export { can, assertCan, type Action };
