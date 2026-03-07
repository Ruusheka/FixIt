import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export interface Notification {
    id: string;
    user_id: string;
    user_role: 'citizen' | 'worker' | 'admin';
    title: string;
    message: string;
    type: 'report_update' | 'assignment' | 'message' | 'microtask' | 'proof' | 'resolved' | 'new_report' | 'response';
    reference_id: string | null;
    redirect_url: string | null;
    is_read: boolean;
    created_at: string;
}

export const useNotifications = (userId: string | null | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<Notification | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        const { data, error } = await (supabase.from('notifications') as any)
            .select(`
                id, user_id, title, message, type, is_read, created_at,
                redirect_url:link
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('[useNotifications] fetch error:', error);
        } else {
            setNotifications(data || []);
            setUnreadCount((data || []).filter((n: Notification) => !n.is_read).length);
        }
        setLoading(false);
    }, [userId]);

    const markAsRead = async (notificationId: string) => {
        await (supabase.from('notifications') as any)
            .update({ is_read: true })
            .eq('id', notificationId);

        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        if (!userId) return;
        await (supabase.from('notifications') as any)
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const dismissToast = useCallback(() => {
        setToast(null);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }, []);

    const showToast = useCallback((notification: Notification) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast(notification);
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 5000);
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchNotifications();

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload: any) => {
                const newNotif = {
                    ...payload.new,
                    redirect_url: payload.new.link
                } as Notification;
                setNotifications(prev => [newNotif, ...prev].slice(0, 20));
                setUnreadCount(prev => prev + 1);
                showToast(newNotif);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload: any) => {
                const updated = {
                    ...payload.new,
                    redirect_url: payload.new.link
                } as Notification;
                setNotifications(prev =>
                    prev.map(n => n.id === updated.id ? updated : n)
                );
                setUnreadCount(prev => {
                    // recalculate based on current state
                    return Math.max(0, prev);
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [userId, fetchNotifications, showToast]);

    return {
        notifications,
        unreadCount,
        loading,
        toast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissToast,
    };
};

// ── Notification Creator Utilities ──
// Call these from existing action handlers to fire notifications

export const createNotification = async (payload: {
    user_id: string;
    user_role: 'citizen' | 'worker' | 'admin';
    title: string;
    message: string;
    type: Notification['type'];
    reference_id?: string;
    redirect_url?: string;
}) => {
    const { error } = await (supabase.from('notifications') as any).insert({
        user_id: payload.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        link: payload.redirect_url, // Map redirect_url to link column
        is_read: false,
    });
    if (error) console.error('[createNotification] error:', error);
};

// Notify admin when a new citizen report is submitted
export const notifyAdminsNewReport = async (reportId: string, reportTitle: string) => {
    try {
        const { data: admins } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('role', 'admin');

        if (!admins || admins.length === 0) return;

        const notifications = admins.map((admin: { id: string }) => ({
            user_id: admin.id,
            title: '📄 New Report Submitted',
            message: `A citizen submitted: "${reportTitle}"`,
            type: 'new_report' as const,
            link: `/admin/reports/${reportId}`, // Use link instead of redirect_url
            is_read: false,
        }));

        await (supabase.from('notifications') as any).insert(notifications);
    } catch (e) {
        console.error('[notifyAdminsNewReport] error:', e);
    }
};

// Notify a worker when they are assigned to a report
export const notifyWorkerAssigned = async (workerId: string, reportId: string, reportTitle: string) => {
    await createNotification({
        user_id: workerId,
        user_role: 'worker',
        title: '👷 New Assignment',
        message: `You've been assigned to: "${reportTitle}"`,
        type: 'assignment',
        reference_id: reportId,
        redirect_url: `/worker/tasks/${reportId}`,
    });
};

// Notify admins when a worker uploads proof
export const notifyAdminProofUploaded = async (reportId: string, workerName: string) => {
    try {
        const { data: admins } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('role', 'admin');

        if (!admins || admins.length === 0) return;

        const notifications = admins.map((admin: { id: string }) => ({
            user_id: admin.id,
            title: '📸 Proof Uploaded',
            message: `${workerName} uploaded resolution proof. Review required.`,
            type: 'proof' as const,
            link: `/admin/reports/${reportId}`, // Use link instead of redirect_url
            is_read: false,
        }));

        await (supabase.from('notifications') as any).insert(notifications);
    } catch (e) {
        console.error('[notifyAdminProofUploaded] error:', e);
    }
};

// Notify citizen when their report is resolved
export const notifyCitizenResolved = async (citizenId: string, reportId: string, reportTitle: string) => {
    await createNotification({
        user_id: citizenId,
        user_role: 'citizen',
        title: '✅ Report Resolved',
        message: `Your report "${reportTitle}" has been resolved!`,
        type: 'resolved',
        reference_id: reportId,
        redirect_url: `/citizen/my-reports/${reportId}`,
    });
};

// Notify citizens when a new microtask is deployed
export const notifyCitizensNewMicrotask = async (taskId: string, taskTitle: string) => {
    try {
        const { data: citizens } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('role', 'citizen');

        if (!citizens || citizens.length === 0) return;

        const notifications = citizens.map((c: { id: string }) => ({
            user_id: c.id,
            title: '🎯 New Mission Available',
            message: `"${taskTitle}" — Earn civic points by completing this mission!`,
            type: 'microtask' as const,
            link: `/citizen/micro-tasks/${taskId}`, // Use link instead of redirect_url
            is_read: false,
        }));

        // Insert in batches to avoid overloading Supabase
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
            await (supabase.from('notifications') as any).insert(notifications.slice(i, i + batchSize));
        }
    } catch (e) {
        console.error('[notifyCitizensNewMicrotask] error:', e);
    }
};

// Notify admin when a citizen submits a microtask response
export const notifyAdminMicrotaskResponse = async (taskId: string, taskTitle: string, citizenName: string) => {
    try {
        const { data: admins } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('role', 'admin');

        if (!admins || admins.length === 0) return;

        const notifications = admins.map((admin: { id: string }) => ({
            user_id: admin.id,
            title: '📋 Mission Response Received',
            message: `${citizenName} submitted a response for "${taskTitle}"`,
            type: 'response' as const,
            link: `/admin/micro-tasks/${taskId}`, // Use link instead of redirect_url
            is_read: false,
        }));

        await (supabase.from('notifications') as any).insert(notifications);
    } catch (e) {
        console.error('[notifyAdminMicrotaskResponse] error:', e);
    }
};

// Notify citizen/worker when admin sends a message
export const notifyUserMessage = async (
    targetUserId: string,
    targetRole: 'citizen' | 'worker',
    reportId: string,
    senderName: string
) => {
    const redirectBase = targetRole === 'citizen'
        ? `/citizen/my-reports/${reportId}`
        : `/worker/tasks/${reportId}`;

    await createNotification({
        user_id: targetUserId,
        user_role: targetRole,
        title: '💬 New Message',
        message: `${senderName} sent you a message about your report.`,
        type: 'message',
        reference_id: reportId,
        redirect_url: redirectBase,
    });
};

// Notify citizen when their microtask response is verified/approved
export const notifyCitizenMicrotaskVerified = async (citizenId: string, taskId: string, taskTitle: string, points: number) => {
    await createNotification({
        user_id: citizenId,
        user_role: 'citizen',
        title: '🎯 Mission Verified!',
        message: `Your response for "${taskTitle}" has been approved. You earned ${points} points!`,
        type: 'microtask',
        reference_id: taskId,
        redirect_url: `/citizen/micro-tasks/${taskId}`,
    });
};

// Notify citizen when their microtask response is rejected
export const notifyCitizenMicrotaskRejected = async (citizenId: string, taskId: string, taskTitle: string, reason: string) => {
    await createNotification({
        user_id: citizenId,
        user_role: 'citizen',
        title: '⚠️ Mission Clarification Needed',
        message: `Correction required for "${taskTitle}": ${reason}`,
        type: 'microtask',
        reference_id: taskId,
        redirect_url: `/citizen/micro-tasks/${taskId}`,
    });
};

// Notify citizen when a worker is assigned to their report
export const notifyCitizenAssigned = async (citizenId: string, reportId: string, reportTitle: string, workerName: string) => {
    await createNotification({
        user_id: citizenId,
        user_role: 'citizen',
        title: '🛠 Worker Assigned',
        message: `A worker (${workerName}) has been assigned to resolve "${reportTitle}".`,
        type: 'assignment',
        reference_id: reportId,
        redirect_url: `/citizen/reports/${reportId}`,
    });
};

// Notify citizen of any status update on their report
export const notifyCitizenStatusUpdate = async (citizenId: string, reportId: string, reportTitle: string, newStatus: string) => {
    await createNotification({
        user_id: citizenId,
        user_role: 'citizen',
        title: '📈 Report Update',
        message: `Your report "${reportTitle}" is now: ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
        type: 'report_update',
        reference_id: reportId,
        redirect_url: `/citizen/reports/${reportId}`,
    });
};
