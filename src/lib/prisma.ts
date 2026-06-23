import { PrismaClient } from "@prisma/client";

/**
 * Full-access Prisma client singleton. Reused across hot reloads in dev to
 * avoid exhausting database connections.
 *
 * IMPORTANT: this client can read every table, including confidential ones.
 * The public portal must NOT import this directly — it goes through
 * `src/lib/public-data.ts`, which exposes a restricted, published-only reader.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
