import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  assertSupabaseConfig,
} from "@/lib/supabase/config";

/**
 * Cliente Supabase para Server Components, Server Actions y route handlers.
 * Lee/escribe la sesión en cookies (patrón @supabase/ssr).
 */
export async function createClient() {
  assertSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component (cookies de solo lectura).
            // El refresh de sesión lo hace el proxy — se puede ignorar.
          }
        },
      },
    }
  );
}
