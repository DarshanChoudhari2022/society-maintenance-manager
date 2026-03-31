
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const columns: any = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Expense';
    `);
    
    const columnNames = columns.map((c: any) => c.column_name);
    console.log("Column Names in Expense:", JSON.stringify(columnNames));

  } catch (error) {
    console.error("Database SQL Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
