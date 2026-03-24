import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { generateReceiptNumber } from "@/lib/utils";

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
  });

  if (!bill) {
    return Response.json({ error: "Bill not found" }, { status: 404 });
  }

  if (body.status === "paid") {
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

    const updated = await prisma.maintenanceBill.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        paidVia: body.paidVia || "cash",
        paidAmount: body.paidAmount || bill.amount,
        receiptNote: body.receiptNote || null,
        receiptNumber: generateReceiptNumber(year, sequence),
      },
      include: { flat: true },
    });

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

    return Response.json({ bill: updated });
  }

  return Response.json({ error: "Invalid status" }, { status: 400 });
}
