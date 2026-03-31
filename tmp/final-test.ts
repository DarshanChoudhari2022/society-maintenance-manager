
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Testing Expense.findMany() now...");
    const expenses = await prisma.expense.findMany({
      take: 1
    });
    console.log("Success! Expenses found:", expenses.length);

  } catch (error) {
    console.error("Database Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
