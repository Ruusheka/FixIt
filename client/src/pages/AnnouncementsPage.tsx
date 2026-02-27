import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, MapPin, Navigation, Clock, Calendar, Bell, Info, ChevronRight, Map as MapIcon, LayoutDashboard, Globe, FileText, Target, Award } from 'lucide-react';
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
    { label: 'Rewards', path: '/citizen/profile#rewards', icon: Award },
];

export const AnnouncementsPage: React.FC = () => {
    const { profile } = useAuth();
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMapId, setOpenMapId] = useState<string | null>(null);

    useEffect(() => {
        const fetchBroadcasts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('broadcasts')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Announcements] Error fetching:', error);
            } else if (data) {
                const now = new Date();
                // Filter by role if profile exists
                const roleFiltered = profile ? (data as Broadcast[]).filter(b =>
                    b.audience === 'Both' ||
                    b.audience.toLowerCase() === profile.role.toLowerCase()
                ) : (data as Broadcast[]);

                // Sort: Nearly coming (future) first, then past (newest first)
                const sorted = [...roleFiltered].sort((a, b) => {
                    const dateA = new Date(a.scheduled_at || a.created_at);
                    const dateB = new Date(b.scheduled_at || b.created_at);

                    const isFutureA = dateA >= now;
                    const isFutureB = dateB >= now;

                    if (isFutureA && isFutureB) {
                        return dateA.getTime() - dateB.getTime(); // Future: Soonest first
                    }
                    if (isFutureA && !isFutureB) return -1; // Future before past
                    if (!isFutureA && isFutureB) return 1;  // Past after future

                    return dateB.getTime() - dateA.getTime(); // Past: Most recent first
                });

                setBroadcasts(sorted);
            }
            setLoading(false);
        };

        fetchBroadcasts();
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
            <div className="max-w-5xl mx-auto space-y-12 py-8">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-secondary/5 pb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-primary shadow-xl shadow-brand-secondary/10">
                                <Megaphone size={24} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase">Operational Alerts</h1>
                                <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-[0.3em] mt-1">Real-time city-wide intelligence broadcast</p>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Accessing Intelligence Grid...</p>
                    </div>
                ) : broadcasts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8">
                        <AnimatePresence>
                            {broadcasts.map((b, i) => (
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
                        <h2 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter mb-4">No active intelligence</h2>
                        <p className="text-sm font-black text-brand-secondary/20 uppercase tracking-[0.2em]">The city grid is currently silent.</p>
                    </div>
                )}
            </div>
        </MinimalLayout>
    );
};
