import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProvider, isProviderAvailable } from "@/lib/providers";
import { generateVideoSchema } from "@/lib/validations";
import { estimateCost } from "@/lib/costs";
import { generationLimiter } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { success: rateLimitOk } = await generationLimiter.limit(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const validated = generateVideoSchema.parse(body);

    if (!isProviderAvailable(validated.provider)) {
      return NextResponse.json(
        { error: `Provider "${validated.provider}" is not configured. Check your API keys.` },
        { status: 400 }
      );
    }

    const cost = estimateCost(validated.provider, validated.mode, validated.params);

    if (user.creditsBalance < cost.credits) {
      return NextResponse.json(
        { error: "Insufficient credits", needed: cost.credits, balance: user.creditsBalance },
        { status: 402 }
      );
    }

    // Deduct credits
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          creditsBalance: { decrement: cost.credits },
          creditsUsed: { increment: cost.credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -cost.credits,
          balance: user.creditsBalance - cost.credits,
          type: "usage",
          description: cost.breakdown,
        },
      }),
    ]);

    // Create job
    const job = await db.generationJob.create({
      data: {
        userId: user.id,
        type: validated.mode,
        provider: validated.provider,
        prompt: validated.prompt,
        negativePrompt: validated.negativePrompt,
        params: JSON.parse(JSON.stringify(validated.params)),
        referenceImages: validated.referenceImageUrls || [],
        estimatedCost: cost.credits * 0.05,
        creditsCharged: cost.credits,
        status: "pending",
      },
    });

    // Submit to provider (async - returns job ID)
    const provider = getProvider(validated.provider);
    const result = await provider.submit({
      mode: validated.mode,
      prompt: validated.prompt,
      negativePrompt: validated.negativePrompt,
      referenceImageUrls: validated.referenceImageUrls,
      params: validated.params,
    });

    if (result.status === "failed") {
      await db.$transaction([
        db.user.update({
          where: { id: user.id },
          data: {
            creditsBalance: { increment: cost.credits },
            creditsUsed: { decrement: cost.credits },
          },
        }),
        db.creditTransaction.create({
          data: {
            userId: user.id,
            amount: cost.credits,
            balance: user.creditsBalance,
            type: "refund",
            description: `Refund: ${result.error || "Generation failed"}`,
            jobId: job.id,
          },
        }),
        db.generationJob.update({
          where: { id: job.id },
          data: { status: "failed", errorMessage: result.error },
        }),
      ]);

      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await db.generationJob.update({
      where: { id: job.id },
      data: {
        status: "submitted",
        providerJobId: result.providerJobId,
        submittedAt: new Date(),
        lastPolledAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: "submitted",
      creditsCharged: cost.credits,
    });
  } catch (error) {
    console.error("Video generation error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
