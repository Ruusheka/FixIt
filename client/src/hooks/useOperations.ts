import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { socket } from '../services/socket';
import { Worker, Department, Escalation, SLARule, AdminActivityLog, InternalAnnouncement, Broadcast } from '../types/reports';

export const useOperations = () => {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [escalations, setEscalations] = useState<Escalation[]>([]);
    const [slaRules, setSlaRules] = useState<SLARule[]>([]);
    const [announcements, setAnnouncements] = useState<InternalAnnouncement[]>([]);
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
    const [stats, setStats] = useState({ avgResolutionTime: '0h', compliance: '100%' });
    const [loading, setLoading] = useState(true);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');

            const response = await fetch(`${baseUrl}/api/operations/data`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch tactical intelligence');
            const data = await response.json();

            if (data.workers) setWorkers(data.workers);
            if (data.departments) setDepartments(data.departments);
            if (data.escalations) {
                const processedEscalations = (data.escalations as any[]).map(e => ({
                    ...e,
                    report: {
                        ...e.report,
                        reporter: Array.isArray(e.report?.reporter) ? e.report.reporter[0] : e.report?.reporter
                    }
                }));
                setEscalations(processedEscalations as any);
            }
            if (data.slaRules) setSlaRules(data.slaRules);
            if (data.activityLogs) setActivityLogs(data.activityLogs);
            if (data.announcements) setAnnouncements(data.announcements);
            if (data.broadcasts) setBroadcasts(data.broadcasts);
            if (data.stats) setStats(data.stats);
        } catch (error) {
            console.error('Data Network Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        socket.on('new_broadcast', (newBroadcast: Broadcast) => {
            console.log(' [Link] Real-time tactical signal intercepted:', newBroadcast.title);
            setBroadcasts(prev => {
                // Prevent duplicate if we already added it locally
                if (prev.some(b => b.id === newBroadcast.id)) return prev;
                return [newBroadcast, ...prev];
            });
        });

        const channels = [
            supabase.channel('workers-changes').on('postgres_changes', { event: '*', table: 'workers', schema: 'public' }, () => fetchData(true)).subscribe(),
            supabase.channel('escalations-changes').on('postgres_changes', { event: '*', table: 'escalations', schema: 'public' }, () => fetchData(true)).subscribe(),
            supabase.channel('broadcasts-changes').on('postgres_changes', { event: '*', table: 'broadcasts', schema: 'public' }, () => fetchData(true)).subscribe(),
            supabase.channel('logs-changes').on('postgres_changes', { event: 'INSERT', table: 'admin_activity_logs', schema: 'public' }, () => fetchData(true)).subscribe()
        ];

        return () => {
            socket.off('new_broadcast');
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, []);

    const logActivity = async (action: string, targetType: string, targetId?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await (supabase.from('admin_activity_logs') as any).insert({
            admin_id: user.id,
            action,
            target_type: targetType,
            target_id: targetId
        });
    };

    const logReportActivity = async (reportId: string, actionType: string, details: any = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await (supabase.from('report_activity_logs') as any).insert({
            report_id: reportId,
            actor_id: user.id,
            action_type: actionType,
            details: details
        });
    };

    const updateSLA = async (priority: string, hours: number) => {
        const { error } = await (supabase.from('sla_rules') as any).update({ max_hours: hours }).eq('priority', priority);
        if (!error) {
            logActivity(`Updated SLA for ${priority} to ${hours}h`, 'SLA');
            fetchData(true);
        }
    };

    const postAnnouncement = async (title: string, content: string, priority: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await (supabase.from('internal_announcements') as any).insert({
            author_id: user.id,
            title,
            content,
            priority
        });

        if (!error) {
            logActivity(`Broadcasted: ${title}`, 'ANNOUNCEMENT');
            fetchData(true);
        }
    };

    const createBroadcast = async (payload: Partial<Broadcast>) => {
        try {
            console.log('🚀 [Command] Initiating direct transmission sequence...');
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                alert("CRITICAL: Session lost. Security re-authentication required.");
                return;
            }

            // Remove targetDept as requested
            if ('target_department_id' in payload) {
                delete payload.target_department_id;
            }

            const dbPayload = {
                ...payload,
                created_by: session.user.id,
                is_active: payload.is_active !== undefined ? payload.is_active : true,
                audience: payload.audience || 'Both'
            };

            const { data, error } = await supabase
                .from('broadcasts')
                .insert([dbPayload] as any)
                .select('*, author:profiles!created_by(*)')
                .single();

            if (error) {
                throw error;
            }

            const responseData = data as any;
            console.log('✅ [Command] Broadcast transmission confirmed:', responseData.id);

            // Log activity
            await supabase.from('admin_activity_logs').insert([{
                admin_id: session.user.id,
                action: `Created broadcast: ${payload.title}`,
                target_type: 'BROADCAST',
                target_id: responseData.id
            }] as any);

            // 🚀 Optimization: Update local state immediately
            setBroadcasts(prev => {
                if (prev.some(b => b.id === responseData.id)) return prev;
                return [responseData as Broadcast, ...prev];
            });

            // Trigger refetch just to be safe
            fetchData(true);
            return responseData;
        } catch (error: any) {
            console.error('❌ [Signal Failure] Tactical breach in transmission:', error);
            alert(`Signal Failure: ${error.message}`);
            throw error;
        }
    };

    const deleteBroadcast = async (id: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/broadcasts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to terminate broadcast');
            }

            fetchData(true);
        } catch (error: any) {
            console.error('Delete Error:', error);
            alert(`Termination Error: ${error.message}`);
        }
    };

    const getReportLogs = async (reportId: string) => {
        const { data, error } = await supabase
            .from('report_activity_logs')
            .select('*, actor:profiles(*)')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
        return data;
    };

    const metrics = {
        activePersonnel: workers.filter(w => w.status === 'busy').length,
        availablePersonnel: workers.filter(w => w.status === 'available').length,
        avgResolutionTime: stats.avgResolutionTime,
        compliance: stats.compliance
    };

    return {
        workers, departments, escalations, slaRules, announcements, broadcasts,
        activityLogs, loading, updateSLA, logActivity, logReportActivity, fetchData,
        postAnnouncement, createBroadcast, deleteBroadcast, getReportLogs, metrics, stats
    };
};
