import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { logCreated } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const month = searchParams.get("month") || "";

  const where: Record<string, unknown> = { societyId: session.societyId };

  if (category) where.category = category;
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.paidOn = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { paidOn: "desc" },
  });

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return Response.json({ expenses, total });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.societyId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, amount, category, paidTo, paidOn, notes } = body;

    if (!title || !amount || !category || !paidOn) {
      return Response.json({ error: "Title, amount, category, and date are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        societyId: session.societyId,
        title,
        amount: parseFloat(amount),
        category,
        paidTo: paidTo || null,
        paidOn: new Date(paidOn),
        notes: notes || null,
      },
    });

    await logCreated("expense", expense.id, `${title} - ₹${amount}`, {
      category,
      paidTo,
      amount: parseFloat(amount),
    });

    return Response.json({ expense }, { status: 201 });
  } catch {
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
