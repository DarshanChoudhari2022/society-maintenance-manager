
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Connection String:", connectionString ? "Found" : "Missing");
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Testing connection...");
    const societyCount = await prisma.society.count();
    console.log("Society count:", societyCount);

    console.log("Testing Expense model...");
    const expenseCount = await prisma.expense.count();
    console.log("Expense count:", expenseCount);

    const firstExpense = await prisma.expense.findFirst();
    console.log("First expense:", firstExpense);

  } catch (error) {
    console.error("Database Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
