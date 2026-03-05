import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, MapPin, Clock, CheckCircle2,
    ShieldAlert, AlertTriangle, User,
    MessageSquare, Send, Calendar,
    ExternalLink, Tag, Activity,
    UserCheck, ChevronRight, Info,
    Camera, Download, Trash2, Edit3,
    AlertCircle, CheckCircle, Smartphone, Mail,
    FileText, Globe, Bell, Zap,
    LayoutDashboard as PlanetIcon,
    Target as TargetIcon,
    Award as AwardIcon
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInHours } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Types ---
interface Profile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
}

interface WorkerMetrics {
    worker_id: string;
    total_resolved: number;
}

interface Assignment {
    id: string;
    worker_id: string;
    deadline: string;
    is_active: boolean;
    assigned_at: string;
    worker: Profile;
    metrics?: WorkerMetrics;
}

interface Message {
    id: string;
    message_text: string;
    sender_role: string;
    sender_id: string;
    created_at: string;
    sender_profile?: Profile;
}

interface WorkProof {
    id: string;
    after_image_url: string;
    submitted_at: string;
    status: string;
}

interface IssueDetail {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    severity: number;
    priority: string;
    risk_score: number;
    image_url: string;
    latitude: number;
    longitude: number;
    address: string;
    created_at: string;
    user_id: string;
    resolved_at: string;
    reporter: Profile;
}

export const ReportDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<IssueDetail | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [proof, setProof] = useState<WorkProof | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [showAfter, setShowAfter] = useState(false);

    // --- Data Fetching ---
    const fetchData = async () => {
        if (!id) return;

        try {
            // 1. Fetch Report & Reporter
            const { data: reportData, error: reportError } = await supabase
                .from('issues')
                .select('*, reporter:profiles!user_id(*)')
                .eq('id', id)
                .single();

            if (reportError) throw reportError;
            setReport(reportData as any);

            // 2. Fetch Active Assignment & Worker Details
            const { data: assignData } = await supabase
                .from('report_assignments')
                .select('*, worker:profiles!worker_id(*)')
                .eq('report_id', id)
                .eq('is_active', true)
                .order('assigned_at', { ascending: false })
                .maybeSingle();

            if (assignData) {
                // Fetch worker metrics
                const { data: metricsData } = await supabase
                    .from('worker_metrics')
                    .select('*')
                    .eq('worker_id', assignData.worker_id)
                    .maybeSingle();

                setAssignment({ ...assignData, metrics: metricsData } as any);
            } else {
                setAssignment(null);
            }

            // 3. Fetch Tactical Comms (using report_messages table)
            const { data: messageData } = await supabase
                .from('report_messages')
                .select('*, sender_profile:profiles!sender_id(*)')
                .eq('report_id', id)
                .eq('channel', 'citizen')
                .order('created_at', { ascending: true });

            if (messageData) setMessages(messageData as any);

            // 4. Fetch Work Proof (After Image)
            const { data: proofData } = await supabase
                .from('work_proofs')
                .select('*')
                .eq('report_id', id)
                .order('submitted_at', { ascending: false })
                .maybeSingle();

            if (proofData) setProof(proofData as any);

        } catch (err) {
            console.error("Critical Error fetching report intel:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Realtime Subscriptions
        const channels = [
            supabase.channel(`report-${id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `id=eq.${id}` }, fetchData)
                .subscribe(),
            supabase.channel(`assignments-${id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'report_assignments', filter: `report_id=eq.${id}` }, fetchData)
                .subscribe(),
            supabase.channel(`messages-${id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_messages', filter: `report_id=eq.${id}` }, fetchData)
                .subscribe()
        ];

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Actions ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !id) return;

        setSending(true);
        try {
            const { error } = await supabase
                .from('report_messages')
                .insert({
                    report_id: id,
                    sender_id: user.id,
                    sender_role: 'citizen',
                    message_text: newMessage.trim(),
                    channel: 'citizen'
                });
            if (error) throw error;
            setNewMessage('');
        } catch (err) {
            console.error("Comms failure:", err);
        } finally {
            setSending(false);
        }
    };

    // --- Helpers ---
    const isOverdue = (createdAt: string) => {
        return differenceInHours(new Date(), new Date(createdAt)) > 72;
    };

    const getOverdueHours = (createdAt: string) => {
        return Math.max(0, differenceInHours(new Date(), new Date(createdAt)));
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'reported': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'assigned': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'in_progress': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'resolved':
            case 'closed': return 'bg-green-500/20 text-green-500 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-brand-primary flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-brand-secondary/20 border-t-brand-secondary rounded-full"
            />
        </div>
    );

    if (!report) return (
        <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center p-10 text-center">
            <h1 className="text-4xl font-black text-brand-secondary uppercase mb-4">Report Not Found</h1>
            <p className="text-brand-secondary/40 font-bold max-w-md mb-8">The requested report intelligence could not be retrieved from the central database.</p>
            <button onClick={() => navigate('/reports')} className="minimal-card px-8 py-3 bg-brand-secondary text-brand-primary font-black uppercase">Return to Hub</button>
        </div>
    );

    const navItems = [
        { label: 'Dashboard', path: '/citizen', icon: PlanetIcon },
        { label: 'Reports Hub', path: '/reports', icon: Globe },
        { label: 'My Report', path: '/citizen/reports', icon: FileText },
        { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
        { label: 'Micro Task', path: '/citizen/micro-tasks', icon: TargetIcon },
        { label: 'Rewards', path: '/citizen/rewards', icon: AwardIcon },
    ];

    const timelineSteps = [
        { label: 'Reported', completed: true, status: 'reported' },
        { label: 'AI Categorized', completed: !!report.category, status: 'ai' },
        { label: 'Admin Verified', completed: ['assigned', 'in_progress', 'resolved'].includes(report.status), status: 'verified' },
        { label: 'Worker Assigned', completed: !!assignment, status: 'assigned' },
        { label: 'Work Uploaded', completed: !!proof, status: 'uploaded' },
        { label: 'Resolved', completed: report.status === 'resolved', status: 'resolved' },
    ];

    return (
        <MinimalLayout navItems={navItems} title={`Mission Hub: ${report.title}`}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-20">

                {/* BACK BUTTON */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/reports')}
                    className="group flex items-center gap-3 text-brand-secondary/40 hover:text-brand-secondary transition-all w-fit"
                >
                    <div className="w-10 h-10 rounded-full border border-brand-secondary/10 flex items-center justify-center group-hover:border-brand-secondary/30 transition-all">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Reports Hub</span>
                </motion.button>

                {/* SUCCESS BANNER FOR RESOLVED/CLOSED */}
                {(report.status === 'resolved' || report.status === 'closed') && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-green-500 rounded-[40px] shadow-2xl shadow-green-500/20 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Mission Accomplished</h3>
                                <p className="text-white/80 font-bold text-xs uppercase tracking-[0.2em]">This issue has been successfully resolved and verified by the command center.</p>
                            </div>
                        </div>
                        <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white text-[10px] font-black uppercase tracking-widest relative z-10">
                            Status: MISSION COMPLETE
                        </div>
                    </motion.div>
                )}

                {/* HERO TITLE SECTION */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2 mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-secondary/5 rounded-xl text-brand-secondary">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40 italic">Mission Deep Dive</span>
                    </div>
                    <h1 className="text-6xl font-black text-brand-secondary tracking-tighter uppercase leading-[0.9] max-w-4xl">
                        {report.title}
                    </h1>
                    <p className="text-xs font-bold text-brand-secondary/30 uppercase tracking-[0.2em] ml-1">
                        Deployment ID: <span className="text-brand-secondary/60">{report.id}</span>
                    </p>
                </motion.div>

                {/* 1. HEADER / REPORT SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="minimal-card p-5 border-brand-secondary/5 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/30 mb-1">Status Vector</span>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-[0.1em] border w-fit ${getStatusColor(report.status)}`}>
                            {report.status.replace('_', ' ')}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="minimal-card p-5 border-brand-secondary/5 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/30 mb-1">AI Risk Index</span>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-black text-brand-secondary">{(report.risk_score * 100).toFixed(0)}%</span>
                            <span className="text-[10px] font-black text-green-500 uppercase pb-1">Confidence</span>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="minimal-card p-5 border-brand-secondary/5 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/30 mb-1">Deployment Date</span>
                        <div className="flex items-center gap-2 text-brand-secondary font-bold">
                            <Calendar size={14} className="opacity-40" />
                            {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="minimal-card p-5 border-brand-secondary/5 flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/30 mb-1">Originator</span>
                        <div className="flex items-center gap-2 text-brand-secondary font-bold">
                            <User size={14} className="opacity-40" />
                            {report.reporter?.full_name || 'System'}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`minimal-card p-5 flex flex-col justify-between border ${isOverdue(report.created_at) && report.status !== 'resolved' ? 'border-red-500/20 bg-red-500/5 text-red-500' : 'border-green-500/20 bg-green-500/5 text-green-500'}`}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Time Performance</span>
                        <div className="flex items-center gap-2 font-black">
                            {isOverdue(report.created_at) && report.status !== 'resolved' ? (
                                <><ShieldAlert size={16} /> OVERDUE (+{getOverdueHours(report.created_at)}H)</>
                            ) : (
                                <><CheckCircle2 size={16} /> ON TIME</>
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* 2. IMAGE, DESCRIPTION & AI CARDS */}
                    <div className="lg:col-span-8 space-y-8">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="minimal-card p-0 overflow-hidden relative group">
                            <div className="aspect-[16/9] w-full bg-black/40 relative">
                                <img
                                    src={showAfter && proof?.after_image_url ? proof.after_image_url : report.image_url}
                                    alt="Report Evidence"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                {proof?.after_image_url && (
                                    <div className="absolute bottom-6 left-6 flex gap-2">
                                        <button
                                            onClick={() => setShowAfter(false)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!showAfter ? 'bg-brand-secondary text-brand-primary border-brand-secondary shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/40 text-white/60 border-white/10 hover:bg-black/60'}`}
                                        >
                                            Original
                                        </button>
                                        <button
                                            onClick={() => setShowAfter(true)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showAfter ? 'bg-brand-secondary text-brand-primary border-brand-secondary shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-black/40 text-white/60 border-white/10 hover:bg-black/60'}`}
                                        >
                                            Resolved Proof
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="minimal-card p-8 border-brand-secondary/5 h-full">
                                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-4 flex items-center gap-2">
                                    <FileText size={18} className="text-brand-secondary/40" />
                                    Intel Description
                                </h3>
                                <p className="text-sm font-bold text-brand-secondary/60 leading-relaxed uppercase tracking-tight">
                                    {report.description}
                                </p>
                            </div>

                            <div className="minimal-card p-8 border-brand-secondary/5 h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Activity size={80} />
                                </div>
                                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-4 flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-brand-secondary/40" />
                                    Gemini Analysis
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {report.category?.split(',').map((tag, i) => (
                                            <span key={i} className="px-3 py-1 rounded-lg bg-brand-secondary/5 text-[10px] font-black uppercase text-brand-secondary/60 border border-brand-secondary/5">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="p-4 rounded-2xl bg-brand-secondary/[0.02] border border-brand-secondary/5">
                                        <div className="text-[9px] font-black text-brand-secondary/30 uppercase mb-2">Automated Classification</div>
                                        <p className="text-[11px] font-black text-brand-secondary/80 uppercase">
                                            The neural core has identified this as a <span className="text-brand-secondary">{report.category}</span> issue with a priority level of <span className="text-orange-500">{report.priority || 'Standard'}</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. TACTICAL COMMS */}
                        <div className="minimal-card p-0 border-brand-secondary/10 flex flex-col overflow-hidden h-[600px] shadow-2xl shadow-brand-secondary/5">
                            <div className="p-6 border-b border-brand-secondary/10 bg-brand-secondary/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-brand-secondary text-brand-primary">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-brand-secondary uppercase tracking-tighter">Tactical Comms Channel</h3>
                                        <p className="text-[9px] font-black uppercase text-brand-secondary/30 tracking-[0.2em] animate-pulse">Establishing secure link...</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                        <MessageSquare size={40} className="mb-4" />
                                        <p className="text-xs font-black uppercase">No intelligence updates transmitted yet</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] flex ${msg.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                                                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border font-black text-[10px] uppercase ${msg.sender_role === 'admin' ? 'bg-brand-secondary text-brand-primary border-brand-secondary' : 'bg-white text-brand-secondary border-brand-secondary/10'}`}>
                                                    {msg.sender_profile?.full_name?.charAt(0) || msg.sender_role?.charAt(0)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className={`p-4 rounded-2xl text-[11px] font-bold tracking-tight leading-relaxed uppercase shadow-sm ${msg.sender_id === user?.id ? 'bg-brand-secondary text-brand-primary' : 'bg-white text-brand-secondary border border-brand-secondary/5'}`}>
                                                        {msg.message_text}
                                                    </div>
                                                    <div className={`text-[8px] font-black uppercase tracking-widest text-brand-secondary/30 px-1 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                                                        {msg.sender_profile?.full_name} • {format(new Date(msg.created_at), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-brand-secondary/10 flex gap-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Enter report intelligence update..."
                                    className="flex-1 bg-brand-secondary/5 border-none rounded-xl px-6 py-4 text-xs font-bold uppercase tracking-tight focus:ring-2 focus:ring-brand-secondary/20 transition-all outline-none"
                                />
                                <button
                                    disabled={sending || !newMessage.trim()}
                                    className="p-4 bg-brand-secondary text-brand-primary rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-brand-secondary/10"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 3. ASSIGNED WORKER DETAILS */}
                        <AnimatePresence>
                            {assignment ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="minimal-card p-8 border-brand-secondary/10 bg-brand-secondary text-brand-primary relative overflow-hidden"
                                >
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center border border-white/10">
                                                <User size={24} className="text-brand-primary" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/60 mb-1">Status</div>
                                                <div className="px-3 py-1 bg-brand-primary/20 rounded-lg text-[9px] font-black uppercase border border-white/10">Active Specialist</div>
                                            </div>
                                        </div>

                                        <div className="space-y-1 mb-8">
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">{assignment.worker?.full_name}</h2>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/60">Assigned Field Specialist</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                                <div className="text-[9px] font-black uppercase text-brand-primary/40 mb-1">Resolved Issues</div>
                                                <div className="text-xl font-black">{assignment.metrics?.total_resolved || 0}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                                <div className="text-[9px] font-black uppercase text-brand-primary/40 mb-1">Deadline</div>
                                                <div className="text-sm font-black">{assignment.deadline ? format(new Date(assignment.deadline), 'MMM dd') : 'No Limit'}</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm font-bold opacity-80 uppercase tracking-tight">
                                                <Smartphone size={16} />
                                                {assignment.worker?.phone || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold opacity-80 uppercase tracking-tight">
                                                <Mail size={16} />
                                                {assignment.worker?.email}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="minimal-card p-10 border-dashed border-brand-secondary/10 bg-brand-secondary/[0.01] text-center">
                                    <UserCheck size={40} className="mx-auto text-brand-secondary/10 mb-6" />
                                    <h3 className="text-sm font-black text-brand-secondary/60 uppercase mb-2">Awaiting Specialist</h3>
                                    <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest leading-relaxed">The mission control is currently identifying the optimal field specialist for this deployment.</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* LOCATION CARD */}
                        <div className="minimal-card p-8 border-brand-secondary/5 h-[300px] flex flex-col">
                            <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <MapPin size={18} className="text-brand-secondary/40" />
                                Deployment Point
                            </h3>
                            <div className="flex-1 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/5 relative overflow-hidden group cursor-pointer" onClick={() => window.open(`https://www.google.com/maps?q=${report.latitude},${report.longitude}`, '_blank')}>
                                {report.latitude && report.longitude ? (
                                    <MapContainer
                                        center={[report.latitude, report.longitude]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%', zIndex: 0 }}
                                        zoomControl={false}
                                        dragging={false}
                                        scrollWheelZoom={false}
                                        doubleClickZoom={false}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <Marker position={[report.latitude, report.longitude]} />
                                    </MapContainer>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-brand-secondary/30 font-bold text-[10px] uppercase tracking-widest">
                                        No GPS Data Available
                                    </div>
                                )}
                                <div className="absolute bottom-4 left-4 right-4 p-4 bg-brand-primary/80 backdrop-blur-md rounded-xl border border-white/10 z-[1000]">
                                    <p className="text-[10px] font-black text-brand-secondary uppercase line-clamp-1">{report.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* 5. REPORT TIMELINE */}
                        <div className="minimal-card p-8 border-brand-secondary/5">
                            <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-8 flex items-center gap-2">
                                <Activity size={18} className="text-brand-secondary/40" />
                                Mission Lifecycle
                            </h3>
                            <div className="space-y-6">
                                {timelineSteps.map((step, i) => (
                                    <div key={i} className="flex gap-4 relative">
                                        {i !== timelineSteps.length - 1 && (
                                            <div className={`absolute left-[11px] top-6 w-[2px] h-[calc(100%+8px)] ${step.completed ? 'bg-brand-secondary' : 'bg-brand-secondary/10'}`} />
                                        )}
                                        <div className={`shrink-0 w-6 h-6 rounded-full border-4 ${step.completed ? 'bg-brand-secondary border-brand-secondary shadow-[0_0_10px_rgba(255,165,0,0.3)]' : 'bg-white border-brand-secondary/10'}`} />
                                        <div className="py-0.5">
                                            <h4 className={`text-xs font-black uppercase tracking-tight ${step.completed ? 'text-brand-secondary' : 'text-brand-secondary/30'}`}>{step.label}</h4>
                                            {step.completed && (
                                                <p className="text-[9px] font-bold text-brand-secondary/40 uppercase mt-1">Status Verified</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 6. ADDITIONAL INFO / ATTACHMENTS */}
                        <div className="minimal-card p-8 border-brand-secondary/5">
                            <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Tag size={18} className="text-brand-secondary/40" />
                                Intel Metadata
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary/[0.02] border border-brand-secondary/5">
                                    <span className="text-[10px] font-black uppercase text-brand-secondary/40">Network Node</span>
                                    <span className="text-[10px] font-black text-brand-secondary uppercase">Node-{report.id.slice(0, 4)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary/[0.02] border border-brand-secondary/5">
                                    <span className="text-[10px] font-black uppercase text-brand-secondary/40">Priority Class</span>
                                    <span className={`text-[10px] font-black uppercase ${report.priority === 'High' || report.severity > 7 ? 'text-red-500' : 'text-brand-secondary'}`}>{report.priority || 'Standard'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-secondary/[0.02] border border-brand-secondary/5">
                                    <span className="text-[10px] font-black uppercase text-brand-secondary/40">Evidence Count</span>
                                    <span className="text-[10px] font-black text-brand-secondary uppercase">{proof ? '2 Assets' : '1 Asset'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};
