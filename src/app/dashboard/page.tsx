import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  const [totalJobs, completedJobs, totalAssets, recentTransactions] = await Promise.all([
    db.generationJob.count({ where: { userId: user.id } }),
    db.generationJob.count({ where: { userId: user.id, status: "completed" } }),
    db.generatedAsset.count({ where: { userId: user.id, deleted: false } }),
    db.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <>
      <Nav />
      <DashboardClient
        user={{ email: user.email, plan: user.plan, creditsBalance: user.creditsBalance, creditsUsed: user.creditsUsed }}
        stats={{ totalJobs, completedJobs, totalAssets }}
        transactions={recentTransactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          balance: t.balance,
          type: t.type,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
