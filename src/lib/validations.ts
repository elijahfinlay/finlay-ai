import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const generateImageSchema = z.object({
  provider: z.literal("google_imagen"),
  prompt: z.string().min(1, "Prompt is required").max(2000),
  negativePrompt: z.string().max(1000).optional(),
  referenceImageUrls: z.array(z.string().url()).max(3).optional(),
  params: z.object({
    numberOfImages: z.number().int().min(1).max(4).default(1),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).default("1:1"),
    quality: z.enum(["fast", "standard", "ultra"]).default("standard"),
  }),
});

export const generateVideoSchema = z.object({
  provider: z.enum(["google_veo", "kling"]),
  mode: z.enum(["text_to_video", "image_to_video"]),
  prompt: z.string().min(1, "Prompt is required").max(2000),
  negativePrompt: z.string().max(1000).optional(),
  referenceImageUrls: z.array(z.string().url()).max(3).optional(),
  params: z.object({
    duration: z.number().int().min(4).max(10).default(4),
    resolution: z.enum(["720p", "1080p"]).default("720p").optional(),
    aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
    seed: z.number().int().optional(),
    mode: z.enum(["standard", "professional"]).optional(),
  }),
});

export const assetsQuerySchema = z.object({
  type: z.enum(["video", "image", "all"]).default("all"),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  favorite: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});
