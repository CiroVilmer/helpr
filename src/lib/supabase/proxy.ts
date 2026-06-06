import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

/**
 * Refresca la sesión de Supabase en cada request (cookies) y aplica la
 * protección de rutas. Lo llama `src/proxy.ts` (antes "middleware" en Next ≤15).
 *
 * Nota: el proxy es solo una verificación optimista (Next 16 docs §Proxy).
 * El gate real vuelve a chequear `getUser()` en el layout del dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sin config de Supabase, dejamos pasar (no rompemos el build/dev sin credenciales).
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no metas lógica entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Sin sesión → fuera del dashboard.
  if (!user && (path === "/dashboard" || path.startsWith("/dashboard/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión → no tiene sentido ver /login.
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
