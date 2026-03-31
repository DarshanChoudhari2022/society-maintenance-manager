import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Reuse pool across hot reloads — with optimized connection settings
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: 10,                    // max connections in pool
    idleTimeoutMillis: 30000,   // close idle connections after 30s
    connectionTimeoutMillis: 5000, // fail fast if can't connect in 5s
    allowExitOnIdle: true,      // allow process to exit if pool idle
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
