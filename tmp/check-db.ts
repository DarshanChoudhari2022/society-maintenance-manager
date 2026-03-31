
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Fetching all table names in 'public' schema...");
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Tables in DB:", (tables as any).map((t: any) => t.table_name));

    const expenseTable = (tables as any).find((t: any) => t.table_name.toLowerCase() === 'expense')?.table_name;
    if (expenseTable) {
        console.log(`Fetching columns for table: ${expenseTable}`);
        const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${expenseTable}'
          ORDER BY column_name;
        `);
        console.log(`Columns in ${expenseTable}:`, (columns as any).map((c: any) => c.column_name));
    } else {
        console.log("Expense table NOT found in DB!");
    }

  } catch (error) {
    console.error("Database SQL Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
