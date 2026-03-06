import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, MapPin, Clock, Calendar, Bell, Map as MapIcon, LayoutDashboard, Globe, FileText, Target, Award, RefreshCcw } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MinimalLayout } from '../components/MinimalLayout';
import { InlineAlertMap } from '../components/citizen/InlineAlertMap';
import { format } from 'date-fns';
import { Broadcast } from '../types/reports';

const navItems = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/reports', icon: Globe },
    { label: 'My Report', path: '/citizen/reports', icon: FileText },
    { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
    { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
    { label: 'Rewards', path: '/citizen/rewards', icon: Award },
];

export const AnnouncementsPage: React.FC = () => {
    const { profile } = useAuth();
    const [activeBroadcasts, setActiveBroadcasts] = useState<Broadcast[]>([]);
    const [expiredBroadcasts, setExpiredBroadcasts] = useState<Broadcast[]>([]);
    const [currentTab, setCurrentTab] = useState<'active' | 'expired'>('active');
    const [loading, setLoading] = useState(true);
    const [openMapId, setOpenMapId] = useState<string | null>(null);

    const processBroadcasts = (data: Broadcast[]) => {
        const now = new Date();
        // Filter by role
        // Filter by role with safety checks
        const roleFiltered = data.filter(b => {
            if (!b.audience) return true; // Default to visible if audience is unknown
            const audienceLower = b.audience.toLowerCase();
            const userRoleLower = profile?.role?.toLowerCase();

            return audienceLower === 'both' ||
                audienceLower === 'citizen' ||
                (userRoleLower && audienceLower === userRoleLower);
        });

        const activeList: Broadcast[] = [];
        const expiredList: Broadcast[] = [];

        roleFiltered.forEach(b => {
            const start_datetime = b.scheduled_at ? new Date(b.scheduled_at) : new Date(0);
            const end_datetime = b.expires_at ? new Date(b.expires_at) : new Date(8640000000000000);

            if (now > end_datetime) {
                expiredList.push(b);
            } else if (now >= start_datetime) {
                activeList.push(b);
            }
            // Future-dated items are ignored for citizens until start time is reached
        });

        // Sort: Nearly coming (future) first, then past (newest first)
        activeList.sort((a, b) => {
            const startA = new Date(a.scheduled_at || a.created_at);
            const startB = new Date(b.scheduled_at || b.created_at);

            const isUpcomingA = startA > now;
            const isUpcomingB = startB > now;

            if (isUpcomingA && isUpcomingB) {
                return startA.getTime() - startB.getTime(); // Future: Soonest first
            }
            if (isUpcomingA && !isUpcomingB) return -1; // Future before past
            if (!isUpcomingA && isUpcomingB) return 1;  // Past after future

            return startB.getTime() - startA.getTime(); // Past: Most recent first
        });

        // Sort expired: Most recently expired first
        expiredList.sort((a, b) => {
            const endA = a.expires_at ? new Date(a.expires_at).getTime() : 0;
            const endB = b.expires_at ? new Date(b.expires_at).getTime() : 0;
            return endB - endA;
        });

        setActiveBroadcasts(activeList);
        setExpiredBroadcasts(expiredList);
    };

    const fetchBroadcasts = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');

            const response = await fetch(`${baseUrl}/api/broadcasts`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch from backend grid');
            const data = await response.json();

            if (data && Array.isArray(data)) {
                processBroadcasts(data as Broadcast[]);
            }
        } catch (error) {
            console.error('[Announcements] Operational Signal Interrupted:', error);
            // Fallback to supabase for maximum resilience on reload
            try {
                const { data, error: sbError } = await supabase
                    .from('broadcasts')
                    .select('*, author:profiles!created_by(*)')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (!sbError && data) {
                    processBroadcasts(data as Broadcast[]);
                }
            } catch (fallbackError) {
                console.error('[Announcements] Critical Fallback Failure:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();

        const channel = supabase
            .channel('broadcasts-realtime-citizen')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                console.log('📡 [Citizen Intel] New broadcast signal detected:', payload.new.title);
                fetchBroadcasts();
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'broadcasts' }, () => { fetchBroadcasts(); })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'broadcasts' }, () => { fetchBroadcasts(); })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
            case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'Medium': return 'text-blue-600 bg-blue-50 border-blue-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <MinimalLayout
            navItems={navItems}
            title="City Alerts & Intelligence"
        >
            <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-12 py-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-secondary/5 pb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-primary shadow-xl shadow-brand-secondary/10">
                                <Megaphone size={24} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase">Operational Alerts</h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-[0.3em]">Real-time city-wide intelligence broadcast</p>
                                    <button
                                        onClick={() => fetchBroadcasts()}
                                        className="text-[9px] font-black text-brand-secondary/40 hover:text-brand-secondary uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 border border-brand-secondary/5 px-2 py-0.5 rounded-lg hover:bg-brand-secondary/5"
                                    >
                                        <RefreshCcw size={10} className="animate-spin-slow" /> Force Sync
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setCurrentTab('active')}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${currentTab === 'active' ? 'bg-brand-secondary text-brand-primary shadow-xl shadow-brand-secondary/10' : 'bg-transparent text-brand-secondary/40 hover:bg-brand-secondary/5 hover:text-brand-secondary'}`}
                    >
                        Active
                        <span className={`px-2 py-0.5 rounded-full text-[8px] ${currentTab === 'active' ? 'bg-brand-primary text-brand-secondary' : 'bg-brand-secondary/10'}`}>
                            {activeBroadcasts.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setCurrentTab('expired')}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${currentTab === 'expired' ? 'bg-brand-secondary text-brand-primary shadow-xl shadow-brand-secondary/10' : 'bg-transparent text-brand-secondary/40 hover:bg-brand-secondary/5 hover:text-brand-secondary'}`}
                    >
                        Expired
                        <span className={`px-2 py-0.5 rounded-full text-[8px] ${currentTab === 'expired' ? 'bg-brand-primary text-brand-secondary' : 'bg-brand-secondary/10'}`}>
                            {expiredBroadcasts.length}
                        </span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Accessing Intelligence Grid...</p>
                    </div>
                ) : (currentTab === 'active' ? activeBroadcasts : expiredBroadcasts).length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        <AnimatePresence>
                            {(currentTab === 'active' ? activeBroadcasts : expiredBroadcasts).map((b, i) => (
                                <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="minimal-card p-10 group hover:shadow-2xl hover:shadow-brand-secondary/5 transition-all duration-500 overflow-hidden relative"
                                >
                                    {/* Priority Indicator */}
                                    <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl border-l border-b ${getPriorityColor(b.priority)} text-[9px] font-black uppercase tracking-[0.2em]`}>
                                        {b.priority} Priority
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-10">
                                        {/* Date/Time Highlight Section */}
                                        <div className="shrink-0 flex flex-row md:flex-col gap-6 md:w-40 border-b md:border-b-0 md:border-r border-brand-secondary/5 pb-8 md:pb-0 md:pr-8">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                                    <Calendar size={12} />
                                                    Event Date
                                                </div>
                                                <p className="text-sm font-black text-brand-secondary uppercase tracking-tighter">
                                                    {format(new Date(b.scheduled_at || b.created_at), 'MMMM dd, yyyy')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                                    <Clock size={12} />
                                                    Time
                                                </div>
                                                <p className="text-sm font-black text-brand-secondary uppercase tracking-tighter">
                                                    {format(new Date(b.scheduled_at || b.created_at), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-brand-secondary/5 flex items-center justify-center overflow-hidden border border-brand-secondary/10">
                                                        {b.author?.avatar_url ? (
                                                            <img src={b.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-brand-secondary text-brand-primary text-[10px] font-black">
                                                                {b.author?.full_name?.[0] || 'A'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest leading-none">Intelligence Source</p>
                                                        <p className="text-[10px] font-black text-brand-secondary uppercase tracking-tighter mt-0.5">{b.author?.full_name || 'City Admin'}</p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-px bg-brand-secondary/5" />
                                                <h3 className="text-3xl font-black text-brand-secondary uppercase tracking-tight leading-none group-hover:text-brand-primary transition-colors duration-300">
                                                    {b.title}
                                                </h3>
                                            </div>
                                            <p className="text-brand-secondary/60 font-bold leading-relaxed text-lg">
                                                {b.message}
                                            </p>

                                            {b.address && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4 p-5 bg-brand-secondary/5 rounded-3xl border border-brand-secondary/5">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-brand-primary/40 rounded-2xl animate-ping opacity-20" />
                                                            <div className="w-10 h-10 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-primary shrink-0 relative z-10">
                                                                <MapPin size={20} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Target Location</p>
                                                            <p className="text-xs font-black text-brand-secondary uppercase tracking-wide">{b.address}</p>
                                                        </div>
                                                        {b.location_lat && b.location_lng && (
                                                            <button
                                                                onClick={() => setOpenMapId(openMapId === b.id ? null : b.id)}
                                                                className={`ml-auto px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${openMapId === b.id
                                                                    ? 'bg-brand-secondary text-brand-primary border-brand-secondary'
                                                                    : 'bg-transparent text-brand-secondary border-brand-secondary/20 hover:bg-brand-secondary/5'
                                                                    }`}
                                                            >
                                                                <MapIcon size={12} />
                                                                {openMapId === b.id ? 'Hide Visual' : 'View Section'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <AnimatePresence>
                                                        {openMapId === b.id && b.location_lat && b.location_lng && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <InlineAlertMap
                                                                    lat={b.location_lat}
                                                                    lng={b.location_lng}
                                                                    address={b.address}
                                                                    title={b.title}
                                                                />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="minimal-card p-24 text-center border-dashed border-brand-secondary/10">
                        <div className="w-20 h-20 bg-brand-secondary/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-brand-secondary/10">
                            <Bell size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter mb-4">
                            {currentTab === 'active' ? 'No active announcements currently.' : 'No past announcements.'}
                        </h2>
                        <p className="text-sm font-black text-brand-secondary/20 uppercase tracking-[0.2em]">The city grid is currently silent.</p>
                    </div>
                )}
            </div>
        </MinimalLayout>
    );
};
