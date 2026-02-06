import { redirect } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getUserFromCookie();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <SettingsClient user={{ email: user.email, plan: user.plan }} />
    </>
  );
}
