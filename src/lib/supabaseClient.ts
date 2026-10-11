import { createClient } from "@supabase/supabase-js";

/**
 * Client-safe Supabase client using anon key.
 * Only accesses publicly permitted rows via RLS.
 */
export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey);
}
