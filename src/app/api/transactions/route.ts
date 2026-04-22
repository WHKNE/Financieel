import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: startDate, lte: endDate };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount, description, type, date, categoryId } = body;

  if (!amount || !description || !type || !date || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id!;

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      description,
      type,
      date: new Date(date),
      categoryId,
      userId,
    },
    include: { category: true, user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json(transaction, { status: 201 });
}
