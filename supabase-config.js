const { createClient } = require('@supabase/supabase-js');

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });
  return client;
}

module.exports = { createSupabaseClient };


