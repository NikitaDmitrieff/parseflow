import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL required");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY required");

export const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export interface ApiKey {
  id: string;
  organization_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  parses_used: number;
  created_at: string;
  last_used_at: string | null;
}

export interface Organization {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  parses_quota: number;
  created_at: string;
}
