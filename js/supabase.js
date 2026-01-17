import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabase = null;

export function initSupabase() {
    if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
        console.warn('Supabase credentials not set in js/config.js');
        return null;
    }

    if (!supabase && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

export function getSupabase() {
    return supabase || initSupabase();
}
