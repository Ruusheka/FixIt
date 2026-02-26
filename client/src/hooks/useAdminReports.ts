import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Report, ReportStatus, ReportPriority } from '../types/reports';

export interface ReportFilters {
    search: string;
    status: ReportStatus | 'all';
    priority: ReportPriority | 'all';
    worker: string | 'all';
    overdue: boolean;
    sortBy: 'newest' | 'oldest' | 'most_overdue' | 'highest_priority' | 'risk_score_desc';
}

export const useAdminReports = () => {
    const [searchParams] = useSearchParams();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<ReportFilters>({
        search: searchParams.get('search') || '',
        status: (searchParams.get('status') as any) || 'all',
        priority: (searchParams.get('priority') as any) || 'all',
        worker: searchParams.get('worker') || 'all',
        overdue: searchParams.get('overdue') === 'true',
        sortBy: (searchParams.get('sortBy') as any) || 'newest',
    });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('issues')
                .select(`
                  *,
                  reporter:profiles!user_id(id, email, full_name, role),
                  assignments:report_assignments(worker:profiles!report_assignments_worker_id_fkey(id, email, full_name, role))
                `);

            // Apply Filters
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters.priority !== 'all') {
                query = query.eq('priority', filters.priority);
            }
            if (filters.worker !== 'all') {
                query = query.eq('assigned_worker', filters.worker);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            let processedReports = (data || []).map((r: any) => ({
                ...r,
                reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter
            })) as Report[];

            // Manual Filter for Overdue (since it's a dynamic calculation usually, but we check created_at)
            if (filters.overdue) {
                const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
                processedReports = processedReports.filter(r =>
                    r.status !== 'resolved' && new Date(r.created_at) < new Date(seventyTwoHoursAgo)
                );
            }

            // Sorting
            processedReports.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'newest':
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    case 'oldest':
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    case 'highest_priority': {
                        const priorityMap: Record<string, number> = { Critical: 5, Urgent: 4, High: 3, Medium: 2, Low: 1 };
                        return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
                    }
                    case 'risk_score_desc': {
                        const scoreA = a.risk_score_int ?? Math.round((a.risk_score || 0) * 100);
                        const scoreB = b.risk_score_int ?? Math.round((b.risk_score || 0) * 100);
                        return scoreB - scoreA;
                    }
                    case 'most_overdue':
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    default:
                        return 0;
                }
            });

            setReports(processedReports);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReports();

        // Realtime Subscriptions
        const channel = supabase
            .channel('admin_reports_changes')
            .on('postgres_changes', { event: '*', table: 'issues', schema: 'public' }, () => {
                fetchReports();
            })
            .on('postgres_changes', { event: '*', table: 'report_assignments', schema: 'public' }, () => {
                fetchReports();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReports]);

    const updateReportStatus = async (id: string, status: ReportStatus) => {
        const { error } = await (supabase.from('issues') as any).update({ status }).eq('id', id);
        if (error) throw error;
    };

    const escalateReport = async (id: string, is_escalated: boolean) => {
        const { error } = await (supabase.from('issues') as any).update({ is_escalated }).eq('id', id);
        if (error) throw error;
    };

    return {
        reports,
        loading,
        filters,
        setFilters,
        updateReportStatus,
        escalateReport,
        refetch: fetchReports,
    };
};
