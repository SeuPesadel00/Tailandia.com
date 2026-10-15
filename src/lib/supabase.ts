import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgggdawwkmncpfetuhij.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZ2dkYXd3a21uY3BmZXR1aGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTUyNjgsImV4cCI6MjEwNjQzMTI2OH0.1uXP6pHtcdfKlmuB1rIcnhVQf9uCT3Yb9iyIuo9hZNc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
