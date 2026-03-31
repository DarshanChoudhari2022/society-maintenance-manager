import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { logPayment } from "@/lib/activity-log";
import { broadcastNotification } from "@/lib/notifications";
import { generateReceiptNumber } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/my-bills/[id]/pay">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.flatId) {
    return Response.json({ error: "No flat assigned" }, { status: 400 });
  }

  const bill = await prisma.maintenanceBill.findFirst({
    where: { id, societyId: session.societyId, flatId: user.flatId },
    include: { flat: true },
  });

  if (!bill) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  if (bill.status === "paid") {
    return Response.json({ error: "Bill is already paid" }, { status: 400 });
  }

  const totalAmount = bill.amount + bill.lateFee;

  // Generate receipt number
  const year = new Date().getFullYear();
  const lastReceipt = await prisma.maintenanceBill.findFirst({
    where: {
      societyId: session.societyId,
      receiptNumber: { startsWith: `RCP-${year}` },
    },
    orderBy: { receiptNumber: "desc" },
  });

  let sequence = 1;
  if (lastReceipt?.receiptNumber) {
    const lastSeq = parseInt(lastReceipt.receiptNumber.split("-")[2]);
    sequence = lastSeq + 1;
  }

  const receiptNumber = generateReceiptNumber(year, sequence);

  // Mock processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const updated = await prisma.maintenanceBill.update({
    where: { id },
    data: {
      status: "paid",
      paidAt: new Date(),
      paidVia: "upi", // Mocking online gateway
      paidAmount: totalAmount,
      receiptNote: "Online Payment via App (Razorpay Mock)",
      receiptNumber,
    },
    include: { flat: true },
  });

  // Audit log
  await logPayment(id, `Flat ${bill.flat.flatNumber} - ${bill.period}`, {
    amount: totalAmount,
    method: "online",
    status: "paid",
    ownerName: bill.flat.ownerName,
    gateway: "Razorpay (Mock)",
  });

  // Notification to committee
  await broadcastNotification(
    session.societyId,
    "bill_paid",
    `Online Payment Received - Flat ${bill.flat.flatNumber}`,
    `₹${totalAmount} received from ${bill.flat.ownerName} via Online Gateway.`,
    "/maintenance"
  );

  return Response.json({ bill: updated });
}
