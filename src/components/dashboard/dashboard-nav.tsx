"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Users, LogOut, Menu } from "lucide-react";

import { signOut } from "@/app/(auth)/login/actions";
import { HelprMark } from "@/components/brand/helpr-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard/tasks", label: "Tareas", icon: ListChecks },
  { href: "/dashboard/people", label: "Personas", icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-bosque-hondo text-crema-base"
                : "text-crema-base/70 hover:bg-bosque-hondo/60 hover:text-crema-base"
            )}
          >
            <Icon
              className={cn("size-[18px] shrink-0", active && "text-lima")}
              strokeWidth={1.9}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarInner({
  userEmail,
  onNavigate,
}: {
  userEmail: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-bosque text-crema-base">
      <div className="flex h-16 shrink-0 items-center px-5">
        <HelprMark size={30} withWordmark tone="light" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t border-linea-oscura p-3">
        <p className="truncate px-2 pb-1.5 text-xs text-crema-base/50">
          {userEmail}
        </p>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-crema-base/80 hover:bg-bosque-hondo hover:text-crema-base"
          >
            <LogOut aria-hidden="true" />
            Salir
          </Button>
        </form>
      </div>
    </div>
  );
}

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sidebar fijo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarInner userEmail={userEmail} />
      </aside>

      {/* Topbar + sheet (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-linea bg-crema-base/90 px-4 backdrop-blur-md lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Abrir menú" />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-72 border-0 bg-bosque p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menú de navegación</SheetTitle>
            </SheetHeader>
            <SidebarInner
              userEmail={userEmail}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <HelprMark size={28} withWordmark />
      </header>
    </>
  );
}
