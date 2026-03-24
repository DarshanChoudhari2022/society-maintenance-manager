import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { sendWhatsAppMessage, fillTemplate } from "@/lib/whatsapp";
import { getCurrentPeriod, formatPeriod, formatDate } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { flatIds, templateBody, period: reqPeriod } = await request.json();
    const period = reqPeriod || getCurrentPeriod();

    const society = await prisma.society.findUnique({
      where: { id: session.societyId },
    });

    if (!society) {
      return Response.json({ error: "Society not found" }, { status: 404 });
    }

    // Get pending bills
    const where: Record<string, unknown> = {
      societyId: session.societyId,
      period,
      status: "pending",
    };

    if (flatIds && flatIds !== "all" && Array.isArray(flatIds)) {
      where.flatId = { in: flatIds };
    }

    const bills = await prisma.maintenanceBill.findMany({
      where,
      include: { flat: true },
    });

    let sent = 0;
    let failed = 0;
    const results: Array<{ flatId: string; status: string; error?: string }> = [];

    for (const bill of bills) {
      const template =
        templateBody ||
        `Dear {ownerName},\n\nYour maintenance of ₹{amount} for {period} at {societyName} - Flat {flatNumber} is pending.\nPlease pay by {dueDate}.\n\nUPI: {upiId}\n\nRegards,\n{chairmanName}`;

      const message = fillTemplate(template, {
        ownerName: bill.flat.ownerName,
        flatNumber: bill.flat.flatNumber,
        societyName: society.name,
        amount: bill.amount.toString(),
        period: formatPeriod(period),
        dueDate: formatDate(bill.dueDate),
        upiId: society.upiId || "N/A",
        chairmanName: session.name,
      });

      const result = await sendWhatsAppMessage(bill.flat.contact, message);

      // Log the reminder
      await prisma.reminderLog.create({
        data: {
          flatId: bill.flat.id,
          billId: bill.id,
          channel: "whatsapp",
          status: result.success ? "sent" : "failed",
          messageBody: message,
        },
      });

      if (result.success) {
        sent++;
        results.push({ flatId: bill.flat.id, status: "sent" });
      } else {
        failed++;
        results.push({ flatId: bill.flat.id, status: "failed", error: result.error });
      }
    }

    if (sent > 0) {
      return Response.json({ sent, failed, results });
    } else if (bills.length === 0) {
      return Response.json({ sent: 0, failed: 0, results: [], message: "No pending bills found" });
    } else {
      return Response.json(
        { sent: 0, failed, results, error: "WhatsApp API error — check your token in settings" },
        { status: 500 }
      );
    }
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
