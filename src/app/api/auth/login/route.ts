import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    
    try {
      require("fs").writeFileSync("env-debug.txt", "DB URL IS: " + process.env.DATABASE_URL);
    } catch (e) {}


    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user);

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    try {
      require("fs").writeFileSync(
        "login-error.txt",
        JSON.stringify({
          name: error?.name,
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack,
        }, null, 2)
      );
    } catch (e) {}
    return Response.json(
      { error: "Login System Error: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
