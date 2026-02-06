import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { PricingClient } from "./PricingClient";

export default async function PricingPage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <PricingClient creditsBalance={user.creditsBalance} />
    </>
  );
}
