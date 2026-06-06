"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HelprMark } from "@/components/brand/helpr-mark";
import { Container } from "@/components/marketing/section";

const LINKS = [
  { href: "#problema", label: "El problema" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#que-hace", label: "Qué hace" },
  { href: "#posicionamiento", label: "Posicionamiento" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-linea/70 bg-crema-base/85 backdrop-blur-md supports-[backdrop-filter]:bg-crema-base/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="#top" className="rounded-lg" aria-label="Helpr — inicio">
          <HelprMark size={34} withWordmark priority />
        </a>

        {/* Navegación desktop */}
        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-tinta-suave transition-colors hover:text-bosque"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="lg"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Entrar
          </Button>
          <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
            Probar Helpr
          </Button>
        </div>

        {/* Navegación mobile */}
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="gap-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <HelprMark size={32} withWordmark />
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2">
              {LINKS.map((link) => (
                <SheetClose
                  key={link.href}
                  nativeButton={false}
                  render={
                    <a
                      href={link.href}
                      className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                    />
                  }
                >
                  {link.label}
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <SheetClose
                nativeButton={false}
                render={
                  <Link
                    href="/login"
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  />
                }
              >
                Entrar
              </SheetClose>
              <SheetClose
                nativeButton={false}
                render={
                  <Link href="/login" className={buttonVariants({ size: "lg" })} />
                }
              >
                Probar Helpr
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </Container>
    </header>
  );
}
