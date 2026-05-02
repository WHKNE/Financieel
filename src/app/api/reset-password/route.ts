import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const newPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.update({
      where: { email: "admin@familie.nl" },
      data: { password: newPassword },
    });
    return NextResponse.json({
      success: true,
      message: "Wachtwoord teruggezet naar: admin123 — Log in met admin@familie.nl",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
