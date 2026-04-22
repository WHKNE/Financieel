import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { amount, description, type, date, categoryId } = body;

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      amount: parseFloat(amount),
      description,
      type,
      date: new Date(date),
      categoryId,
    },
    include: { category: true, user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
