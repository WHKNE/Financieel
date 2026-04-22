import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  let imported = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      const categoryName = (record["categorie"] || record["category"] || "").toLowerCase();
      const categoryId = categoryMap.get(categoryName) || categories[0]?.id;

      if (!categoryId) continue;

      const amountStr = (record["bedrag"] || record["amount"] || "0").replace(",", ".");
      const amount = Math.abs(parseFloat(amountStr));
      const type = parseFloat(amountStr) < 0 ? "expense" : "income";
      const description = record["omschrijving"] || record["description"] || "Import";
      const dateStr = record["datum"] || record["date"] || new Date().toISOString();

      await prisma.transaction.create({
        data: {
          amount,
          description,
          type,
          date: new Date(dateStr),
          categoryId,
          userId,
        },
      });
      imported++;
    } catch {
      errors.push(`Rij ${imported + 1}: Ongeldige data`);
    }
  }

  return NextResponse.json({ imported, errors });
}
