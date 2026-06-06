"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

const CredentialsSchema = z.object({
  email: z.string().email("Poné un email válido."),
  password: z.string().min(6, "La contraseña necesita al menos 6 caracteres."),
  intent: z.enum(["signin", "signup"]),
});

/**
 * Server Action única para login y registro (el campo `intent` decide).
 * Corre siempre en el server → es un lugar seguro para la lógica de auth.
 */
export async function authenticate(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const { email, password, intent } = parsed.data;
  const supabase = await createClient();

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateError(error.message) };

    // Si el proyecto pide confirmación por email, no hay sesión todavía.
    if (data.user && !data.session) {
      return {
        message: "Te mandé un mail para confirmar la cuenta. Revisá tu correo.",
      };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: translateError(error.message) };
  }

  // Sesión creada → al panel. `redirect` lanza, así que no retorna.
  redirect("/dashboard/tasks");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Mensajes de Supabase (inglés) → copy en voseo, cálido (MANIFEST §8).
function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Ya hay una cuenta con ese email. Probá entrar.";
  if (m.includes("email not confirmed"))
    return "Todavía no confirmaste tu email. Revisá tu correo.";
  if (m.includes("password"))
    return "La contraseña no cumple los requisitos mínimos.";
  return "Uh, algo no salió. Probá de nuevo en un toque.";
}
