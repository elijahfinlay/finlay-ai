import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProvider } from "@/lib/providers";
import { generateImageSchema } from "@/lib/validations";
import { estimateCost } from "@/lib/costs";
import { uploadFile } from "@/lib/storage";
import { generationLimiter } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit
    const { success: rateLimitOk } = await generationLimiter.limit(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await request.json();
    const validated = generateImageSchema.parse(body);

    // Calculate cost
    const cost = estimateCost(validated.provider, "text_to_image", validated.params);

    // Check credits
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
        type: "text_to_image",
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

    // Submit to provider (synchronous for Imagen)
    const provider = getProvider(validated.provider);
    const result = await provider.submit({
      mode: "text_to_image",
      prompt: validated.prompt,
      negativePrompt: validated.negativePrompt,
      referenceImageUrls: validated.referenceImageUrls,
      params: validated.params,
    });

    if (result.status === "failed") {
      // Refund credits on failure
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

      return NextResponse.json({ error: result.error || "Generation failed" }, { status: 500 });
    }

    // Imagen returns base64 - upload to Supabase and create assets
    // For simplicity, handle single image here (the provider returns first image)
    const assets = [];

    if (result.resultBase64) {
      const buffer = Buffer.from(result.resultBase64, "base64");
      const timestamp = Date.now();
      const storagePath = `${user.id}/${timestamp}-0.png`;

      const uploaded = await uploadFile("generated-images", storagePath, buffer, "image/png");

      const asset = await db.generatedAsset.create({
        data: {
          userId: user.id,
          jobId: job.id,
          type: "image",
          provider: validated.provider,
          storagePath,
          storageUrl: uploaded.url,
          prompt: validated.prompt,
          mimeType: "image/png",
        },
      });

      assets.push({ id: asset.id, storageUrl: uploaded.url });
    }

    // Update job as completed
    await db.generationJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        providerJobId: "sync",
      },
    });

    return NextResponse.json({ jobId: job.id, status: "completed", assets });
  } catch (error) {
    console.error("Image generation error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
