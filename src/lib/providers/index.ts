import { AIProvider } from "./types";
import { GoogleImagenProvider } from "./google-imagen";
import { GoogleVeoProvider } from "./google-veo";
import { KlingProvider } from "./kling";

const providers: AIProvider[] = [
  new GoogleImagenProvider(),
  new GoogleVeoProvider(),
  new KlingProvider(),
];

const providerMap = new Map(providers.map((p) => [p.id, p]));

const providerEnvChecks: Record<string, () => boolean> = {
  google_imagen: () => !!process.env.GOOGLE_AI_API_KEY,
  google_veo: () => !!process.env.GOOGLE_AI_API_KEY,
  kling: () => !!process.env.KLING_ACCESS_KEY && !!process.env.KLING_SECRET_KEY,
};

export function isProviderAvailable(id: string): boolean {
  const check = providerEnvChecks[id];
  return check ? check() : false;
}

export function getProvider(id: string): AIProvider {
  const provider = providerMap.get(id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}

export function getVideoProviders(): AIProvider[] {
  return providers.filter((p) => p.type === "video");
}

export function getImageProviders(): AIProvider[] {
  return providers.filter((p) => p.type === "image");
}

export function getAllProviders(): AIProvider[] {
  return [...providers];
}
