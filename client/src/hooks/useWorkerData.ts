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

    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);

        try {
            // Fetch Metrics
            const { data: metricData, error: metricError } = await supabase
                .from('worker_metrics')
                .select('*')
                .eq('worker_id', profile.id)
                .single();

            if (!metricError && metricData) {
                setMetrics(metricData as WorkerMetrics);
            }

            // Fetch Active Assignments starting from the assignment table
            // This is more robust for detecting new columns like 'deadline'
            // Fetch All Assignments (including history for calendar)
            const { data: assignmentRecords, error: assignmentError } = await (supabase.from('report_assignments') as any)
                .select(`
                    deadline,
                    priority,
                    created_at,
                    is_active,
                    worker_id,
                    issues!inner(*)
                `)
                .eq('worker_id', profile.id)
                .order('created_at', { ascending: false });

            if (assignmentError) {
                console.error('Assignment Fetch Error:', assignmentError);
                // If it still fails, it might be the column. Let's try to fetch issues only as fallback
                const { data: fallbackData } = await (supabase.from('issues') as any)
                    .select('*')
                    .eq('assigned_worker', profile.id)
                    .in('status', ['assigned', 'in_progress', 'reopened']);

                if (fallbackData) {
                    setAssignments(fallbackData as Report[]);
                }
            } else if (assignmentRecords) {
                // Map to compatible format: Report objects with assignments array
                const mappedData = assignmentRecords.map((record: any) => ({
                    ...record.issues,
                    priority: record.priority || record.issues.priority,
                    report_assignments: [record]
                }));
                setAssignments(mappedData as Report[]);
            }
        } catch (err) {
            console.error('Error fetching worker data:', err);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    useEffect(() => {
        fetchData();

        // Optional: Socket.io real-time for immediate task updates
        socket.on('issue_updated', (updatedIssue: any) => {
            fetchData(); // Simplest approach: refetch to ensure assignments and metrics sync
        });

        socket.on('new_issue', () => {
            fetchData();
        });

        const metricsChannel = supabase.channel('worker_metrics_changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'worker_metrics',
                filter: `worker_id=eq.${profile?.id}`
            }, (payload) => {
                setMetrics(payload.new as WorkerMetrics);
            })
            .subscribe();

        return () => {
            socket.off('issue_updated', () => { });
            socket.off('new_issue');
            supabase.removeChannel(metricsChannel);
        };
    }, [fetchData]);

    return { metrics, assignments, loading, refetch: fetchData };
};
