import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be 8+ chars" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already used" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "USER",
      },
      select: { id: true, email: true, username: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
