import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { notifyCitizensNewMicrotask } from './useNotifications';

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

    const fetchTasks = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            await autoCloseOverdue();

            // Perform tasks and leaderboard fetch in parallel
            const [tasksRes, leaderboardRes] = await Promise.all([
                (supabase.from('microtasks') as any)
                    .select(`
                        id, title, description, task_type, latitude, longitude, 
                        address, related_report_id, start_time, end_time, 
                        points, status, poll_options, created_by, created_at, 
                        image_url,
                        creator:profiles!created_by(full_name, email)
                    `)
                    .order('created_at', { ascending: false }),
                (supabase.from('civic_points') as any)
                    .select(`
                        citizen_id, total_points, tasks_completed, level, badge, updated_at,
                        citizen:profiles!citizen_id(full_name, email, avatar_url)
                    `)
                    .order('total_points', { ascending: false })
                    .limit(10)
            ]);

            if (tasksRes.data) setTasks(tasksRes.data as Microtask[]);
            if (leaderboardRes.data) setLeaderboard(leaderboardRes.data as CivicPoints[]);

            if (tasksRes.error) console.error('[fetchTasks] ❌ tasks error:', tasksRes.error);
            if (leaderboardRes.error) console.error('[fetchLeaderboard] ❌ leaderboard error:', leaderboardRes.error);

        } catch (err) {
            console.error('[fetchData] Critical Error:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    const fetchTaskById = useCallback(async (id: string) => {
        const { data, error } = await (supabase.from('microtasks') as any)
            .select(`
                id, title, description, task_type, latitude, longitude, address,
                related_report_id, start_time, end_time, points, status, 
                poll_options, created_by, created_at, image_url,
                creator:profiles!created_by(full_name, email),
                responses:microtask_responses!microtask_responses_microtask_id_fkey(
                    id, citizen_id, response_type, content, image_url,
                    submitted_at, approved, rejected, admin_note, points_awarded,
                    citizen:profiles!citizen_id(full_name, email, avatar_url)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[fetchTaskById] ❌ error:', error);
            return null;
        }
        return data as Microtask;
    }, []);

    const fetchLeaderboard = useCallback(async () => {
        const { data, error } = await (supabase.from('civic_points') as any)
            .select(`
                citizen_id, total_points, tasks_completed, level, badge,
                citizen:profiles!citizen_id(full_name, email, avatar_url)
            `)
            .order('total_points', { ascending: false })
            .limit(10);
        if (error) console.error('[fetchLeaderboard] ❌ error:', error);
        else setLeaderboard(data as CivicPoints[]);
    }, []);

    useEffect(() => {
        fetchTasks(true);

        const channel = supabase.channel('microtasks_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'microtasks' }, () => {
                fetchTasks(false); // Silent background refresh
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'microtask_responses' }, () => {
                fetchTasks(false); // Silent background refresh
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'civic_points' }, () => {
                fetchLeaderboard(); // Leaderboard specific refresh
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchTasks, fetchLeaderboard]);

    // --- Admin Actions ---
    const createTask = async (payload: Partial<Microtask>) => {
        const {
            creator, related_report, responses, response_count,
            ...dbPayload
        } = payload as any;

        if (dbPayload.created_by === '') dbPayload.created_by = null;

        console.log('[createTask] 🚀 Starting deployment...', dbPayload);

        // OPTIMISTIC UPDATE: Add to UI immediately
        const tempId = 'temp-' + Date.now();
        const tempTask: Microtask = {
            id: tempId,
            ...dbPayload,
            creator: { full_name: 'Deploying...', email: '' },
            responses: [],
            response_count: 0,
            created_at: new Date().toISOString()
        } as any;

        setTasks(prev => [tempTask, ...prev]);

        const { data, error } = await (supabase.from('microtasks') as any)
            .insert(dbPayload)
            .select(`
                *,
                creator:profiles!created_by(full_name, email)
            `)
            .single();

        if (error) {
            console.error('[createTask] ❌ Deployment error:', error);
            setTasks(prev => prev.filter(t => t.id !== tempId)); // Rollback
            throw new Error(`Deployment Failed: ${error.message}`);
        }

        // Replace optimistic task with real record
        setTasks(prev => prev.map(t => t.id === tempId ? { ...data, responses: [], response_count: 0 } : t));
        console.log('[createTask] ✅ Deployment successful!');

        // Notify citizens about the new mission (fire-and-forget, runs async)
        notifyCitizensNewMicrotask(data.id, data.title).catch(console.error);
    };

    const closeTask = async (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'closed' } : t));
        const { error } = await (supabase.from('microtasks') as any)
            .update({ status: 'closed' })
            .eq('id', taskId);
        if (error) {
            fetchTasks();
            throw error;
        }
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

    const submitResponse = async (taskId: string, citizenId: string, payload: Partial<MicrotaskResponse>) => {
        const { citizen, ...dbPayload } = payload as any;

        // Optimistic: Update percentages immediately
        const tempResponse: MicrotaskResponse = {
            id: 'temp-' + Date.now(),
            microtask_id: taskId,
            citizen_id: citizenId,
            submitted_at: new Date().toISOString(),
            approved: false,
            rejected: false,
            admin_note: null,
            points_awarded: 0,
            ...dbPayload
        };

        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const updatedResponses = [...(t.responses || []), tempResponse];
                return { ...t, responses: updatedResponses, response_count: updatedResponses.length };
            }
            return t;
        }));

        const { error } = await (supabase.from('microtask_responses') as any).insert({
            microtask_id: taskId,
            citizen_id: citizenId,
            ...dbPayload,
        });

        if (error) {
            fetchTasks(); // Rollback
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
