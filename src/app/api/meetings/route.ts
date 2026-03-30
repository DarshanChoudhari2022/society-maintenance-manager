import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await prisma.meetingMinutes.findMany({
    where: { societyId: session.societyId },
    orderBy: { date: "desc" },
  });

  return Response.json({ meetings });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, date, meetingType, attendees, agenda, minutes, decisions } = body;

    if (!title || !date || !agenda || !minutes) {
      return Response.json({ error: "Title, date, agenda, and minutes are required" }, { status: 400 });
    }

    const meeting = await prisma.meetingMinutes.create({
      data: {
        societyId: session.societyId,
        title,
        date: new Date(date),
        meetingType: meetingType || "general",
        attendees: attendees || null,
        agenda,
        minutes,
        decisions: decisions || null,
        recordedBy: session.name,
      },
    });

    return Response.json({ meeting }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
