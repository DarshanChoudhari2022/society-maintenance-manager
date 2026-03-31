import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { generateReceiptNumber } from "@/lib/utils";
import { logPayment, logUpdated } from "@/lib/activity-log";
import { createNotification, broadcastNotification } from "@/lib/notifications";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/maintenance/bills/[id]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  const bill = await prisma.maintenanceBill.findFirst({
    where: { id, societyId: session.societyId },
    include: { flat: true },
  });

  if (!bill) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  if (body.status === "paid" || body.status === "partial") {
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

    const paidAmount = body.paidAmount || bill.amount;
    const updated = await prisma.maintenanceBill.update({
      where: { id },
      data: {
        status: body.status,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        paidVia: body.paidVia || "cash",
        paidAmount,
        receiptNote: body.receiptNote || null,
        receiptNumber: bill.receiptNumber || generateReceiptNumber(year, sequence),
      },
      include: { flat: true },
    });

    // Audit log
    await logPayment(id, `Flat ${bill.flat.flatNumber} - ${bill.period}`, {
      amount: paidAmount,
      method: body.paidVia || "cash",
      status: body.status,
      ownerName: bill.flat.ownerName,
    });

    // Notification to society
    await broadcastNotification(
      session.societyId,
      "bill_paid",
      `Payment Received - Flat ${bill.flat.flatNumber}`,
      `₹${paidAmount} ${body.status === "partial" ? "partial payment" : "full payment"} received from ${bill.flat.ownerName} via ${(body.paidVia || "cash").toUpperCase()}.`,
      "/maintenance"
    );

    return Response.json({ bill: updated });
  }

  if (body.status === "pending") {
    const updated = await prisma.maintenanceBill.update({
      where: { id },
      data: {
        status: "pending",
        paidAt: null,
        paidVia: null,
        paidAmount: null,
        receiptNote: null,
        receiptNumber: null,
      },
      include: { flat: true },
    });

    await logUpdated("bill", id, `Flat ${bill.flat.flatNumber} - ${bill.period}`, {
      action: "reverted to pending",
    });

    return Response.json({ bill: updated });
  }

  return Response.json({ error: "Invalid status" }, { status: 400 });
}
