import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const complaints = await prisma.complaint.findMany({
    where: { societyId: session.societyId },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    open: complaints.filter((c) => c.status === "open").length,
    inProgress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
    total: complaints.length,
  };

  return Response.json({ complaints, stats });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { flatNumber, raisedBy, title, description, category, priority } = body;

    if (!flatNumber || !raisedBy || !title || !description) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        societyId: session.societyId,
        flatNumber,
        raisedBy,
        title,
        description,
        category: category || "general",
        priority: priority || "medium",
      },
    });

    return Response.json({ complaint }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
