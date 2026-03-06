import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Target, Image as ImageIcon, BarChart2, ClipboardCheck,
    Clock, Eye, MapPin, Zap, Users, RefreshCcw,
    Award, ChevronRight, AlertTriangle, Lock,
    LayoutDashboard, Shield, Radio, BarChart3, Trophy,
    MessageSquare, Send, Sparkles, Camera, X
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems as centralNavItems } from '../constants/adminNav';
import { useMicrotasks, Microtask } from '../hooks/useMicrotasks';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow, isPast } from 'date-fns';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const adminNavItems = centralNavItems;

const TASK_TYPE_CONFIG = {
    image: { label: 'Photo Evidence', icon: ImageIcon, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    poll: { label: 'Poll / Survey', icon: BarChart2, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    report_review: { label: 'Report Review', icon: ClipboardCheck, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    future_inspection: { label: 'Site Visit', icon: Eye, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-green-500/10 text-green-600 border-green-500/20', dot: 'bg-green-500' },
    closed: { label: 'Closed', color: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20', dot: 'bg-brand-secondary' },
    overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-600 border-red-500/20', dot: 'bg-red-500' },
};

export const AdminMicroTaskPage: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { tasks, loading, leaderboard, createTask, fetchTasks } = useMicrotasks('admin');

    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const openTasks = tasks.filter(t => t.status === 'open');
    const closedTasks = tasks.filter(t => t.status !== 'open');
    const displayTasks = activeTab === 'open' ? openTasks : closedTasks;

    const totalResponses = tasks.reduce((s, t) => s + (t.response_count || 0), 0);

    return (
        <MinimalLayout navItems={adminNavItems} title="Micro-Task Command">
            <div className="max-w-7xl mx-auto space-y-10 px-4 md:px-8 pb-32">

                {/* ── HERO BANNER ── */}
                <section className="relative overflow-hidden rounded-[40px] bg-brand-secondary p-10 text-white shadow-2xl">
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                        {Array.from({ length: 60 }).map((_, i) => (
                            <div key={i} className="inline-block w-12 h-12 border border-white/20 text-[8px] font-black flex items-center justify-center">{(Math.random() * 99).toFixed(0)}</div>
                        ))}
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-widest">
                                <Target size={12} className="text-brand-primary" /> Micro-Task Command Center
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter">Civic Intelligence Network</h1>
                            <p className="text-white/50 font-bold text-sm max-w-xl">Deploy micro-tasks to citizens for ground-level data collection. Monitor responses, award points, and build the Civic Hero leaderboard.</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="shrink-0 flex items-center gap-3 px-8 py-4 bg-brand-primary text-brand-secondary rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                            <Plus size={20} /> Deploy Task
                        </button>
                    </div>
                </section>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Open Tasks', value: openTasks.length, icon: Zap, color: 'text-green-500' },
                        { label: 'Closed Tasks', value: closedTasks.length, icon: Lock, color: 'text-brand-secondary' },
                        { label: 'Total Responses', value: totalResponses, icon: MessageSquare, color: 'text-blue-500' },
                        { label: 'Civic Heroes', value: leaderboard.length, icon: Trophy, color: 'text-amber-500' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="minimal-card p-6 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-brand-secondary/5 flex items-center justify-center ${s.color}`}>
                                <s.icon size={22} />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-brand-secondary">{s.value}</p>
                                <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-2 bg-brand-secondary/5 p-1 rounded-2xl w-fit">
                                {[
                                    { id: 'open', label: `Active (${openTasks.length})` },
                                    { id: 'closed', label: `Closed (${closedTasks.length})` },
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-secondary text-white shadow-lg' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => fetchTasks(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 hover:bg-brand-secondary/5 transition-all"
                            >
                                <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
                                Reload Missions
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid gap-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-brand-secondary/5 animate-pulse" />)}
                            </div>
                        ) : displayTasks.length === 0 ? (
                            <div className="minimal-card p-20 text-center flex flex-col items-center gap-4 border-dashed border-brand-secondary/10">
                                <Target size={40} className="text-brand-secondary/10" />
                                <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">No tasks in this category</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {displayTasks.map((task, i) => {
                                    const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.image;
                                    const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
                                    const pendingResponses = task.responses?.filter(r => !r.approved && !r.rejected).length || 0;
                                    return (
                                        <motion.div key={task.id}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                            className="minimal-card p-6 cursor-pointer group hover:border-brand-secondary/30 transition-all border-l-4 border-l-transparent hover:border-l-brand-primary"
                                            onClick={() => navigate(`/admin/micro-tasks/${task.id}`)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${typeConf.color}`}>
                                                    <typeConf.icon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusConf.color} flex items-center gap-1`}>
                                                            <div className={`w-1 h-1 rounded-full ${statusConf.dot} ${task.status === 'open' ? 'animate-pulse' : ''}`} />{statusConf.label}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${typeConf.color}`}>{typeConf.label}</span>
                                                        {pendingResponses > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                                                                {pendingResponses} Pending Review
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-base font-black text-brand-secondary uppercase tracking-tight line-clamp-1 group-hover:text-brand-secondary/70 transition-colors">{task.title}</h3>
                                                    <p className="text-xs text-brand-secondary/50 font-medium line-clamp-1 mt-0.5">{task.description}</p>
                                                </div>
                                                <div className="shrink-0 text-right space-y-1">
                                                    <p className="text-2xl font-black text-brand-secondary">{task.points}<span className="text-[9px] block opacity-30 -mt-1">PTS</span></p>
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                                        <Users size={10} />{task.response_count || 0} Resp.
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-brand-secondary/5">
                                                <div className="flex items-center gap-1 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                                    <Clock size={10} />
                                                    {task.end_time ? (isPast(new Date(task.end_time)) ? 'Expired' : `Ends ${formatDistanceToNow(new Date(task.end_time), { addSuffix: true })}`) : 'No deadline'}
                                                </div>
                                                {task.latitude && task.longitude && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                                        <MapPin size={10} /> Has Location
                                                    </div>
                                                )}
                                                <div className="ml-auto flex items-center gap-1 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest group-hover:text-brand-secondary transition-colors">
                                                    View Control Details <ChevronRight size={12} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── LEADERBOARD ── */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight flex items-center gap-2">
                                <Trophy size={18} className="text-amber-500" /> Civic Hero Leaderboard
                            </h3>
                            <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Top citizen contributors</p>
                        </div>
                        <div className="minimal-card p-0 overflow-hidden">
                            {leaderboard.length === 0 ? (
                                <div className="p-10 text-center text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">No heroes yet</div>
                            ) : leaderboard.slice(0, 10).map((entry, i) => (
                                <div key={entry.citizen_id} className={`flex items-center gap-3 p-4 border-b border-brand-secondary/5 last:border-0 ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-brand-secondary' : i === 2 ? 'bg-amber-700 text-white' : 'bg-brand-secondary/5 text-brand-secondary/40'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                                        {entry.citizen?.avatar_url
                                            ? <img src={entry.citizen.avatar_url} className="w-full h-full object-cover" />
                                            : (entry.citizen?.full_name?.[0] || 'C')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-brand-secondary uppercase tracking-tight truncate">{entry.citizen?.full_name || 'Anonymous'}</p>
                                        <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">{entry.level}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-brand-secondary">{entry.total_points} <span className="opacity-30 text-[8px]">pts</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showCreateModal && (
                    <AdminCreateTaskModal
                        adminId={profile?.id || ''}
                        onCreate={createTask}
                        onClose={() => setShowCreateModal(false)}
                    />
                )}
            </AnimatePresence>
        </MinimalLayout>
    );
};

/* ======== CREATE MODAL ======== */
const AdminCreateTaskModal: React.FC<{ adminId: string; onCreate: (p: Partial<Microtask>) => Promise<void>; onClose: () => void }> = ({ adminId, onCreate, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<Microtask['task_type']>('image');
    const [points, setPoints] = useState(10);
    const [endTime, setEndTime] = useState('');
    const [options, setOptions] = useState<string[]>(['Yes', 'No']); // For poll
    const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            console.log('[handleSubmit] 🚀 Deploying task with location:', location);

            // Poll validation
            if (type === 'poll') {
                const validOptions = options.filter(o => o.trim() !== '');
                if (validOptions.length < 2) {
                    setError('Poll missions require at least 2 valid options.');
                    setSubmitting(false);
                    return;
                }
            }

            const payload = {
                title, description, task_type: type, points,
                end_time: endTime ? new Date(endTime).toISOString() : null,
                poll_options: type === 'poll' ? options.filter(o => o.trim() !== '') : null,
                latitude: location?.lat,
                longitude: location?.lng,
                address: location?.address,
                created_by: adminId,
                status: 'open' as const
            };

            await onCreate(payload);
            onClose();
        } catch (err: any) {
            console.error('[handleSubmit] ❌ Error deploying task:', err);
            setError(err.message || 'Deployment failed. Please check console.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-secondary/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl max-h-[95vh] bg-white rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden overflow-y-auto md:overflow-hidden custom-scrollbar">

                {/* Left: Map Pinning */}
                <div className="w-full md:w-1/2 h-[350px] md:h-auto relative bg-brand-secondary/5 shrink-0">
                    <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <MapEvents onLocationSelect={setLocation} />
                        {location && <Marker position={[location.lat, location.lng]} />}
                    </MapContainer>
                    <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
                        <div className="bg-brand-secondary text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md bg-brand-secondary/90 border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={12} className="text-brand-primary" /> Mission Target
                            </p>
                            <p className="text-[11px] font-bold mt-1 opacity-80 leading-tight">
                                {location?.address || 'Click map to pin a ground location'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <form onSubmit={handleSubmit} className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-brand-secondary tracking-tight uppercase">Deploy Mission</h2>
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Intelligence Ground Team Deployment</p>
                        </div>
                        <button type="button" onClick={onClose} className="w-10 h-10 rounded-full border border-brand-secondary/10 flex items-center justify-center hover:bg-brand-secondary/5 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-tight flex items-center gap-3">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest px-1">Mission Identifier</label>
                            <input
                                required
                                id="mission_title"
                                name="mission_title"
                                value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Verify Road Condition: Gandhi St"
                                className="input-field py-4"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest px-1">Mission Briefing</label>
                            <textarea
                                required
                                id="mission_description"
                                name="mission_description"
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Details for citizens..."
                                className="input-field py-4 min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest px-1">Action Type</label>
                                <select value={type} required onChange={e => setType(e.target.value as any)} className="input-field py-4 font-black uppercase text-[10px] tracking-widest">
                                    <option value="image">Photo Evidence </option>
                                    <option value="poll">Poll </option>
                                    <option value="report_review">Feedback Review</option>
                                    <option value="future_inspection">Site Visit </option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest px-1">Reward Points</label>
                                <input
                                    type="number"
                                    id="mission_points"
                                    name="mission_points"
                                    value={points} onChange={e => setPoints(Number(e.target.value))}
                                    className="input-field py-4 font-black"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest px-1">Mission Deadline (Required)</label>
                            <input
                                type="datetime-local"
                                required
                                id="mission_deadline"
                                name="mission_deadline"
                                value={endTime} onChange={e => setEndTime(e.target.value)}
                                className="input-field py-4 font-black text-[10px] tracking-widest uppercase"
                            />
                        </div>

                        {type === 'poll' && (
                            <div className="space-y-4 p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Voting Options (Multi-Choice)</label>
                                    <button
                                        type="button"
                                        onClick={() => setOptions([...options, ''])}
                                        className="text-[9px] font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-lg transition-all"
                                    >
                                        <Plus size={12} /> Add Choice
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-3 group">
                                            <div className="flex-1 relative">
                                                <input
                                                    required
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...options];
                                                        newOpts[i] = e.target.value;
                                                        setOptions(newOpts);
                                                    }}
                                                    className="w-full bg-white border border-purple-500/10 text-xs font-bold text-brand-secondary px-4 py-3 rounded-xl focus:border-purple-500/40 outline-none transition-all"
                                                    placeholder={`Option ${i + 1}`}
                                                />
                                            </div>
                                            {options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                                                    className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[8px] font-black text-purple-500/40 uppercase tracking-widest px-1">At least 2 options required for a valid poll</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-10 p-6 bg-brand-secondary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-secondary/90 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-brand-secondary/20 disabled:opacity-50"
                    >
                        {submitting ? 'Transmitting...' : <><Send size={16} /> Deploy Intel Mission</>}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const MapEvents: React.FC<{ onLocationSelect: (loc: { lat: number; lng: number; address?: string }) => void }> = ({ onLocationSelect }) => {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            onLocationSelect({ lat, lng, address: 'Pinning location...' });

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                onLocationSelect({ lat, lng, address: data.display_name });
            } catch {
                onLocationSelect({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
            }
        }
    });
    return null;
};
