import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, societyName, societyAddress, city, pincode } =
      await request.json();

    if (!name || !email || !password || !societyName || !societyAddress || !city || !pincode) {
      return Response.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Create society first
    const society = await prisma.society.create({
      data: {
        name: societyName,
        address: societyAddress,
        city,
        pincode,
      },
    });

    // Create user as chairman
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "chairman",
        societyId: society.id,
      },
    });

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
      },
    });
  } catch {
    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
