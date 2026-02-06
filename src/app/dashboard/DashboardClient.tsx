"use client";

interface Transaction {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string;
  createdAt: string;
}

export function DashboardClient({
  user,
  stats,
  transactions,
}: {
  user: { email: string; plan: string; creditsBalance: number; creditsUsed: number };
  stats: { totalJobs: number; completedJobs: number; totalAssets: number };
  transactions: Transaction[];
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Credits Balance", value: user.creditsBalance.toLocaleString() },
          { label: "Credits Used", value: user.creditsUsed.toLocaleString() },
          { label: "Generations", value: stats.completedJobs.toLocaleString() },
          { label: "Assets", value: stats.totalAssets.toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-secondary">{stat.label}</p>
            <p className="text-2xl font-semibold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Account */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
        <h2 className="text-sm font-medium text-text-secondary">Account</h2>
        <p className="text-sm">{user.email}</p>
        <p className="text-sm text-text-secondary capitalize">Plan: {user.plan}</p>
      </div>

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-text-secondary">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-secondary">No transactions yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm">{tx.description}</p>
                  <p className="text-xs text-text-secondary">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.amount > 0 ? "text-success" : "text-error"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
