import { NextRequest, NextResponse } from "next/server";
import { verifyToken, createSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const email = await verifyToken(token);

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  await createSession(email);

  return NextResponse.redirect(new URL("/generate", request.url));
}
