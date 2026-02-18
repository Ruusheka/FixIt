import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * No-op lock – bypasses Navigator Locks API which times out in dev/HMR.
 * Safe for single-tab usage; just runs the callback immediately.
 */
const noOpLock = async (
    _name: string,
    _acquireTimeout: number,
    fn: () => Promise<any>,
) => {
    return await fn();
};

// Singleton pattern
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'zapflux-auth-v2',
                lock: noOpLock as any, // bypass navigator.locks
            }
        });
    }
    return supabaseInstance;
};

export const supabase = getSupabase();
