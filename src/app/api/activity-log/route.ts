import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module") || "all";
  const limit = parseInt(searchParams.get("limit") || "100");
  const page = parseInt(searchParams.get("page") || "1");

  const where: Record<string, unknown> = {
    societyId: session.societyId,
  };

  if (module !== "all") {
    where.module = module;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return Response.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
