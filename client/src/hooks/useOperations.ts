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
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/operations/data`, {
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
        } catch (error) {
            console.error('Data Network Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        socket.on('new_broadcast', (newBroadcast: Broadcast) => {
            setBroadcasts(prev => [newBroadcast, ...prev]);
        });

        const channels = [
            supabase.channel('workers-changes').on('postgres_changes', { event: '*', table: 'workers', schema: 'public' }, fetchData).subscribe(),
            supabase.channel('escalations-changes').on('postgres_changes', { event: '*', table: 'escalations', schema: 'public' }, fetchData).subscribe(),
            supabase.channel('broadcasts-changes').on('postgres_changes', { event: '*', table: 'broadcasts', schema: 'public' }, fetchData).subscribe(),
            supabase.channel('logs-changes').on('postgres_changes', { event: 'INSERT', table: 'admin_activity_logs', schema: 'public' }, fetchData).subscribe()
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

    const updateSLA = async (priority: string, hours: number) => {
        const { error } = await (supabase.from('sla_rules') as any).update({ max_hours: hours }).eq('priority', priority);
        if (!error) {
            logActivity(`Updated SLA for ${priority} to ${hours}h`, 'SLA');
            fetchData();
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
            fetchData();
        }
    };

    const createBroadcast = async (payload: Partial<Broadcast>) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                alert("Session expired. Please re-login.");
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/broadcasts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to transmit broadcast');

            fetchData();
            return result;
        } catch (error: any) {
            console.error('Broadcast Transmission Error:', error);
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

            fetchData();
        } catch (error: any) {
            console.error('Delete Error:', error);
            alert(`Termination Error: ${error.message}`);
        }
    };

    return {
        workers, departments, escalations, slaRules, announcements, broadcasts,
        activityLogs, loading, updateSLA, logActivity, fetchData,
        postAnnouncement, createBroadcast, deleteBroadcast
    };
};
