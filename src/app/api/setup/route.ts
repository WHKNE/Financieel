import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Check if already set up
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ message: "Al ingericht. Gebruik admin@familie.nl / admin123 om in te loggen." });
    }

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

    return NextResponse.json({
      success: true,
      message: "✅ Klaar! Log in op /login met admin@familie.nl en wachtwoord admin123",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
