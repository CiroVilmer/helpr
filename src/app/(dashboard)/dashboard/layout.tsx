import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { HelprMark } from "@/components/brand/helpr-mark";

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
    <div className="flex min-h-dvh flex-col bg-crema-base">
      <header className="sticky top-0 z-40 border-b border-linea bg-crema-base/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <HelprMark size={32} withWordmark />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-tinta-suave sm:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden="true" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
