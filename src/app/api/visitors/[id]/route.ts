import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const visitor = await prisma.visitor.update({
      where: { id },
      data: {
        status: body.status || "out",
        exitTime: body.status === "out" ? new Date() : undefined,
      },
    });
    return Response.json({ visitor });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
