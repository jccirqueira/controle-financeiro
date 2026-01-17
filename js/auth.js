/**
 * Auth Service
 */
import { getSupabase } from './supabase.js';

export async function login(email, password) {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: 'Supabase não configurado.' } };

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { data, error };
}

export async function logout() {
    const supabase = getSupabase();
    if (supabase) {
        await supabase.auth.signOut();
        window.location.hash = 'login';
    }
}

export async function getUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}
