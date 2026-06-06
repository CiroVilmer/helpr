import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

// Auth gate runs per request (getUser reads cookies) - never prerender this subtree,
// so `next build` does not require Supabase keys at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate real (no confiamos solo en el proxy — Next 16 docs §Proxy).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-crema-base">
      <DashboardNav userEmail={user.email ?? ""} />
      <div className="lg:pl-64">
        <main className="min-h-dvh">{children}</main>
      </div>
    </div>
  );
}
