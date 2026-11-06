import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once real Supabase credentials are set in the environment. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable accounts.';

// Until then a clearly labelled placeholder client is used so the app still
// builds and renders.
// Don't throw at import time: Next.js evaluates this module while collecting
// page data during the build, and a hard failure there aborts the deploy.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
