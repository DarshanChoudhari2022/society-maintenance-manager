import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const wing = searchParams.get("wing") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {
    societyId: session.societyId,
  };

  if (search) {
    where.OR = [
      { ownerName: { contains: search, mode: "insensitive" } },
      { flatNumber: { contains: search, mode: "insensitive" } },
      { contact: { contains: search } },
    ];
  }

  if (wing) {
    where.wing = wing;
  }

  const [members, total] = await Promise.all([
    prisma.flat.findMany({
      where,
      orderBy: { flatNumber: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.flat.count({ where }),
  ]);

  // Get distinct wings
  const wings = await prisma.flat.findMany({
    where: { societyId: session.societyId },
    select: { wing: true },
    distinct: ["wing"],
  });

  return Response.json({
    members,
    total,
    pages: Math.ceil(total / limit),
    wings: wings.map((w) => w.wing).filter(Boolean),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { flatNumber, wing, floor, ownerName, tenantName, contact, email, vehicleNumber } = body;

    // Validation
    if (!flatNumber || !ownerName || !contact) {
      return Response.json(
        { error: "Flat number, owner name, and contact are required" },
        { status: 400 }
      );
    }

    if (ownerName.length < 2) {
      return Response.json(
        { error: "Owner name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(contact)) {
      return Response.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // Check for duplicate flat number
    const existing = await prisma.flat.findFirst({
      where: { societyId: session.societyId, flatNumber },
    });

    if (existing) {
      return Response.json(
        { error: `Flat number ${flatNumber} already exists` },
        { status: 400 }
      );
    }

    const member = await prisma.flat.create({
      data: {
        societyId: session.societyId,
        flatNumber,
        wing: wing || null,
        floor: floor ? parseInt(floor) : null,
        ownerName,
        tenantName: tenantName || null,
        contact,
        email: email || null,
        vehicleNumber: vehicleNumber || null,
      },
    });

    // Update society totalFlats
    const flatCount = await prisma.flat.count({
      where: { societyId: session.societyId, isActive: true },
    });
    await prisma.society.update({
      where: { id: session.societyId },
      data: { totalFlats: flatCount },
    });

    return Response.json({ member }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Something went wrong — please try again" },
      { status: 500 }
    );
  }
}
