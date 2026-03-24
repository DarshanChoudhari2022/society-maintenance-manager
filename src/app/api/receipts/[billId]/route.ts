import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/receipts/[billId]">
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { billId } = await ctx.params;

  const bill = await prisma.maintenanceBill.findFirst({
    where: { id: billId, societyId: session.societyId },
    include: { flat: true, society: true },
  });

  if (!bill) {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }

  return Response.json({ bill });
}
