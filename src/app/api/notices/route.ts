import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { logCreated } from "@/lib/activity-log";
import { broadcastNotification } from "@/lib/notifications";

export async function GET() {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notices = await prisma.notice.findMany({
    where: { societyId: session.societyId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return Response.json({ notices });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, body: noticeBody, category, isPinned, expiresAt } = body;

    if (!title || !noticeBody) {
      return Response.json({ error: "Title and body are required" }, { status: 400 });
    }

    const notice = await prisma.notice.create({
      data: {
        societyId: session.societyId,
        title,
        body: noticeBody,
        category: category || "general",
        postedBy: session.name,
        isPinned: isPinned || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await logCreated("notice", notice.id, title, { category, isPinned });
    await broadcastNotification(
      session.societyId,
      "notice_new",
      `New Notice: ${title}`,
      `${session.name} posted a new ${category || "general"} notice.`,
      "/notices"
    );

    return Response.json({ notice }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
