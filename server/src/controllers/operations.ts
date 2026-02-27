import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getOperationsData = async (req: Request, res: Response) => {
    try {
        const [wRes, dRes, eRes, sRes, lRes, aRes, bRes, iRes] = await Promise.all([
            supabase.from('workers').select('*, profile:profiles(*), department:departments(*), metrics:worker_metrics(*)'),
            supabase.from('departments').select('*'),
            supabase.from('escalations').select('*, report:issues(*, reporter:profiles!user_id(id, email, full_name, role), assigned_worker_profile:profiles!assigned_worker(id, full_name, role)), escalator:profiles(*)').order('created_at', { ascending: false }),
            supabase.from('sla_rules').select('*'),
            supabase.from('admin_activity_logs').select('*, admin:profiles(*)').order('created_at', { ascending: false }).limit(50),
            supabase.from('internal_announcements').select('*, author:profiles(*)').order('created_at', { ascending: false }),
            supabase.from('broadcasts').select('*, author:profiles!created_by(*)').order('created_at', { ascending: false }),
            supabase.from('issues').select('status, created_at, resolved_at, priority')
        ]);

        // Calculate metrics
        const resolvedStatuses = ['resolved', 'closed', 'RESOLVED'];
        const resolvedIssues = (iRes.data || []).filter(i => resolvedStatuses.includes(i.status) && i.resolved_at);
        const avgResTime = resolvedIssues.length > 0
            ? (resolvedIssues.reduce((acc, curr) => acc + (new Date(curr.resolved_at).getTime() - new Date(curr.created_at).getTime()), 0) / resolvedIssues.length / (1000 * 60 * 60)).toFixed(1) + 'h'
            : '0h';

        const totalIssues = (iRes.data || []).length;
        const overdueIssues = (iRes.data || []).filter(i => {
            const rule = (sRes.data || []).find(r => r.priority === i.priority);
            if (!rule || resolvedStatuses.includes(i.status)) return false;
            const diffHours = (new Date().getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60);
            return diffHours > rule.max_hours;
        }).length;

        const compliance = totalIssues > 0 ? (((totalIssues - overdueIssues) / totalIssues) * 100).toFixed(1) + '%' : '100%';

        res.json({
            workers: wRes.data || [],
            departments: dRes.data || [],
            escalations: eRes.data || [],
            slaRules: sRes.data || [],
            activityLogs: lRes.data || [],
            announcements: aRes.data || [],
            broadcasts: bRes.data || [],
            stats: {
                avgResolutionTime: avgResTime,
                compliance
            }
        });
    } catch (error: any) {
        console.error('Operations Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch tactical data network' });
    }
};
