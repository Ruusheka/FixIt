import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface Report {
    id: string;
    title: string;
    description: string;
    location: string;
    user_id?: string;
    created_at: string;
    status: 'reported' | 'open' | 'in_progress' | 'resolved';
    priority?: 'low' | 'medium' | 'high';
    severity: number;
    resolved_at: string | null;
    image_url: string | null;
    assigned_workers?: string[];
    comments_count?: number;
    profiles?: {
        full_name: string;
    };
}

export const useReports = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('issues')
                .select(`
                    *,
                    profiles:user_id(full_name),
                    report_assignments(worker_id),
                    report_comments(id)
                `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const formattedReports = data.map((r: any) => ({
                ...r,
                status: r.status === 'reported' ? 'open' : r.status,
                location: r.address || 'Tactical Origin',
                priority: r.severity >= 8 ? 'high' : r.severity >= 5 ? 'medium' : 'low',
                profiles: r.profiles,
                comments_count: r.report_comments?.length || 0,
                assigned_workers: r.report_assignments?.map((a: any) => a.worker_id) || []
            }));

            setReports(formattedReports);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        const channel = supabase
            .channel('reports-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
                fetchReports();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const isOverdue = (createdAt: string, status: string) => {
        if (status === 'resolved') return false;
        const createdDate = new Date(createdAt);
        const now = new Date();
        const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        return diffInHours > 72;
    };

    const getOverdueHours = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
    };

    return { reports, loading, error, isOverdue, getOverdueHours, refresh: fetchReports };
};
