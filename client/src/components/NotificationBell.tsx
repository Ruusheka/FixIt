import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bell, X, Check, CheckCheck, FileText, UserCheck,
    MessageSquare, CheckCircle2, AlertTriangle, Target,
    Camera, Zap, ChevronRight
} from 'lucide-react';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

// ── Icon map per notification type ──
const TYPE_ICON: Record<Notification['type'], { icon: React.ElementType; color: string; bg: string }> = {
    new_report: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    assignment: { icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    message: { icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-500/10' },
    report_update: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-500/10' },
    microtask: { icon: Target, color: 'text-purple-600', bg: 'bg-purple-500/10' },
    proof: { icon: Camera, color: 'text-rose-600', bg: 'bg-rose-500/10' },
    response: { icon: Zap, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
};

// ── Toast Component ──
export const NotificationToast: React.FC<{
    notification: Notification;
    onDismiss: () => void;
    onNavigate: (url: string) => void;
}> = ({ notification, onDismiss, onNavigate }) => {
    const conf = TYPE_ICON[notification.type] || TYPE_ICON.message;
    const Icon = conf.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-[9999] w-[340px] max-w-[calc(100vw-32px)]"
            >
                <div className="bg-white border border-brand-secondary/10 rounded-2xl shadow-2xl shadow-brand-secondary/10 overflow-hidden">
                    <div className="flex items-start gap-4 p-4">
                        <div className={`w-10 h-10 rounded-xl ${conf.bg} flex items-center justify-center shrink-0`}>
                            <Icon size={18} className={conf.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-brand-secondary uppercase tracking-tight leading-snug">{notification.title}</p>
                            <p className="text-[11px] text-brand-secondary/60 font-medium mt-0.5 line-clamp-2">{notification.message}</p>
                        </div>
                        <button onClick={onDismiss} className="p-1 text-brand-secondary/30 hover:text-brand-secondary transition-colors shrink-0">
                            <X size={14} />
                        </button>
                    </div>
                    {notification.redirect_url && (
                        <button
                            onClick={() => { onNavigate(notification.redirect_url!); onDismiss(); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 border-t border-brand-secondary/5 text-[10px] font-black text-brand-secondary/50 uppercase tracking-widest hover:bg-brand-secondary/5 hover:text-brand-secondary transition-all"
                        >
                            View <ChevronRight size={12} />
                        </button>
                    )}
                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                        className="h-0.5 bg-brand-secondary/20"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

// ── Notification Panel Item ──
const NotificationItem: React.FC<{
    notification: Notification;
    onRead: (id: string) => void;
    onNavigate: (url: string | null) => void;
}> = ({ notification, onRead, onNavigate }) => {
    const conf = TYPE_ICON[notification.type] || TYPE_ICON.message;
    const Icon = conf.icon;

    const handleClick = () => {
        if (!notification.is_read) onRead(notification.id);
        if (notification.redirect_url) onNavigate(notification.redirect_url);
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleClick}
            className={`w-full flex items-start gap-3 p-4 rounded-2xl transition-all text-left group ${notification.is_read
                    ? 'hover:bg-brand-secondary/5'
                    : 'bg-brand-secondary/[0.03] hover:bg-brand-secondary/[0.06] border border-brand-secondary/5'
                }`}
        >
            <div className={`w-9 h-9 rounded-xl ${conf.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon size={15} className={conf.color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className={`text-xs leading-tight ${notification.is_read ? 'font-semibold text-brand-secondary/70' : 'font-black text-brand-secondary'}`}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
                    )}
                </div>
                <p className="text-[11px] text-brand-secondary/50 font-medium mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-[9px] font-bold text-brand-secondary/30 uppercase tracking-widest mt-1.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
            </div>
            {notification.redirect_url && (
                <ChevronRight size={14} className="text-brand-secondary/20 shrink-0 mt-2 group-hover:text-brand-secondary/50 group-hover:translate-x-0.5 transition-all" />
            )}
        </motion.button>
    );
};

// ── Main Bell + Panel Component ──
export const NotificationBell: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { notifications, unreadCount, loading, toast, markAsRead, markAllAsRead, dismissToast } = useNotifications(profile?.id);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleNavigate = (url: string | null) => {
        if (!url) return;
        setIsOpen(false);
        navigate(url);
    };

    const handleReadAndNavigate = async (notification: Notification) => {
        if (!notification.is_read) await markAsRead(notification.id);
        handleNavigate(notification.redirect_url);
    };

    return (
        <>
            {/* Bell Button */}
            <div className="relative">
                <motion.button
                    ref={buttonRef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all border-2 ${isOpen
                            ? 'bg-brand-secondary text-brand-primary border-brand-secondary shadow-lg'
                            : 'border-brand-secondary/10 hover:bg-brand-secondary/5 text-brand-secondary/70'
                        }`}
                    aria-label="Open notifications"
                >
                    <motion.div
                        animate={unreadCount > 0 ? {
                            rotate: [0, -10, 10, -8, 8, -4, 4, 0]
                        } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <Bell size={18} />
                    </motion.div>

                    {/* Unread Badge */}
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.div
                                key="badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* Notification Panel */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={panelRef}
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-[calc(100%+12px)] w-[360px] max-w-[calc(100vw-24px)] max-h-[520px] bg-white border border-brand-secondary/10 rounded-[24px] shadow-2xl shadow-brand-secondary/15 flex flex-col z-[1000] overflow-hidden"
                            style={{ transformOrigin: 'top right' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-secondary/5 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Bell size={16} className="text-brand-secondary" />
                                    <h3 className="text-sm font-black text-brand-secondary uppercase tracking-tight">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-black text-brand-secondary/40 hover:text-brand-secondary uppercase tracking-widest hover:bg-brand-secondary/5 rounded-xl transition-all"
                                        >
                                            <CheckCheck size={12} />
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 text-brand-secondary/30 hover:text-brand-secondary hover:bg-brand-secondary/5 rounded-xl transition-all">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Notification List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {loading ? (
                                    <div className="py-16 flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full border-2 border-brand-secondary/10 border-t-brand-secondary animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center justify-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-brand-secondary/5 flex items-center justify-center">
                                            <Bell size={24} className="text-brand-secondary/20" />
                                        </div>
                                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                            No notifications yet
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <NotificationItem
                                            key={n.id}
                                            notification={n}
                                            onRead={markAsRead}
                                            onNavigate={(url) => handleNavigate(url)}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-3 border-t border-brand-secondary/5 shrink-0">
                                    <p className="text-[9px] font-black text-brand-secondary/25 uppercase tracking-[0.2em] text-center">
                                        Showing last {notifications.length} notifications
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <NotificationToast
                        notification={toast}
                        onDismiss={dismissToast}
                        onNavigate={handleNavigate}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
