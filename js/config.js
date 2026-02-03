
// Supabase Configuration
// Replace with your actual project URL and public key from Supabase Dashboard
const SUPABASE_URL = 'https://moanidwnrcynoedfrmah.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vYW5pZHducmN5bm9lZGZybWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMyNjAsImV4cCI6MjA4NTY4OTI2MH0.QYm8cnvc9-Q2rDNjza1UvnBpmwmrzs9fdFZipyEaOnU'; // ⚠️ REMPLACER PAR LA CLÉ "ANON" (PUBLIC) DEPUIS SUPABASE DASHBOARD -> SETTINGS -> API

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        storage: window.sessionStorage // Session persists during browser session only, clears when browser closes
    }
}) : null;

if (!supabase) {
    console.error('Supabase client not initialized. Make sure to include the Supabase JS library in your HTML.');
}

export { supabase };

