import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Radio, AlertTriangle, Megaphone,
    Users, Shield, Briefcase, Clock,
    BarChart3, History, Trash2, CheckCircle2,
    Calendar, Bell, Eye, Info, MapPin
} from 'lucide-react';
import { useOperations } from '../../hooks/useOperations';
import { Broadcast, Department } from '../../types/reports';
import { format } from 'date-fns';

type TabType = 'create' | 'active' | 'scheduled' | 'expired' | 'analytics' | 'history';

export const BroadcastCenter: React.FC = () => {
    const { broadcasts, departments, createBroadcast, deleteBroadcast, loading, activityLogs } = useOperations();
    const [activeTab, setActiveTab] = useState<TabType>('create');

    // Form State
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState<'Citizen' | 'Worker' | 'Both'>('Both');
    const [targetDept, setTargetDept] = useState<string>('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [scheduledAt, setScheduledAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [address, setAddress] = useState('');
    const [locationLat, setLocationLat] = useState<number | null>(null);
    const [locationLng, setLocationLng] = useState<number | null>(null);
    const [isGeotagging, setIsGeotagging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGeotag = () => {
        setIsGeotagging(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocationLat(pos.coords.latitude);
                    setLocationLng(pos.coords.longitude);
                    setIsGeotagging(false);
                },
                (err) => {
                    console.error(err);
                    setIsGeotagging(false);
                    alert("Failed to get location.");
                }
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createBroadcast({
                title,
                message,
                audience: targetRole,
                target_department_id: targetDept || null,
                priority,
                scheduled_at: scheduledAt || null,
                expires_at: expiresAt || null,
                location_lat: locationLat,
                location_lng: locationLng,
                address: address || null
            });
            // Reset form
            setTitle(''); setMessage(''); setTargetRole('Both');
            setTargetDept(''); setPriority('Medium');
            setScheduledAt(''); setExpiresAt('');
            setAddress(''); setLocationLat(null); setLocationLng(null);
            setActiveTab('active');
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeBroadcasts = useMemo(() =>
        broadcasts.filter(b => b.is_active && (!b.scheduled_at || new Date(b.scheduled_at) <= new Date())),
        [broadcasts]);

    const scheduledBroadcasts = useMemo(() =>
        broadcasts.filter(b => b.is_active && b.scheduled_at && new Date(b.scheduled_at) > new Date()),
        [broadcasts]);

    const expiredBroadcasts = useMemo(() =>
        broadcasts.filter(b => !b.is_active || (b.expires_at && new Date(b.expires_at) < new Date())),
        [broadcasts]);

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: 'create', label: 'Create', icon: Send },
        { id: 'active', label: 'Active', icon: Radio },
        { id: 'scheduled', label: 'Scheduled', icon: Calendar },
        { id: 'expired', label: 'Expired', icon: Clock },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'history', label: 'Logs', icon: History },
    ];

    return (
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 border-b border-brand-secondary/5 pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-secondary rounded-xl shadow-lg shadow-brand-secondary/20">
                            <Radio className="w-6 h-6 text-brand-primary animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Broadcast Center</h2>
                            <p className="text-brand-secondary/40 text-[10px] font-black uppercase tracking-widest mt-1">Strategic Command & Control Link</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex bg-brand-secondary/5 p-1.5 rounded-3xl mb-8 border border-brand-secondary/5 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-secondary text-white shadow-xl' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.id === 'active' && activeBroadcasts.length > 0 && (
                            <span className="ml-1 w-4 h-4 bg-brand-primary text-brand-secondary rounded-full flex items-center justify-center text-[8px]">
                                {activeBroadcasts.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {/* CREATE TAB */}
                    {activeTab === 'create' && (
                        <motion.div key="create" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="minimal-card p-10 bg-white">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Broadcast Title</label>
                                            <input
                                                type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                                placeholder="Enter broadcast subject..."
                                                className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-5 py-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 font-bold"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Target Audience</label>
                                                <select
                                                    value={targetRole} onChange={e => setTargetRole(e.target.value as any)}
                                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold appearance-none"
                                                >
                                                    <option value="Both">ALL USERS</option>
                                                    <option value="Citizen">CITIZENS ONLY</option>
                                                    <option value="Worker">WORKERS ONLY</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Priority Level</label>
                                                <select
                                                    value={priority} onChange={e => setPriority(e.target.value as any)}
                                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold appearance-none"
                                                >
                                                    <option value="Low">LOW</option>
                                                    <option value="Medium">MEDIUM</option>
                                                    <option value="High">HIGH</option>
                                                    <option value="Critical">CRITICAL</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Schedule Time (Optional)</label>
                                                <input
                                                    type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Expiry Time (Optional)</label>
                                                <input
                                                    type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">In-Situ Geotagging</label>
                                                <button
                                                    type="button"
                                                    onClick={handleGeotag}
                                                    className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${locationLat ? 'text-green-600' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}
                                                >
                                                    <MapPin size={10} />
                                                    {isGeotagging ? 'Triangulating...' : locationLat ? 'Signal Locked' : 'Enable Geotag'}
                                                </button>
                                            </div>
                                            <input
                                                type="text" value={address} onChange={e => setAddress(e.target.value)}
                                                placeholder="Deployment address or landmark..."
                                                className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-5 py-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 font-bold"
                                            />
                                            {locationLat && (
                                                <p className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest mt-1">
                                                    Coordinates: {locationLat.toFixed(4)}, {locationLng?.toFixed(4)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 flex flex-col">
                                        <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Message Content</label>
                                        <textarea
                                            required rows={8}
                                            value={message} onChange={e => setMessage(e.target.value)}
                                            placeholder="Detailed broadcast payload..."
                                            className="w-full h-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-5 py-5 rounded-3xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 resize-none font-medium leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                    disabled={isSubmitting} type="submit"
                                    className="w-full flex items-center justify-center gap-4 py-6 bg-brand-secondary text-white font-black uppercase tracking-[0.3em] text-xs rounded-3xl shadow-xl shadow-brand-secondary/10 hover:opacity-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Transmitting...' : 'Execute Tactical Broadcast'}
                                    <Send size={16} />
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {/* LIST TABS (Active, Scheduled, Expired) */}
                    {(activeTab === 'active' || activeTab === 'scheduled' || activeTab === 'expired') && (
                        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            {(activeTab === 'active' ? activeBroadcasts : activeTab === 'scheduled' ? scheduledBroadcasts : expiredBroadcasts).length > 0 ? (
                                (activeTab === 'active' ? activeBroadcasts : activeTab === 'scheduled' ? scheduledBroadcasts : expiredBroadcasts).map(b => (
                                    <BroadcastCard key={b.id} broadcast={b} onDelete={() => deleteBroadcast(b.id)} />
                                ))
                            ) : (
                                <div className="minimal-card p-20 text-center border-dashed border-brand-secondary/10 rounded-3xl flex flex-col items-center justify-center">
                                    <Radio className="w-12 h-12 text-brand-secondary/5 mb-4" />
                                    <h3 className="text-xl font-black text-brand-secondary/20 uppercase tracking-tighter">No signals detected in this spectrum</h3>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Logs', value: broadcasts.length, icon: Radio },
                                    { label: 'Active Links', value: activeBroadcasts.length, icon: Bell },
                                    { label: 'Total Reach', value: broadcasts.reduce((acc, b) => acc + (b.reads?.[0]?.count || 0), 0), icon: Users },
                                    { label: 'Engagement Rate', value: '78.4%', icon: BarChart3 },
                                ].map((stat, i) => (
                                    <div key={i} className="minimal-card p-6 bg-white">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-2 bg-brand-secondary/5 rounded-xl border border-brand-secondary/10">
                                                <stat.icon size={18} className="text-brand-secondary" />
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-brand-secondary tracking-tight">{stat.value}</h4>
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="minimal-card p-8 bg-white overflow-hidden">
                                <h3 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mb-6 border-b border-brand-secondary/5 pb-4">Engagment Vector Matrix</h3>
                                <div className="h-[300px] flex items-center justify-center bg-brand-secondary/5 rounded-3xl border border-brand-secondary/5 border-dashed">
                                    <p className="text-[11px] font-black text-brand-secondary/20 uppercase tracking-widest italic">Temporal dataset visualization processing...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="minimal-card bg-white overflow-hidden border border-brand-secondary/5 rounded-3xl">
                            <div className="p-6 border-b border-brand-secondary/5 bg-brand-secondary/[0.02]">
                                <h3 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">System Audit Log // Broadcast Spectrum</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-brand-secondary/5">
                                            <th className="px-6 py-4 text-[9px] font-black text-brand-secondary uppercase tracking-widest">Timestamp</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-brand-secondary uppercase tracking-widest">Admin</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-brand-secondary uppercase tracking-widest">Action</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-brand-secondary uppercase tracking-widest">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-secondary/5">
                                        {activityLogs.filter(log => log.target_type === 'BROADCAST').map(log => (
                                            <tr key={log.id} className="hover:bg-brand-secondary/[0.01] transition-colors">
                                                <td className="px-6 py-4 text-[10px] font-bold text-brand-secondary/40">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-secondary/10 flex items-center justify-center text-[8px] font-black text-brand-secondary">
                                                            {log.admin?.full_name?.[0] || 'A'}
                                                        </div>
                                                        <span className="text-[10px] font-black text-brand-secondary">{log.admin?.full_name || 'Admin'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[9px] font-mono text-brand-secondary/30">{log.target_id?.slice(0, 8)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

const BroadcastCard: React.FC<{ broadcast: Broadcast; onDelete: () => void }> = ({ broadcast, onDelete }) => {
    const priorityConfig = {
        Low: { color: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: Info },
        Medium: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Bell },
        High: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: Megaphone },
        Critical: { color: 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-600/10 ring-2 ring-red-500/50', icon: AlertTriangle },
    };

    const config = priorityConfig[broadcast.priority];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="minimal-card p-6 bg-white hover:border-brand-secondary/20 transition-all border border-brand-secondary/5 group">
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${config.color} flex items-center gap-1.5`}>
                            <config.icon size={10} />
                            {broadcast.priority} PRIORITY
                        </span>
                        <span className="px-3 py-1 bg-brand-secondary/5 text-brand-secondary/40 text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-secondary/5">
                            Target: {broadcast.audience.toUpperCase()}
                        </span>
                        {broadcast.target_department_id && (
                            <span className="px-3 py-1 bg-brand-secondary/5 text-brand-secondary/40 text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-secondary/5">
                                DEPT: {broadcast.target_department_id.slice(0, 8)}
                            </span>
                        )}
                        {broadcast.scheduled_at && (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                                Scheduled: {format(new Date(broadcast.scheduled_at), 'MMM dd, HH:mm')}
                            </span>
                        )}
                        {broadcast.address && (
                            <span className="px-3 py-1 bg-brand-secondary/5 text-brand-secondary/60 text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-secondary/5 flex items-center gap-1">
                                <MapPin size={10} />
                                {broadcast.address}
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-black text-brand-secondary tracking-tight mb-1">{broadcast.title}</h3>
                        <p className="text-sm text-brand-secondary/60 leading-relaxed">{broadcast.message}</p>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-brand-secondary/5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                            <Calendar size={12} className="text-brand-secondary/20" />
                            {format(new Date(broadcast.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                            <Eye size={12} className="text-brand-secondary/20" />
                            {broadcast.reads?.[0]?.count || 0} READS
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-5 h-5 rounded-full bg-brand-secondary/10 flex items-center justify-center text-[8px] font-black text-brand-secondary">
                                {broadcast.author?.full_name?.[0] || 'A'}
                            </div>
                            BY {broadcast.author?.full_name?.split(' ')[0] || 'ADMIN'}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={onDelete} className="p-3 text-brand-secondary/20 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl">
                        <Trash2 size={18} />
                    </button>
                    {broadcast.is_active && (
                        <div className="p-3 text-brand-primary animate-pulse">
                            <Radio size={18} />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
