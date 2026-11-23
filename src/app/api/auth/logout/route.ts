import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getSessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await prisma.usuario.update({
        where: { id: user.id },
        data: { tokenVersao: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    ...getSessionCookieOptions(0, isHttps),
    value: "",
  });
  return response;
}
