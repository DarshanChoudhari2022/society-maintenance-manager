import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.reminderLog.deleteMany();
  await prisma.maintenanceBill.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.society.deleteMany();

  // Create society
  const society = await prisma.society.create({
    data: {
      name: "Sunshine Apartments",
      address: "Plot No. 42, Sector 5, Vashi",
      city: "Navi Mumbai",
      pincode: "400703",
      totalFlats: 60,
      maintenanceAmt: 1500,
      dueDayOfMonth: 10,
      lateFee: 200,
      upiId: "sunshine.apt@upi",
      bankDetails: "SBI A/c XXXX1234, IFSC: SBIN0001234",
      planTier: "starter",
    },
  });

  // Create chairman user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Pramod Kadam",
      email: "admin@sunshine.com",
      password: hashedPassword,
      phone: "9284729592",
      role: "chairman",
      societyId: society.id,
    },
  });

  // Create flats
  const wings = ["A", "B", "C"];
  const names = [
    "Pramod Kadam",
    "Karan Barathe",
    "Sahil Dhiwar",
    "Sunita Shinde",
    "Raj Patil",
    "Meena Joshi",
    "Amit Kumar",
    "Priya Deshmukh",
    "Ramesh Pawar",
    "Anil More",
    "Sneha Kulkarni",
    "Vikas Chavan",
    "Deepak Jadhav",
    "Neha Gaikwad",
    "Sanjay Bhosale",
    "Kavita Nalawade",
    "Rohit Salunkhe",
    "Swati Mane",
    "Ganesh Deshpande",
    "Pooja Sawant",
  ];

  const contacts = [
    "9284729592",
    "9263988364",
    "9822737812",
    "9876543210",
    "9123456789",
    "9988776655",
    "9112233445",
    "9556677889",
    "9334455667",
    "9778899001",
    "9445566778",
    "9667788990",
    "9889900112",
    "9001122334",
    "9223344556",
    "9335566778",
    "9447788990",
    "9559900112",
    "9661122334",
    "9773344556",
  ];

  let flatIndex = 0;
  const flats = [];

  for (const wing of wings) {
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 5; unit++) {
        if (flatIndex >= 60) break;
        const flatNumber = `${wing}-${floor}0${unit}`;
        const nameIndex = flatIndex % names.length;

        const flat = await prisma.flat.create({
          data: {
            societyId: society.id,
            flatNumber,
            wing,
            floor,
            ownerName: names[nameIndex],
            contact: contacts[nameIndex],
            email:
              flatIndex % 3 === 0
                ? `${names[nameIndex].toLowerCase().replace(" ", ".")}@email.com`
                : null,
            vehicleNumber:
              flatIndex % 4 === 0
                ? `MH12${String.fromCharCode(65 + (flatIndex % 26))}${String.fromCharCode(65 + ((flatIndex + 1) % 26))}${1000 + flatIndex}`
                : null,
            isActive: flatIndex < 58, // 2 inactive flats
          },
        });
        flats.push(flat);
        flatIndex++;
      }
    }
  }

  // Generate bills for current month
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dueDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    society.dueDayOfMonth
  );

  const activeFlats = flats.filter((_, i) => i < 58);

  for (let i = 0; i < activeFlats.length; i++) {
    const flat = activeFlats[i];
    const isPaid = i < 40; // 40 paid, 18 pending

    await prisma.maintenanceBill.create({
      data: {
        flatId: flat.id,
        societyId: society.id,
        amount: society.maintenanceAmt,
        lateFee: 0,
        period: currentPeriod,
        dueDate,
        status: isPaid ? "paid" : "pending",
        paidAt: isPaid
          ? new Date(
              now.getFullYear(),
              now.getMonth(),
              5 + Math.floor(Math.random() * 15)
            )
          : null,
        paidVia: isPaid
          ? ["cash", "upi", "neft", "cheque"][Math.floor(Math.random() * 4)]
          : null,
        paidAmount: isPaid ? society.maintenanceAmt : null,
        receiptNumber: isPaid
          ? `RCP-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`
          : null,
      },
    });
  }

  // Add some expenses
  const expenses = [
    {
      title: "Lift AMC",
      amount: 8000,
      category: "maintenance",
      paidTo: "Kone India",
      paidOn: new Date(now.getFullYear(), now.getMonth(), 20),
    },
    {
      title: "Watchman salary",
      amount: 5000,
      category: "salary",
      paidTo: "Ramesh",
      paidOn: new Date(now.getFullYear(), now.getMonth(), 18),
    },
    {
      title: "Garden maintenance",
      amount: 1500,
      category: "maintenance",
      paidTo: "Ganesh",
      paidOn: new Date(now.getFullYear(), now.getMonth(), 15),
    },
    {
      title: "Plumbing repair",
      amount: 3500,
      category: "repair",
      paidTo: "Mahesh Plumbers",
      paidOn: new Date(now.getFullYear(), now.getMonth(), 12),
    },
    {
      title: "Electricity bill",
      amount: 12000,
      category: "utilities",
      paidTo: "MSEDCL",
      paidOn: new Date(now.getFullYear(), now.getMonth(), 10),
    },
  ];

  for (const exp of expenses) {
    await prisma.expense.create({
      data: {
        societyId: society.id,
        ...exp,
      },
    });
  }

  console.log("✅ Seed data created successfully!");
  console.log(` Society: ${society.name}`);
  console.log(` Flats: ${flats.length}`);
  console.log(` Active flats: ${activeFlats.length}`);
  console.log(` Bills: ${activeFlats.length} (40 paid, 18 pending)`);
  console.log(` Login: admin@sunshine.com / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
