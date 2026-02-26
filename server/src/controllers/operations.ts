import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getOperationsData = async (req: Request, res: Response) => {
    try {
        const [wRes, dRes, eRes, sRes, lRes, aRes, bRes] = await Promise.all([
            supabase.from('workers').select('*, profile:profiles(*), department:departments(*), metrics:worker_metrics(*)'),
            supabase.from('departments').select('*'),
            supabase.from('escalations').select('*, report:issues(*, reporter:profiles!user_id(id, email, full_name, role)), escalator:profiles(*)').order('created_at', { ascending: false }),
            supabase.from('sla_rules').select('*'),
            supabase.from('admin_activity_logs').select('*, admin:profiles(*)').order('created_at', { ascending: false }).limit(50),
            supabase.from('internal_announcements').select('*, author:profiles(*)').order('created_at', { ascending: false }),
            supabase.from('broadcasts').select('*, author:profiles!created_by(*)').order('created_at', { ascending: false })
        ]);

        res.json({
            workers: wRes.data || [],
            departments: dRes.data || [],
            escalations: eRes.data || [],
            slaRules: sRes.data || [],
            activityLogs: lRes.data || [],
            announcements: aRes.data || [],
            broadcasts: bRes.data || []
        });
    } catch (error: any) {
        console.error('Operations Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch tactical data network' });
    }
};
