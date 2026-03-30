const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient();
  console.log("Success");
} catch (e) {
  console.log("Error name:", e.name);
  console.log("Error message:", e.message);
}
