import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target, Clock, MapPin, Zap, ArrowLeft,
    Camera, CheckSquare, Eye, FileSearch, Trash2, Send, Save, CheckCircle, Lock,
    LayoutDashboard, Globe, FileText, Bell, Award
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { useMicrotasks, Microtask, MicrotaskResponse } from '../hooks/useMicrotasks';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
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

const citizenNavItems = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/reports', icon: Globe },
    { label: 'My Report', path: '/citizen/reports', icon: FileText },
    { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
    { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
    { label: 'Rewards', path: '/citizen/rewards', icon: Award },
];

const TASK_TYPE_CONFIG = {
    image: { label: 'Ground Photo', icon: Camera, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    poll: { label: 'Quick Survey', icon: CheckSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    report_review: { label: 'Audit Mission', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    future_inspection: { label: 'Site Check', icon: FileSearch, color: 'text-green-500', bg: 'bg-green-500/10' },
};

export const CitizenMicroTaskDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { fetchTaskById, submitResponse, getMyResponse } = useMicrotasks('citizen');

    const [task, setTask] = useState<Microtask | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Submission form
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const loadTask = useCallback(async () => {
        if (!id) return;
        const data = await fetchTaskById(id);
        setTask(data);
        setLoading(false);
    }, [id, fetchTaskById]);

    useEffect(() => {
        loadTask();
    }, [loadTask]);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleResponseSubmit = async () => {
        if (!task || !profile) return;
        if (task.task_type === 'image' && !file) return setError('Please upload an image.');
        if (task.task_type === 'poll' && !content) return setError('Please select an option.');
        if (task.task_type === 'report_review' && !content) return setError('Please provide your feedback.');

        setSubmitting(true);
        setError('');
        try {
            let image_url = null;
            if (file) {
                const fName = `microtask/${task.id}/${profile.id}_${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage.from('issue-images').upload(fName, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('issue-images').getPublicUrl(fName);
                image_url = publicUrl;
            }

            await submitResponse(task.id, profile.id, {
                response_type: task.task_type === 'image' ? 'image' : task.task_type === 'poll' ? 'poll_choice' : 'text',
                content: content,
                image_url: image_url
            });

            setSuccess(true);
            loadTask();
        } catch (err: any) {
            setError(err.message || 'Submission failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <MinimalLayout navItems={citizenNavItems} title="Loading Mission..."><div className="p-20 text-center animate-pulse">Loading mission details...</div></MinimalLayout>;
    if (!task) return <MinimalLayout navItems={citizenNavItems} title="Error"><div className="p-20 text-center">Mission not found. <Link to="/citizen/micro-tasks" className="text-brand-primary font-bold">Return to Missions</Link></div></MinimalLayout>;

    const myResp = profile ? getMyResponse(task, profile.id) : null;
    const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.image;
    const Icon = typeConf.icon;
    const isOverdue = task.status === 'overdue' || (task.end_time && new Date(task.end_time) < new Date());
    const isClosed = task.status === 'closed' || isOverdue;

    return (
        <MinimalLayout navItems={citizenNavItems} title={`Mission Detail: ${task.title}`}>
            <div className="max-w-5xl mx-auto space-y-8 px-4 md:px-8 pb-32">

                {/* Back Button */}
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-all">
                    <ArrowLeft size={14} /> Back to Missions
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* LEFT: MISSION DETAILS */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="minimal-card p-10 bg-white shadow-2xl relative overflow-hidden">
                            {/* Decorative background target icon */}
                            <Target className="absolute -bottom-10 -right-10 text-brand-secondary/5 rotate-12" size={240} />

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${typeConf.bg} ${typeConf.color}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${typeConf.color}`}>
                                        {typeConf.label}
                                    </span>
                                </div>

                                <h1 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter leading-none">{task.title}</h1>
                                <p className="text-lg text-brand-secondary/60 font-medium leading-relaxed">{task.description}</p>

                                <div className="flex items-center gap-8 pt-8 border-t border-brand-secondary/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">Rewards</p>
                                        <div className="px-5 py-2 bg-amber-500 text-white rounded-2xl flex items-center gap-2 font-black text-lg">
                                            <Zap size={18} fill="white" /> {task.points} <span className="text-[10px] opacity-70">PTS</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">Time Remaining</p>
                                        <div className="flex items-center gap-2 text-brand-secondary/80 font-black uppercase text-sm">
                                            <Clock size={16} /> {isOverdue ? 'Expired' : task.end_time ? format(new Date(task.end_time), 'MMM dd, HH:mm') : 'No Limit'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* RESPONSE AREA */}
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight flex items-center gap-2">
                                Your Action Required
                                {myResp && <CheckCircle className="text-green-500" size={20} />}
                            </h3>

                            {myResp ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="minimal-card p-10 border-2 border-green-500/10 bg-green-50/20">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-lg font-black text-green-600 uppercase tracking-tighter">Response Submitted!</h4>
                                            <p className="text-[10px] font-black text-green-600/50 uppercase tracking-widest mt-1">Pending Admin Review</p>
                                        </div>
                                        {myResp.approved && (
                                            <div className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-bounce">
                                                +{myResp.points_awarded} Points Earned
                                            </div>
                                        )}
                                        {myResp.rejected && (
                                            <div className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                Needs Correction
                                            </div>
                                        )}
                                    </div>

                                    {myResp.image_url && <img src={myResp.image_url} className="w-full h-64 object-cover rounded-[32px] mt-8" />}
                                    {myResp.content && <p className="mt-6 p-6 bg-white rounded-2xl italic text-brand-secondary/70 font-medium">"{myResp.content}"</p>}
                                    {myResp.admin_note && <div className="mt-6 p-5 bg-red-500/5 border border-red-500/10 text-red-600 font-bold text-xs uppercase tracking-tight rounded-xl">Reason for rejection: {myResp.admin_note}</div>}
                                </motion.div>
                            ) : isClosed ? (
                                <div className="minimal-card p-20 text-center bg-brand-secondary/5 border-brand-secondary/5 border-2 border-dashed">
                                    <Lock size={40} className="mx-auto text-brand-secondary/10 mb-4" />
                                    <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">This mission is no longer accepting responses</p>
                                </div>
                            ) : (
                                <div className="minimal-card p-10 space-y-8 bg-white border-2 border-brand-secondary/5">
                                    {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase">{error}</div>}

                                    {task.task_type === 'image' && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col items-center justify-center border-4 border-dashed border-brand-secondary/5 rounded-[40px] p-20 hover:border-brand-primary/20 transition-all group relative overflow-hidden backdrop-blur-sm bg-brand-secondary/[0.01]">
                                                {preview ? (
                                                    <div className="absolute inset-0">
                                                        <img src={preview} className="w-full h-full object-cover p-2 rounded-[40px]" />
                                                        <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-6 right-6 p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform">
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Camera size={48} className="text-brand-secondary/10 group-hover:text-brand-primary/40 group-hover:scale-110 transition-all duration-500" />
                                                        <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-[0.2em] mt-6 text-center group-hover:text-brand-secondary/40">Upload high-res photo proof</p>
                                                        <input type="file" accept="image/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest text-center px-10">Make sure the location is clearly visible and lighting is sufficient for ground verification.</p>
                                        </div>
                                    )}

                                    {task.task_type === 'poll' && (
                                        <div className="grid grid-cols-1 gap-4">
                                            {task.poll_options?.map(opt => (
                                                <button key={opt} onClick={() => setContent(opt)} className={`p-6 rounded-[28px] border-2 text-left transition-all ${content === opt ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-xl scale-[1.02]' : 'border-brand-secondary/5 hover:border-brand-secondary/10'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${content === opt ? 'border-purple-500' : 'border-brand-secondary/10'}`}>
                                                            {content === opt && <div className="w-3 h-3 bg-purple-500 rounded-full" />}
                                                        </div>
                                                        <span className="font-black uppercase tracking-tight text-sm">{opt}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {(task.task_type === 'report_review' || task.task_type === 'future_inspection') && (
                                        <textarea
                                            placeholder="Enter your detailed report / audit findings here..."
                                            value={content}
                                            onChange={e => setContent(e.target.value)}
                                            className="input-field min-h-[200px] resize-none p-6 font-medium"
                                        />
                                    )}

                                    <button
                                        disabled={submitting}
                                        onClick={handleResponseSubmit}
                                        className="w-full p-8 bg-brand-secondary text-white rounded-[32px] font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-secondary/90 transition-all shadow-2xl shadow-brand-secondary/20 flex items-center justify-center gap-4 disabled:opacity-50"
                                    >
                                        {submitting ? <Clock className="animate-spin" size={20} /> : <Save size={20} />}
                                        {submitting ? 'Transmitting...' : 'Upload Ground Data'}
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT: MAP */}
                    <div className="space-y-8">
                        <section className="minimal-card p-0 overflow-hidden aspect-square shadow-xl border-4 border-white">
                            {task.latitude && task.longitude ? (
                                <MapContainer center={[task.latitude, task.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[task.latitude, task.longitude]} />
                                </MapContainer>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-brand-secondary/5 text-brand-secondary/10 p-10 text-center">
                                    <MapPin size={40} className="mb-4 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest uppercase">General Area - No Exact PIN</p>
                                </div>
                            )}
                        </section>

                        <div className="minimal-card p-8 bg-brand-secondary text-white shadow-2xl">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">Mission Stats</h4>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-white/50">Recruits</span>
                                    <span className="font-black text-xl">{task.response_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-white/50">Difficulty</span>
                                    <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase">Standard</span>
                                </div>
                            </div>
                        </div>

                        {task.address && (
                            <div className="minimal-card p-8 border-brand-secondary/5">
                                <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin size={12} /> Target Location
                                </p>
                                <p className="text-sm font-black text-brand-secondary leading-tight uppercase tracking-tighter">{task.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Overlay */}
            {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-brand-secondary/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-green-500/40 mb-8">
                        <CheckCircle size={48} className="text-white" />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">Ground Proof Received</h2>
                    <p className="text-lg text-white/60 font-medium mb-10">Your mission data has been transmitted to Central Command.</p>
                    <button onClick={() => setSuccess(false)} className="px-10 py-5 bg-white text-brand-secondary rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Continue Operations</button>
                </motion.div>
            )}
        </MinimalLayout>
    );
};
