import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import Link from "next/link";

export default async function LandingPage() {
  const user = await getUserFromCookie();
  if (user) redirect("/generate");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <span className="text-lg font-semibold">Finlay AI</span>
          <Link
            href="/login"
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Create with{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            Generate stunning videos and images using the world&apos;s best AI models.
            Veo 3.1, Imagen 4, Kling 3.0, and more.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/generate"
              className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
            >
              View Pricing
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-12">
            {[
              { title: "Text to Video", desc: "Describe a scene, get a video" },
              { title: "Text to Image", desc: "Describe an image, see it instantly" },
              { title: "Image to Video", desc: "Animate any image into motion" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-surface p-5 text-left"
              >
                <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
