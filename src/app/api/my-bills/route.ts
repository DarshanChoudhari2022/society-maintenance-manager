import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user to find their flatId
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.flatId) {
    return Response.json({ error: "No flat assigned to this user" }, { status: 400 });
  }

  const bills = await prisma.maintenanceBill.findMany({
    where: {
      societyId: session.societyId,
      flatId: user.flatId,
    },
    include: {
      flat: true,
      society: {
        select: {
          upiId: true,
          bankDetails: true,
        }
      }
    },
    orderBy: { dueDate: "desc" },
  });

  const stats = {
    totalPending: bills.filter((b) => b.status === "pending").reduce((acc, b) => acc + b.amount + b.lateFee, 0),
    totalPaid: bills.filter((b) => b.status === "paid" || b.status === "partial").reduce((acc, b) => acc + (b.paidAmount || 0), 0),
  };

  return Response.json({ bills, stats });
}
