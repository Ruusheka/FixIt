import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const createBroadcast = async (req: Request, res: Response) => {
    try {
        const {
            title, message, audience, target_department_id,
            priority, scheduled_at, expires_at,
            location_lat, location_lng, address, geotag_radius
        } = req.body;
        const adminId = (req as any).user?.id;

        const { data, error } = await supabase
            .from('broadcasts')
            .insert([{
                title,
                message,
                audience: audience || 'Both',
                target_department_id: target_department_id || null,
                priority: priority || 'Medium',
                created_by: adminId,
                scheduled_at: scheduled_at || null,
                expires_at: expires_at || null,
                location_lat: location_lat || null,
                location_lng: location_lng || null,
                address: address || null,
                geotag_radius: geotag_radius || null,
                is_active: !scheduled_at // Active immediately if not scheduled
            }])
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabase.from('admin_activity_logs').insert([{
            admin_id: adminId,
            action: `Created broadcast: ${title}`,
            target_type: 'BROADCAST',
            target_id: data.id
        }]);

        // Emit real-time event
        const io = (req as any).io;
        if (io) {
            io.emit('new_broadcast', data);
        }

        res.status(201).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getBroadcasts = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('broadcasts')
            .select('*, author:profiles!created_by(*), reads:broadcast_reads(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const { error } = await supabase
            .from('broadcast_reads')
            .upsert([{ broadcast_id: id, user_id: userId }], { onConflict: 'broadcast_id,user_id' });

        if (error) throw error;

        res.json({ message: 'Broadcast marked as read' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateBroadcast = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const adminId = (req as any).user?.id;

        const { data, error } = await supabase
            .from('broadcasts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log Activity
        await supabase.from('admin_activity_logs').insert([{
            admin_id: adminId,
            action: `Updated broadcast: ${data.title}`,
            target_type: 'BROADCAST',
            target_id: id
        }]);

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteBroadcast = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user?.id;

        const { data: broadcast } = await supabase.from('broadcasts').select('title').eq('id', id).single();

        const { error } = await supabase
            .from('broadcasts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log Activity
        await supabase.from('admin_activity_logs').insert([{
            admin_id: adminId,
            action: `Deleted broadcast: ${broadcast?.title || id}`,
            target_type: 'BROADCAST',
            target_id: id
        }]);

        res.json({ message: 'Broadcast deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getBroadcastAnalytics = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Get broadcast details
        const { data: broadcast, error: bError } = await supabase
            .from('broadcasts')
            .select('*')
            .eq('id', id)
            .single();

        if (bError) throw bError;

        // 2. Get read count
        const { count: readCount, error: rError } = await supabase
            .from('broadcast_reads')
            .select('*', { count: 'exact', head: true })
            .eq('broadcast_id', id);

        if (rError) throw rError;

        // 3. Get target audience size (mocking for now, in prod you'd query profiles based on target_role/dept)
        let totalTarget = 0;
        const { count: citizenCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'citizen');
        const { count: workerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker');
        const { count: adminCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');

        if (broadcast.audience === 'Both') totalTarget = (citizenCount || 0) + (workerCount || 0) + (adminCount || 0);
        else if (broadcast.audience === 'Citizen') totalTarget = citizenCount || 0;
        else if (broadcast.audience === 'Worker') totalTarget = workerCount || 0;

        res.json({
            readCount: readCount || 0,
            totalTarget,
            readPercentage: totalTarget > 0 ? ((readCount || 0) / totalTarget) * 100 : 0
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
