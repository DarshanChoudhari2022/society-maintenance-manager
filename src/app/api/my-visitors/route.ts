import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { logCreated } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || !user.flatId) {
    return Response.json({ error: "No flat assigned" }, { status: 400 });
  }

  // Get only today's expected and active visitors
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visitors = await prisma.visitor.findMany({
    where: {
      societyId: session.societyId,
      flatId: user.flatId,
      OR: [
        { status: "in" },
        { 
          isPreApproved: true, 
          status: "out",
          expectedAt: { gte: today }
        }
      ]
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ visitors });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { flat: true }
    });

    if (!user || !user.flatId || !user.flat) {
      return Response.json({ error: "No flat assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { visitorName, phone, purpose, expectedAt } = body;

    if (!visitorName || !purpose || !expectedAt) {
      return Response.json({ error: "Visitor name, purpose, and expected time are required" }, { status: 400 });
    }

    const visitor = await prisma.visitor.create({
      data: {
        societyId: session.societyId,
        flatId: user.flatId,
        flatNumber: user.flat.flatNumber,
        visitorName,
        phone: phone || null,
        purpose,
        isPreApproved: true,
        status: "out",
        expectedAt: new Date(expectedAt),
        approvedBy: session.name,
      },
    });

    // Audit log
    await logCreated("visitor", visitor.id, `Expected: ${visitorName} → Flat ${user.flat.flatNumber}`, {
      purpose,
      isPreApproved: true,
    });

    return Response.json({ visitor }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
