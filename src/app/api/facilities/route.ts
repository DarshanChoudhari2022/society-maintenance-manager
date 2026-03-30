import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const facilities = await prisma.facility.findMany({
    where: { societyId: session.societyId },
    include: {
      bookings: {
        where: { date: { gte: new Date() }, status: "confirmed" },
        orderBy: { date: "asc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json({ facilities });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, capacity, ratePerHour, rules } = body;

    if (!name) {
      return Response.json({ error: "Facility name is required" }, { status: 400 });
    }

    const facility = await prisma.facility.create({
      data: {
        societyId: session.societyId,
        name,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : null,
        ratePerHour: ratePerHour ? parseFloat(ratePerHour) : 0,
        rules: rules || null,
      },
    });

    return Response.json({ facility }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
