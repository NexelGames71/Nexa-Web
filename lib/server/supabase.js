import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let adminClient = null;

export const supabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

export function createSupabaseAdminClient() {
  if (!supabaseConfigured) {
    throw new Error("Missing Supabase server config: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function throwSupabaseError(error, fallback = "Supabase request failed.") {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
