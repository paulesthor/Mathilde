// Template Configuration
// Replace these values with your project's Supabase credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
