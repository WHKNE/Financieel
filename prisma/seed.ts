import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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
      create: {
        name: cat.nameNl,
        nameNl: cat.nameNl,
        nameEn: cat.nameEn,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
      },
    });
  }

  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@familie.nl" },
    update: {},
    create: {
      name: "Beheerder",
      email: "admin@familie.nl",
      password: adminPassword,
      role: "admin",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
