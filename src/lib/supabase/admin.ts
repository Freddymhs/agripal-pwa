import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE_ROLE_KEY — bypassa RLS.
 * SOLO para uso server-side (Route Handlers, webhooks).
 * NUNCA importar desde código del browser.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
