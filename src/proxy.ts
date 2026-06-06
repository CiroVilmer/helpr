import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next 16: "middleware" ahora se llama "proxy" (mismo comportamiento).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Corre en todas las rutas de páginas, excepto estáticos y la API
  // (la API tiene su propia auth por Bearer — ARCHITECTURE §11).
  // Runs on pages AND /api (the /api 401 is handled in updateSession). Excludes static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
