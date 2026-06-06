import { createBrowserClient } from "@supabase/ssr";

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  assertSupabaseConfig,
} from "@/lib/supabase/config";

/** Cliente Supabase para componentes de cliente (browser). */
export function createClient() {
  assertSupabaseConfig();
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
