"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

import { authenticate, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelprMark } from "@/components/brand/helpr-mark";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<
    AuthState | undefined,
    FormData
  >(authenticate, undefined);

  const isSignup = mode === "signup";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panel de marca (desktop) — MANIFEST §10.2 */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-bosque p-12 text-crema-base lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-20 size-96 rounded-full bg-lima/15 blur-3xl"
        />
        <Link href="/" className="relative w-fit rounded-lg">
          <HelprMark size={40} withWordmark tone="light" />
        </Link>
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-tight">
            El día a día de tu equipo, ordenado.
          </p>
          <p className="mt-4 text-crema-base/70">
            Entrá al panel y mirá lo que tu equipo te fue contando por WhatsApp:
            tareas, decisiones y responsables, cada cosa con su fuente.
          </p>
        </div>
        <p className="relative text-sm text-crema-base/50">
          Helpr · memoria operativa para ONGs
        </p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col items-center justify-center bg-crema-base px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-tinta-suave transition-colors hover:text-bosque lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>

          <div className="mb-8 lg:hidden">
            <HelprMark size={40} withWordmark />
          </div>

          <h1 className="font-display text-3xl font-bold text-tinta">
            {isSignup ? "Creá tu cuenta." : "Entrá a Helpr."}
          </h1>
          <p className="mt-2 text-tinta-suave">
            {isSignup
              ? "En un minuto tenés tu panel listo."
              : "Qué bueno verte de nuevo."}
          </p>

          <form action={formAction} className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="intent" value={mode} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vos@tuong.org"
                required
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-tinta-suave transition-colors hover:text-bosque focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {state?.error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-clay/10 px-3 py-2.5 text-sm text-clay"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {state.error}
              </p>
            )}

            {state?.message && (
              <p className="flex items-start gap-2 rounded-lg bg-lima-suave px-3 py-2.5 text-sm text-[#2c4a0a]">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {state.message}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="mt-2 h-11 w-full text-[15px]"
            >
              {pending
                ? "Un toque…"
                : isSignup
                  ? "Crear cuenta"
                  : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-tinta-suave">
            {isSignup ? "¿Ya tenés cuenta?" : "¿Todavía no tenés cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="font-semibold text-bosque underline-offset-4 hover:underline"
            >
              {isSignup ? "Entrá" : "Creá una"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
