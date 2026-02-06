import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || "0");
    const paymentId = session.payment_intent as string;

    if (userId && credits > 0) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        await db.$transaction([
          db.user.update({
            where: { id: userId },
            data: { creditsBalance: { increment: credits } },
          }),
          db.creditTransaction.create({
            data: {
              userId,
              amount: credits,
              balance: user.creditsBalance + credits,
              type: "purchase",
              description: `Purchased ${credits} credits`,
              stripePaymentId: paymentId,
            },
          }),
        ]);
      }
    }
  }

  return NextResponse.json({ received: true });
}
