import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface Microtask {
    id: string;
    title: string;
    description: string | null;
    task_type: 'image' | 'poll' | 'report_review' | 'future_inspection';
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    related_report_id: string | null;
    start_time: string;
    end_time: string | null;
    points: number;
    status: 'open' | 'closed' | 'overdue';
    poll_options: string[] | null;
    created_by: string | null;
    created_at: string;
    image_url: string | null;
    // Joined
    creator?: { full_name: string; email: string };
    related_report?: { title: string };
    responses?: MicrotaskResponse[];
    response_count?: number;
}

export interface MicrotaskResponse {
    id: string;
    microtask_id: string;
    citizen_id: string;
    response_type: 'image' | 'text' | 'poll_choice';
    content: string | null;
    image_url: string | null;
    submitted_at: string;
    approved: boolean;
    rejected: boolean;
    admin_note: string | null;
    points_awarded: number;
    // Joined
    citizen?: { full_name: string; email: string; avatar_url?: string };
}

export interface CivicPoints {
    citizen_id: string;
    total_points: number;
    tasks_completed: number;
    level: string;
    badge: string;
    updated_at: string;
    citizen?: { full_name: string; email: string; avatar_url?: string };
}

export const useMicrotasks = (role?: 'admin' | 'citizen', citizenId?: string) => {
    const [tasks, setTasks] = useState<Microtask[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<CivicPoints[]>([]);

    const autoCloseOverdue = async () => {
        const now = new Date().toISOString();
        await (supabase.from('microtasks') as any)
            .update({ status: 'overdue' })
            .eq('status', 'open')
            .lt('end_time', now);
    };

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        await autoCloseOverdue();

        // Try the full join first
        let { data, error } = await (supabase.from('microtasks') as any)
            .select(`
                *,
                creator:profiles(full_name, email),
                responses:microtask_responses(
                    id, citizen_id, response_type, content, image_url,
                    submitted_at, approved, rejected, admin_note, points_awarded,
                    citizen:profiles(full_name, email, avatar_url)
                )
            `)
            .order('created_at', { ascending: false });

        // Fallback: plain fetch without joins if the relational query fails
        if (error) {
            console.warn('[useMicrotasks] join fetch failed, falling back to plain fetch:', error.message);
            const fallback = await (supabase.from('microtasks') as any)
                .select('*')
                .order('created_at', { ascending: false });
            data = fallback.data;
            error = fallback.error;
        }

        if (error) {
            console.error('[useMicrotasks] fetchTasks error:', error);
        } else if (data) {
            const enriched = (data as any[]).map((t: any) => ({
                ...t,
                response_count: t.responses?.length || 0,
            }));
            setTasks(enriched);
        }
        setLoading(false);
    }, []);

    const fetchTaskById = useCallback(async (id: string) => {
        const { data, error } = await (supabase.from('microtasks') as any)
            .select(`
                *,
                creator:profiles(full_name, email),
                responses:microtask_responses(
                    id, citizen_id, response_type, content, image_url,
                    submitted_at, approved, rejected, admin_note, points_awarded,
                    citizen:profiles(full_name, email, avatar_url)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[useMicrotasks] fetchTaskById error:', error);
            return null;
        }
        return {
            ...data,
            response_count: data.responses?.length || 0,
        } as Microtask;
    }, []);

    const fetchLeaderboard = useCallback(async () => {
        const { data } = await (supabase.from('civic_points') as any)
            .select('*, citizen:profiles!citizen_id(full_name, email, avatar_url)')
            .order('total_points', { ascending: false })
            .limit(20);
        if (data) setLeaderboard(data);
    }, []);

    useEffect(() => {
        fetchTasks();
        fetchLeaderboard();

        const channel = supabase.channel('microtask_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'microtasks' }, fetchTasks)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'microtask_responses' }, () => {
                fetchTasks();
                fetchLeaderboard();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'civic_points' }, fetchLeaderboard)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchTasks, fetchLeaderboard]);

    // --- Admin Actions ---
    const createTask = async (payload: Partial<Microtask>) => {
        // Strip joined/computed fields — only send actual DB columns
        const {
            creator, related_report, responses, response_count,
            ...dbPayload
        } = payload as any;

        // Ensure created_by is null (not '') if missing
        if (dbPayload.created_by === '') dbPayload.created_by = null;

        console.log('[createTask] 🚀 Starting deployment...', dbPayload);

        // Pre-flight check: Verify table exists
        const { error: tableCheck } = await (supabase.from('microtasks') as any).select('id').limit(1);
        if (tableCheck && tableCheck.code === '42P01') {
            const errorMsg = 'CRITICAL: The "microtasks" table does not exist in Supabase. Please run the SQL migration script.';
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const { error } = await (supabase.from('microtasks') as any)
            .insert(dbPayload);

        if (error) {
            console.error('[createTask] ❌ Supabase error:', error);
            const detailedError = error.details || error.message || JSON.stringify(error);
            throw new Error(`Supabase Insert Failed: ${detailedError}`);
        }

        console.log('[createTask] ✅ Deployment successful!');
        await fetchTasks();
    };

    const closeTask = async (taskId: string) => {
        const { error } = await (supabase.from('microtasks') as any)
            .update({ status: 'closed' })
            .eq('id', taskId);
        if (error) throw error;
        await fetchTasks();
    };

    const approveResponse = async (responseId: string, points: number) => {
        const { error } = await (supabase.from('microtask_responses') as any)
            .update({ approved: true, rejected: false, points_awarded: points })
            .eq('id', responseId);
        if (error) throw error;
        await fetchTasks();
        await fetchLeaderboard();
    };

    const rejectResponse = async (responseId: string, note: string) => {
        const { error } = await (supabase.from('microtask_responses') as any)
            .update({ rejected: true, approved: false, admin_note: note })
            .eq('id', responseId);
        if (error) throw error;
        await fetchTasks();
    };

    // --- Citizen Actions ---
    const submitResponse = async (taskId: string, citizenId: string, payload: Partial<MicrotaskResponse>) => {
        // Strip citizen joined field
        const { citizen, ...dbPayload } = payload as any;
        const { error } = await (supabase.from('microtask_responses') as any).insert({
            microtask_id: taskId,
            citizen_id: citizenId,
            ...dbPayload,
        });
        if (error) {
            console.error('[submitResponse] error:', error);
            throw error;
        }
        await fetchTasks();
    };

    const getCivilPoints = async (citizenId: string): Promise<CivicPoints | null> => {
        const { data } = await (supabase.from('civic_points') as any)
            .select('*')
            .eq('citizen_id', citizenId)
            .maybeSingle();
        return data;
    };

    const getMyResponse = (task: Microtask, citizenId: string) => {
        return task.responses?.find(r => r.citizen_id === citizenId) || null;
    };

    return {
        tasks,
        loading,
        leaderboard,
        fetchTasks,
        fetchTaskById,
        fetchLeaderboard,
        createTask,
        closeTask,
        approveResponse,
        rejectResponse,
        submitResponse,
        getCivilPoints,
        getMyResponse,
    };
};
