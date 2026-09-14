import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let client: SupabaseClient | null = null;
export async function getSupabase() {
  if (client) return client;
  const r = await fetch('/api/config');
  if (!r.ok) return null;
  const config = (await r.json()) as {
    supabaseUrl?: unknown;
    supabaseKey?: unknown;
  };
  if (
    typeof config.supabaseUrl !== 'string' ||
    typeof config.supabaseKey !== 'string' ||
    !config.supabaseUrl ||
    !config.supabaseKey
  )
    return null;
  client = createClient(config.supabaseUrl, config.supabaseKey);
  return client;
}
