import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, ClipboardCheck, Shield, Target, Radio, BarChart3,
    ChevronLeft, Clock, MapPin, Users,
    CheckCircle2, XCircle, Send, Lock, Zap, ArrowLeft
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems as centralNavItems } from '../constants/adminNav';
import { useMicrotasks, Microtask, MicrotaskResponse } from '../hooks/useMicrotasks';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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
    image: { label: 'Photo Evidence', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    poll: { label: 'Poll / Survey', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    report_review: { label: 'Report Review', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    future_inspection: { label: 'Future Inspection', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

const STATUS_CONFIG = {
    open: { label: 'Open', color: 'bg-green-500/10 text-green-600 border-green-500/20', dot: 'bg-green-500' },
    closed: { label: 'Closed', color: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20', dot: 'bg-brand-secondary' },
    overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-600 border-red-500/20', dot: 'bg-red-500' },
};

export const AdminMicroTaskDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchTaskById, approveResponse, rejectResponse, closeTask } = useMicrotasks('admin');
    const [task, setTask] = useState<Microtask | null>(null);
    const [loading, setLoading] = useState(true);
    const [rejectNote, setRejectNote] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const loadTask = useCallback(async () => {
        if (!id) return;
        const data = await fetchTaskById(id);
        setTask(data);
        setLoading(false);
    }, [id, fetchTaskById]);

    useEffect(() => {
        loadTask();
    }, [loadTask]);

    if (loading) return <MinimalLayout navItems={adminNavItems} title="Loading Mission..."><div className="p-20 text-center animate-pulse">Loading mission details...</div></MinimalLayout>;
    if (!task) return <MinimalLayout navItems={adminNavItems} title="Error"><div className="p-20 text-center">Mission not found. <Link to="/admin/micro-tasks" className="text-brand-primary">Go back</Link></div></MinimalLayout>;

    const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.image;
    const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.open;
    const responses = task.responses || [];
    const isCloseable = task.status === 'open';

    // Poll analytics
    const pollCounts: Record<string, number> = {};
    if (task.task_type === 'poll' && task.poll_options) {
        task.poll_options.forEach(opt => { pollCounts[opt] = 0; });
        responses.forEach(r => { if (r.content && pollCounts[r.content] !== undefined) pollCounts[r.content]++; });
    }
    const totalVotes = Object.values(pollCounts).reduce((a, b) => a + b, 0);

    const handleApprove = async (responseId: string) => {
        await approveResponse(responseId, task.points);
        loadTask();
    };

    const handleReject = async (responseId: string) => {
        await rejectResponse(responseId, rejectNote);
        setRejectingId(null);
        setRejectNote('');
        loadTask();
    };

    const handleCloseTask = async () => {
        await closeTask(task.id);
        loadTask();
    };

    return (
        <MinimalLayout navItems={adminNavItems} title={`Mission Control: ${task.title}`}>
            <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-8 pb-32">

                {/* Back Link */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-all">
                    <ArrowLeft size={14} /> Back to Hub
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* LEFT COL: DETAILS */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="minimal-card p-10 bg-white shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusConf.color} flex items-center gap-2`}>
                                    <div className={`w-2 h-2 rounded-full ${statusConf.dot}`} /> {statusConf.label}
                                </span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${typeConf.color}`}>
                                        {typeConf.label}
                                    </span>
                                    <h1 className="text-4xl font-black text-brand-secondary tracking-tighter mt-4 leading-none uppercase">{task.title}</h1>
                                    <p className="text-lg text-brand-secondary/50 font-medium mt-4 max-w-2xl">{task.description}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-brand-secondary/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Rewards</p>
                                        <p className="text-xl font-black text-brand-secondary flex items-center gap-2">
                                            <Zap size={18} className="text-amber-500" /> {task.points} <span className="text-sm opacity-30">PTS</span>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Responses</p>
                                        <p className="text-xl font-black text-brand-secondary flex items-center gap-2">
                                            <Users size={18} className="text-blue-500" /> {responses.length}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">Deadline</p>
                                        <p className="text-xl font-black text-brand-secondary flex items-center gap-2">
                                            <Clock size={18} className="text-purple-500" /> {task.end_time ? format(new Date(task.end_time), 'MMM dd, HH:mm') : 'No Deadline'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SUBMISSIONS */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight flex items-center gap-2">
                                Citizen Submissions
                                {responses.filter(r => !r.approved && !r.rejected).length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">{responses.filter(r => !r.approved && !r.rejected).length} NEW</span>
                                )}
                            </h3>

                            <div className="space-y-4">
                                {responses.length === 0 ? (
                                    <div className="minimal-card p-20 text-center border-dashed border-brand-secondary/10">
                                        <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">No submissions yet reported on ground</p>
                                    </div>
                                ) : (
                                    responses.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()).map((resp) => (
                                        <div key={resp.id} className={`minimal-card p-6 border-l-4 ${resp.approved ? 'border-l-green-400 bg-green-50/20' : resp.rejected ? 'border-l-red-400 bg-red-50/20' : 'border-l-blue-400'}`}>
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 flex items-center justify-center font-black text-brand-secondary text-lg overflow-hidden shrink-0 shadow-inner">
                                                        {resp.citizen?.avatar_url ? <img src={resp.citizen.avatar_url} className="w-full h-full object-cover" /> : (resp.citizen?.full_name?.[0] || 'C')}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-brand-secondary uppercase tracking-tight">{resp.citizen?.full_name || 'Anonymous Citizen'}</p>
                                                        <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">{format(new Date(resp.submitted_at), 'MMM dd, yyyy HH:mm')}</p>
                                                    </div>
                                                </div>

                                                {!resp.approved && !resp.rejected && isCloseable && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {rejectingId === resp.id ? (
                                                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                                                <input
                                                                    value={rejectNote}
                                                                    onChange={e => setRejectNote(e.target.value)}
                                                                    placeholder="Reason..."
                                                                    className="flex-1 sm:w-48 px-4 py-2.5 text-xs border border-brand-secondary/10 rounded-xl outline-none focus:border-brand-secondary/30"
                                                                />
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => handleReject(resp.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"><Send size={16} /></button>
                                                                    <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="w-10 h-10 border border-brand-secondary/10 text-brand-secondary/40 rounded-xl flex items-center justify-center hover:bg-brand-secondary/5"><ArrowLeft size={16} /></button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleApprove(resp.id)} className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 bg-green-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 whitespace-nowrap">
                                                                    <CheckCircle2 size={14} /> Approve
                                                                </button>
                                                                <button onClick={() => setRejectingId(resp.id)} className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 border border-red-300 text-red-500 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all whitespace-nowrap">
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {(resp.approved || resp.rejected) && (
                                                    <div className={`w-fit px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${resp.approved ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                                                        {resp.approved ? <><CheckCircle2 size={14} /> Accepted +{resp.points_awarded}pts</> : <><XCircle size={14} /> Rejected</>}
                                                    </div>
                                                )}
                                            </div>

                                            {resp.image_url && (
                                                <div className="mt-6 rounded-2xl overflow-hidden border border-brand-secondary/5 shadow-inner">
                                                    <img src={resp.image_url} className="w-full h-[400px] object-cover" />
                                                </div>
                                            )}

                                            {resp.content && (
                                                <div className="mt-4 p-5 bg-white rounded-2xl border border-brand-secondary/5 text-brand-secondary/70 text-sm font-medium italic leading-relaxed shadow-sm">
                                                    "{resp.content}"
                                                </div>
                                            )}

                                            {resp.admin_note && (
                                                <div className="mt-4 p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest">
                                                    Rejection Reason: {resp.admin_note}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COL: MAP & ACTION */}
                    <div className="space-y-6">

                        {/* Map */}
                        <div className="minimal-card p-0 overflow-hidden shadow-xl aspect-square">
                            {task.latitude && task.longitude ? (
                                <MapContainer center={[task.latitude, task.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[task.latitude, task.longitude]} />
                                </MapContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-brand-secondary/5 text-brand-secondary/20 p-10 text-center">
                                    <MapPin size={40} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No target location assigned to this mission</p>
                                </div>
                            )}
                        </div>

                        {/* Poll Analytics */}
                        {task.task_type === 'poll' && (
                            <div className="minimal-card p-6 border-purple-200">
                                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6">Live Poll Analytics</h4>
                                <div className="space-y-5">
                                    {task.poll_options?.map(opt => {
                                        const count = pollCounts[opt] || 0;
                                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                        return (
                                            <div key={opt} className="space-y-2">
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-secondary/60">
                                                    <span>{opt}</span>
                                                    <span>{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-brand-secondary/5 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-purple-500 rounded-full" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Admin Action */}
                        {isCloseable && (
                            <button
                                onClick={() => { if (window.confirm('Archive this mission? Citizens will no longer be able to respond.')) handleCloseTask(); }}
                                className="w-full p-6 bg-brand-secondary text-white rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-brand-secondary/90 transition-all shadow-2xl shadow-brand-secondary/20 flex flex-col items-center gap-2 group"
                            >
                                <Lock size={20} className="group-hover:scale-110 transition-transform" />
                                <span>Archive Mission</span>
                                <span className="text-[8px] opacity-40 font-bold lowercase tracking-normal -mt-1">Stops all incoming responses</span>
                            </button>
                        )}

                        {!isCloseable && (
                            <div className="minimal-card p-6 bg-brand-secondary/5 text-center flex flex-col items-center gap-2">
                                <Lock size={20} className="text-brand-secondary/30" />
                                <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">This Mission is Closed</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};
