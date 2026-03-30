import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { facilityId, flatNumber, date, startTime, endTime, purpose } = body;

    if (!facilityId || !flatNumber || !date || !startTime || !endTime) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check for conflicts
    const dateObj = new Date(date);
    const conflict = await prisma.facilityBooking.findFirst({
      where: {
        facilityId,
        date: dateObj,
        status: "confirmed",
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });

    if (conflict) {
      return Response.json({ error: "Time slot already booked" }, { status: 400 });
    }

    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    const hours = (parseInt(endTime.split(":")[0]) - parseInt(startTime.split(":")[0]));
    const amount = (facility?.ratePerHour || 0) * Math.max(hours, 1);

    const booking = await prisma.facilityBooking.create({
      data: {
        societyId: session.societyId,
        facilityId,
        bookedBy: session.name,
        flatNumber,
        date: dateObj,
        startTime,
        endTime,
        purpose: purpose || null,
        amount,
      },
    });

    return Response.json({ booking }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get("facilityId") || "";

  const where: Record<string, unknown> = { societyId: session.societyId };
  if (facilityId) where.facilityId = facilityId;

  const bookings = await prisma.facilityBooking.findMany({
    where,
    include: { facility: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return Response.json({ bookings });
}
