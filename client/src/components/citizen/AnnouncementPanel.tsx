import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, AlertTriangle, Bell, Info, Clock, ShieldCheck, MapPin, X, Navigation } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Broadcast {
    id: string;
    title: string;
    message: string;
    audience: 'Citizen' | 'Worker' | 'Both';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
    created_by?: string;
    address?: string;
    location_lat?: number;
    location_lng?: number;
}

interface AnnouncementPanelProps {
    role: 'Citizen' | 'Worker';
}

export const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ role }) => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMapBroadcast, setActiveMapBroadcast] = useState<Broadcast | null>(null);

    const fetchBroadcasts = async () => {
        try {
            setLoading(true);
            console.log(`[Diagnostic] Fetching broadcasts for role: ${role}`);

            const { data, error } = await supabase
                .from('broadcasts')
                .select('*')
                .eq('is_active', true);

            if (error) {
                console.error('[Diagnostic] Supabase Query Error:', error);
                throw error;
            }

            console.log(`[Diagnostic] Raw data received: ${data?.length || 0} rows`);

            if (data) {
                const now = new Date();
                const filtered = (data as Broadcast[]).filter(b => {
                    const audienceMatch =
                        b.audience?.toLowerCase() === 'both' ||
                        b.audience?.toLowerCase() === role.toLowerCase();
                    const notExpired = !b.expires_at || new Date(b.expires_at) > now;
                    return audienceMatch && notExpired;
                });

                console.log(`[Diagnostic] Filtered data for ${role}: ${filtered.length} rows`);

                const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
                const sorted = filtered.sort((a, b) => {
                    const pA = priorityOrder[a.priority] || 5;
                    const pB = priorityOrder[b.priority] || 5;
                    if (pA !== pB) return pA - pB;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
                setBroadcasts(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch broadcasts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();

        const channel = supabase
            .channel('broadcasts-realtime-v3')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                const newB = payload.new as Broadcast;
                if (newB.is_active && (newB.audience?.toLowerCase() === role.toLowerCase() || newB.audience?.toLowerCase() === 'both')) {
                    if (!newB.expires_at || new Date(newB.expires_at) > new Date()) {
                        setBroadcasts(prev => {
                            const combined = [newB, ...prev];
                            const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
                            return combined.sort((a, b) => {
                                const pA = priorityOrder[a.priority] || 5;
                                const pB = priorityOrder[b.priority] || 5;
                                if (pA !== pB) return pA - pB;
                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            });
                        });
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [role]);

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'Critical':
                return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/20 ring-2 ring-red-500/50';
            case 'High':
                return 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/10';
            case 'Medium':
                return 'bg-blue-500 text-white border-blue-600';
            case 'Low':
            default:
                return 'bg-slate-500 text-white border-slate-600';
        }
    };

    if (loading && broadcasts.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="minimal-card p-8 animate-pulse bg-brand-secondary/5 h-48 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (broadcasts.length === 0) {
        return (
            <div className="minimal-card p-16 text-center border-dashed border-brand-secondary/10 bg-transparent rounded-3xl">
                <ShieldCheck className="w-12 h-12 text-brand-secondary/5 mx-auto mb-4" />
                <h4 className="text-xl font-black text-brand-secondary/20 uppercase tracking-tight">System Status: All Clear</h4>
                <p className="text-[10px] font-black tracking-widest text-brand-secondary/10 uppercase mt-2">Zero active alerts in the current perimeter</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnimatePresence>
                    {broadcasts.map((broadcast, i) => (
                        <motion.div
                            key={broadcast.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.1 }}
                            className={`minimal-card p-8 bg-white border-brand-secondary/5 hover:shadow-2xl transition-all duration-500 group relative flex flex-col ${broadcast.priority === 'Critical' ? 'border-red-100 ring-1 ring-red-500/10' : ''}`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border ${getPriorityStyles(broadcast.priority)}`}>
                                    {broadcast.priority === 'Critical' ? <AlertTriangle size={14} /> :
                                        broadcast.priority === 'High' ? <Megaphone size={14} /> :
                                            broadcast.priority === 'Medium' ? <Bell size={14} /> : <Info size={14} />}
                                    {broadcast.priority} PRIORITY
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-secondary/5 border border-brand-secondary/5 rounded-full text-[9px] font-black text-brand-secondary/60 uppercase tracking-widest group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 group-hover:text-brand-secondary transition-all duration-500">
                                    <Clock size={12} className="text-brand-secondary/40 group-hover:text-brand-secondary" />
                                    <span className="flex items-center gap-1.5">
                                        {format(new Date(broadcast.created_at), 'MMM dd')}
                                        <span className="w-1 h-1 bg-brand-secondary/20 rounded-full" />
                                        {format(new Date(broadcast.created_at), 'HH:mm')}
                                    </span>
                                </div>
                            </div>

                            <h4 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase mb-4 group-hover:text-black transition-colors">
                                {broadcast.title}
                            </h4>
                            <p className="text-sm text-brand-secondary/60 leading-relaxed font-medium mb-8 line-clamp-3">
                                {broadcast.message}
                            </p>

                            <div className="mt-auto pt-6 border-t border-brand-secondary/5 flex flex-col gap-4">
                                {broadcast.address && (
                                    <button
                                        onClick={() => {
                                            if (broadcast.location_lat && broadcast.location_lng) {
                                                setActiveMapBroadcast(broadcast);
                                            }
                                        }}
                                        className="group/loc flex items-center gap-3 p-4 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/5 hover:border-brand-primary/30 hover:bg-white hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className={`p-2 rounded-xl ${broadcast.priority === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20'} group-hover/loc:scale-110 transition-transform`}>
                                            <MapPin size={16} />
                                        </div>
                                        <div className="flex-1 text-left overflow-hidden">
                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mb-1">Target Coordinates</p>
                                            <p className="text-[11px] font-black text-brand-secondary uppercase truncate tracking-widest">
                                                {broadcast.address}
                                            </p>
                                        </div>
                                        {broadcast.location_lat && (
                                            <div className="px-3 h-8 bg-brand-secondary text-white rounded-lg flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover/loc:opacity-100 transition-opacity whitespace-nowrap">
                                                <Navigation size={10} />
                                                View Map
                                            </div>
                                        )}
                                    </button>
                                )}

                                <div className="flex items-center justify-between">
                                    {!broadcast.address ? (
                                        <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/20 uppercase tracking-widest italic">
                                            <div className="w-1 h-1 bg-brand-secondary/20 rounded-full animate-pulse" />
                                            Global Response Area
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[8px] font-black text-brand-secondary/20 uppercase tracking-[0.2em]">
                                            Operational Sector Active
                                        </div>
                                    )}

                                    {broadcast.expires_at && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[9px] font-black text-red-500/60 uppercase tracking-widest ml-auto animate-pulse">
                                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                                            EXPIRES: {format(new Date(broadcast.expires_at), 'MMM dd | HH:mm')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Tactical Map Modal */}
            <AnimatePresence>
                {activeMapBroadcast && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-brand-secondary/20 backdrop-blur-md"
                        onClick={() => setActiveMapBroadcast(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setActiveMapBroadcast(null)}
                                className="absolute top-6 right-6 z-[1] w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand-secondary hover:bg-brand-secondary hover:text-white transition-all shadow-xl"
                            >
                                <X size={24} />
                            </button>

                            <div className="h-[400px] w-full relative">
                                <MapContainer
                                    center={[activeMapBroadcast.location_lat!, activeMapBroadcast.location_lng!]}
                                    zoom={15}
                                    zoomControl={false}
                                    style={{ height: "100%", width: "100%" }}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[activeMapBroadcast.location_lat!, activeMapBroadcast.location_lng!]} />
                                    <ZoomControl position="bottomright" />
                                </MapContainer>
                            </div>

                            <div className="p-8 bg-white flex items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Active Intelligence Point</p>
                                    </div>
                                    <h5 className="text-xl font-black text-brand-secondary uppercase tracking-tight">{activeMapBroadcast.address}</h5>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${activeMapBroadcast.location_lat},${activeMapBroadcast.location_lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-8 py-4 bg-brand-secondary text-white rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all shadow-xl shadow-brand-secondary/20"
                                >
                                    <Navigation size={14} />
                                    Open in Maps
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
