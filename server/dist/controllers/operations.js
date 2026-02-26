"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperationsData = void 0;
const supabase_1 = require("../config/supabase");
const getOperationsData = async (req, res) => {
    try {
        const [wRes, dRes, eRes, sRes, lRes, aRes, bRes] = await Promise.all([
            supabase_1.supabase.from('workers').select('*, profile:profiles(*), department:departments(*), metrics:worker_metrics(*)'),
            supabase_1.supabase.from('departments').select('*'),
            supabase_1.supabase.from('escalations').select('*, report:issues(*, reporter:profiles!user_id(id, email, full_name, role)), escalator:profiles(*)').order('created_at', { ascending: false }),
            supabase_1.supabase.from('sla_rules').select('*'),
            supabase_1.supabase.from('admin_activity_logs').select('*, admin:profiles(*)').order('created_at', { ascending: false }).limit(50),
            supabase_1.supabase.from('internal_announcements').select('*, author:profiles(*)').order('created_at', { ascending: false }),
            supabase_1.supabase.from('broadcasts').select('*, author:profiles!created_by(*)').order('created_at', { ascending: false })
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
    }
    catch (error) {
        console.error('Operations Data Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch tactical data network' });
    }
};
exports.getOperationsData = getOperationsData;
