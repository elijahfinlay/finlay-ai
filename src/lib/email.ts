import { Resend } from "resend";

let _resend: Resend;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendMagicLink(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Sign in to Finlay AI",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px; color: #fafafa;">Finlay AI</h1>
        <p style="color: #a1a1aa; margin-bottom: 32px;">Click the button below to sign in to your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 16px;">
          Sign In
        </a>
        <p style="color: #71717a; font-size: 14px; margin-top: 32px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
