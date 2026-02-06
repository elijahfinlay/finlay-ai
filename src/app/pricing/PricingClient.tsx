"use client";

import { useState } from "react";

const packages = [
  { id: "100", credits: 100, price: "$5", per: "$0.05/credit", popular: false },
  { id: "500", credits: 500, price: "$20", per: "$0.04/credit", popular: true },
  { id: "2000", credits: 2000, price: "$60", per: "$0.03/credit", popular: false },
];

export function PricingClient({ creditsBalance }: { creditsBalance: number }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Buy Credits</h1>
        <p className="text-text-secondary">
          Current balance: <strong className="text-text-primary">{creditsBalance.toLocaleString()} credits</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-xl border p-6 text-center space-y-4 transition-colors ${
              pkg.popular
                ? "border-accent bg-accent/5"
                : "border-border bg-surface"
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-white">
                Popular
              </span>
            )}
            <div>
              <p className="text-3xl font-bold">{pkg.credits.toLocaleString()}</p>
              <p className="text-sm text-text-secondary">credits</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{pkg.price}</p>
              <p className="text-xs text-text-secondary">{pkg.per}</p>
            </div>
            <button
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading !== null}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                pkg.popular
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-surface border border-border text-text-primary hover:border-accent/30"
              } disabled:opacity-50`}
            >
              {loading === pkg.id ? "Redirecting..." : "Purchase"}
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold mb-3">Credit Costs</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            ["Image (Fast)", "3 credits"],
            ["Image (Standard)", "5 credits"],
            ["Image (Ultra)", "8 credits"],
            ["Video 4s 720p (Veo)", "60 credits"],
            ["Video 8s 1080p (Veo)", "320 credits"],
            ["Video 5s Std (Kling)", "50 credits"],
            ["Video 10s Pro (Kling)", "150 credits"],
          ].map(([action, cost]) => (
            <div key={action} className="flex justify-between py-1">
              <span className="text-text-secondary">{action}</span>
              <span>{cost}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
