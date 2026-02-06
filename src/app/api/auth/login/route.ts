import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = loginSchema.parse(body);

    const token = await generateToken(email);
    await sendMagicLink(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to send login email" }, { status: 500 });
  }
}
