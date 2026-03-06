import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { socket } from '../services/socket';
import { useAuth } from './useAuth';
import { WorkerMetrics, Report } from '../types/reports';

export const useWorkerData = () => {
    const { profile } = useAuth();
    const [metrics, setMetrics] = useState<WorkerMetrics | null>(null);
    const [assignments, setAssignments] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (showLoading = true) => {
        if (!profile?.id) return;
        if (showLoading) setLoading(true);

        try {
            // Parallel fetch of Metrics and Assignments
            const [metricRes, assignmentRes] = await Promise.all([
                supabase
                    .from('worker_metrics')
                    .select('worker_id, total_assigned, total_resolved, rework_count, rating_avg, badge_level, last_updated')
                    .eq('worker_id', profile.id)
                    .maybeSingle(),
                (supabase.from('report_assignments') as any)
                    .select(`
                        deadline, priority, created_at, is_active, worker_id,
                        issues!inner(id, title, description, address, latitude, longitude, risk_score, status, image_url, created_at)
                    `)
                    .eq('worker_id', profile.id)
                    .order('created_at', { ascending: false })
            ]);

            if (metricRes.data) {
                setMetrics(metricRes.data as WorkerMetrics);
            }

            if (assignmentRes.data) {
                const mappedData = assignmentRes.data.map((record: any) => ({
                    ...record.issues,
                    priority: record.priority || record.issues.priority,
                    report_assignments: [record]
                }));
                setAssignments(mappedData as Report[]);
            } else if (assignmentRes.error) {
                console.error('Assignment Fetch Error:', assignmentRes.error);
            }

        } catch (err) {
            console.error('Error fetching worker data:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchData(true);

        // Realtime updates for Worker data
        const channel = supabase.channel(`worker_updates_${profile?.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'worker_metrics',
                filter: `worker_id=eq.${profile?.id}`
            }, () => fetchData(false))
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'report_assignments',
                filter: `worker_id=eq.${profile?.id}`
            }, () => fetchData(false))
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'issues'
            }, () => fetchData(false)) // Refresh if issues change
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, profile?.id]);

    return { metrics, assignments, loading, refetch: fetchData };
};
