"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { personasService } from "@/services/personas/personas.service";
import { BaseException } from "@/exceptions/base/base-exceptions";

export type AuthState = {
  error?: string;
  message?: string;
};

const CredentialsSchema = z.object({
  email: z.string().email("Poné un email válido."),
  password: z.string().min(6, "La contraseña necesita al menos 6 caracteres."),
  intent: z.enum(["signin", "signup"]),
  // El personaId viene de la URL /login?personaId=<uuid>. Lo aceptamos tanto en signup como en
  // signin para cubrir el flujo de confirmación por email (la sesión llega en el segundo paso).
  personaId: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined)),
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
    personaId: formData.get("personaId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos." };
  }

  const { email, password, intent, personaId } = parsed.data;

  if (intent === "signup" && !personaId) {
    return {
      error:
        "Necesitás un link de invitación para crear una cuenta. Pedíselo al admin de tu equipo.",
    };
  }

  const supabase = await createClient();

  if (intent === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: translateError(error.message) };

    // Si el proyecto pide confirmación por email, no hay sesión todavía: linkeamos cuando vuelva
    // a entrar con el mismo personaId en la URL (ver bloque signin abajo).
    if (data.user && !data.session) {
      return {
        message: "Te mandé un mail para confirmar la cuenta. Revisá tu correo.",
      };
    }

    // Sesión inmediata (email confirmation OFF): linkeamos ahora.
    if (data.user && personaId) {
      try {
        await personasService.linkAuth(personaId, data.user.id);
      } catch (err) {
        return { error: linkErrorMessage(err) };
      }
    }
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: translateError(error.message) };

    // Si vino con personaId en la URL y aún no está vinculado, linkeamos en este sign-in.
    if (data.user && personaId) {
      try {
        await personasService.linkAuth(personaId, data.user.id);
      } catch (err) {
        return { error: linkErrorMessage(err) };
      }
    }
  }

  // Sesión creada → al panel. `redirect` lanza, así que no retorna.
  redirect("/dashboard/tasks");
}

function linkErrorMessage(err: unknown): string {
  if (err instanceof BaseException) return err.userMessage;
  return "No pude vincular tu cuenta con la persona del link. Probá de nuevo.";
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
