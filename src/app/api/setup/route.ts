import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function createTablesIfNeeded() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'member',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "nameNl" TEXT NOT NULL,
      "nameEn" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT 'circle',
      "color" TEXT NOT NULL DEFAULT '#3b82f6',
      "type" TEXT NOT NULL DEFAULT 'expense',
      CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "description" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL,
      "categoryId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Budget" (
      "id" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "categoryId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Budget_categoryId_userId_month_year_key"
    ON "Budget"("categoryId", "userId", "month", "year");
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Transaction"
    ADD CONSTRAINT IF NOT EXISTS "Transaction_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  `).catch(() => null);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Transaction"
    ADD CONSTRAINT IF NOT EXISTS "Transaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  `).catch(() => null);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Budget"
    ADD CONSTRAINT IF NOT EXISTS "Budget_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  `).catch(() => null);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Budget"
    ADD CONSTRAINT IF NOT EXISTS "Budget_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  `).catch(() => null);
}

async function seedDatabase() {
  const categories = [
    { nameNl: "Salaris", nameEn: "Salary", icon: "briefcase", color: "#10b981", type: "income" },
    { nameNl: "Freelance", nameEn: "Freelance", icon: "laptop", color: "#06b6d4", type: "income" },
    { nameNl: "Overige inkomsten", nameEn: "Other Income", icon: "plus-circle", color: "#8b5cf6", type: "income" },
    { nameNl: "Boodschappen", nameEn: "Groceries", icon: "shopping-cart", color: "#f59e0b", type: "expense" },
    { nameNl: "Wonen", nameEn: "Housing", icon: "home", color: "#3b82f6", type: "expense" },
    { nameNl: "Transport", nameEn: "Transport", icon: "car", color: "#8b5cf6", type: "expense" },
    { nameNl: "Gezondheid", nameEn: "Health", icon: "heart", color: "#ef4444", type: "expense" },
    { nameNl: "Uit eten", nameEn: "Dining Out", icon: "utensils", color: "#f97316", type: "expense" },
    { nameNl: "Entertainment", nameEn: "Entertainment", icon: "film", color: "#ec4899", type: "expense" },
    { nameNl: "Kleding", nameEn: "Clothing", icon: "shirt", color: "#a78bfa", type: "expense" },
    { nameNl: "Abonnementen", nameEn: "Subscriptions", icon: "repeat", color: "#06b6d4", type: "expense" },
    { nameNl: "Sparen", nameEn: "Savings", icon: "piggy-bank", color: "#10b981", type: "expense" },
    { nameNl: "Overige uitgaven", nameEn: "Other Expenses", icon: "more-horizontal", color: "#64748b", type: "expense" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.nameNl },
      update: {},
      create: { name: cat.nameNl, nameNl: cat.nameNl, nameEn: cat.nameEn, icon: cat.icon, color: cat.color, type: cat.type },
    });
  }

  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@familie.nl" },
    update: {},
    create: { name: "Beheerder", email: "admin@familie.nl", password: adminPassword, role: "admin" },
  });
}

export async function GET() {
  try {
    await createTablesIfNeeded();
    await seedDatabase();
    return NextResponse.json({
      success: true,
      message: "✅ Database ingericht! Ga naar /login en log in met admin@familie.nl / admin123",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
