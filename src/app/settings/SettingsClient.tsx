"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsClient({
  user,
}: {
  user: { email: string; plan: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBillingPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">Account</h2>
        <div className="space-y-2">
          <p className="text-sm">Email: {user.email}</p>
          <p className="text-sm capitalize">Plan: {user.plan}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">Billing</h2>
        <button
          onClick={handleBillingPortal}
          disabled={loading}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-primary hover:border-accent/30 transition-colors disabled:opacity-50"
        >
          {loading ? "Opening..." : "Manage Billing"}
        </button>
      </div>

      <div className="rounded-xl border border-error/20 bg-error/5 p-5 space-y-4">
        <h2 className="text-sm font-medium text-error">Danger Zone</h2>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-error/30 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}
