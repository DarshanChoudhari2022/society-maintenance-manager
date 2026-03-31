import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { logCreated } from "@/lib/activity-log";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await prisma.vendor.findMany({
    where: { societyId: session.societyId },
    orderBy: { name: "asc" },
  });

  return Response.json({ vendors });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, phone, email, hasAMC, amcAmount, amcStartDate, amcEndDate } = body;

    if (!name || !category) {
      return Response.json({ error: "Name and category are required" }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        societyId: session.societyId,
        name,
        category,
        phone: phone || null,
        email: email || null,
        hasAMC: hasAMC || false,
        amcAmount: amcAmount ? parseFloat(amcAmount) : null,
        amcStartDate: amcStartDate ? new Date(amcStartDate) : null,
        amcEndDate: amcEndDate ? new Date(amcEndDate) : null,
      },
    });

    await logCreated("settings", vendor.id, `Added Vendor: ${name}`, {
      category,
      hasAMC,
    });

    return Response.json({ vendor }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
