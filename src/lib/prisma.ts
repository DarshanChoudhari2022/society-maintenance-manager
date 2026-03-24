import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  _prisma: PrismaClient | undefined;
};

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma._prisma) {
      if (!process.env.DATABASE_URL) {
        throw new Error("🚨 Vercel Environment Error: The 'DATABASE_URL' variable is completely missing or misspelled in your Vercel Dashboard Settings!");
      }
      globalForPrisma._prisma = new PrismaClient({
        datasourceUrl: process.env.DATABASE_URL,
      });
    }
    // @ts-ignore
    return globalForPrisma._prisma[prop];
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma._prisma = globalForPrisma._prisma || new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
}
