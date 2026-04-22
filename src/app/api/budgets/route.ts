import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const userId = (session.user as { id?: string }).id!;

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const transactions = await prisma.transaction.findMany({
        where: {
          categoryId: budget.categoryId,
          type: "expense",
          date: { gte: startDate, lte: endDate },
        },
      });
      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent };
    })
  );

  return NextResponse.json(budgetsWithSpent);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount, month, year, categoryId } = body;
  const userId = (session.user as { id?: string }).id!;

  const budget = await prisma.budget.upsert({
    where: { categoryId_userId_month_year: { categoryId, userId, month: parseInt(month), year: parseInt(year) } },
    update: { amount: parseFloat(amount) },
    create: { amount: parseFloat(amount), month: parseInt(month), year: parseInt(year), categoryId, userId },
    include: { category: true },
  });

  return NextResponse.json(budget, { status: 201 });
}
