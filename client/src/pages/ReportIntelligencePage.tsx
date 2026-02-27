import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, MapPin, Clock, CheckCircle2,
    ShieldAlert, AlertTriangle, User,
    MessageSquare, Send, Radio, Activity,
    LayoutDashboard, Bell, FileText, Globe,
    Shield, Target, Award, Info, ShieldCheck, Users
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

/* ── UI Components ── */

const StatusBadge = ({ status, priority }: { status: string, priority: string }) => {
    const isCritical = priority === 'Critical' || priority === 'high';
    return (
        <div className="flex gap-3">
            <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${status === 'resolved' ? 'bg-green-500 text-white border-green-400' :
                status === 'in_progress' ? 'bg-blue-500 text-white border-blue-400' :
                    'bg-brand-secondary text-brand-primary border-brand-secondary/20'
                }`}>
                Status: {status.replace('_', ' ')}
            </div>
            {isCritical && (
                <div className="px-6 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse border border-red-500 shadow-xl shadow-red-500/20">
                    ESCALATED INCIDENT
                </div>
            )}
        </div>
    );
};

export const ReportIntelligencePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [proofs, setProofs] = useState<any>(null);
    const [assignedOperatives, setAssignedOperatives] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    const chatEndRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
        { label: 'Reports Hub', path: '/reports', icon: Globe },
        { label: 'My Report', path: '/citizen/reports', icon: FileText },
        { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
        { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
        { label: 'Rewards', path: '/citizen/profile#rewards', icon: Award },
    ];

    useEffect(() => {
        if (id) {
            fetchReportDetails();

            // Realtime subscriptions
            const messageSub = supabase
                .channel(`chat-${id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_messages', filter: `report_id=eq.${id}` },
                    async (payload) => {
                        if (payload.new.channel === 'worker') return;
                        const { data: newMessage } = await (supabase.from('report_messages') as any)
                            .select('*, profiles:sender_id(full_name, role)')
                            .eq('id', payload.new.id)
                            .single();
                        if (newMessage) setMessages(prev => [...prev, newMessage]);
                    })
                .subscribe();

            const commentSub = supabase
                .channel(`comments-${id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_comments', filter: `report_id=eq.${id}` },
                    payload => setComments(prev => [...prev, payload.new]))
                .subscribe();

            return () => {
                supabase.removeChannel(messageSub);
                supabase.removeChannel(commentSub);
            };
        }
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchReportDetails = async () => {
        const { data, error } = await (supabase.from('issues') as any)
            .select('*, profiles:user_id(full_name)')
            .eq('id', id as any)
            .single();

        if (error) {
            console.error("Error fetching report details:", error);
            setLoading(false);
            return;
        }
        setReport(data);

        // Parallel fetch for logs, messages, operatives, and proofs
        const { data: logData } = await (supabase.from('report_activity_logs') as any)
            .select('*, profiles:actor_id(full_name)')
            .eq('report_id', id as any)
            .order('created_at', { ascending: false });
        setLogs(logData || []);

        const { data: msgData } = await (supabase.from('report_messages') as any)
            .select('*, profiles:sender_id(full_name, role)')
            .eq('report_id', id as any)
            .or('channel.eq.admin_citizen,channel.is.null')
            .order('created_at', { ascending: true });
        setMessages(msgData || []);

        const { data: opData } = await (supabase.from('report_assignments') as any)
            .select('*, profiles:worker_id(full_name, avatar_url)')
            .eq('report_id', id as any);
        setAssignedOperatives(opData || []);

        const { data: proofData } = await (supabase.from('resolution_proofs') as any)
            .select('*')
            .eq('report_id', id as any)
            .maybeSingle();
        setProofs(proofData);

        const { data: commentData } = await (supabase.from('report_comments') as any)
            .select('*, profiles(full_name, avatar_url)')
            .eq('report_id', id as any)
            .order('created_at', { ascending: true });
        setComments(commentData || []);

        setLoading(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const { error } = await (supabase.from('report_messages') as any).insert({
            report_id: id,
            sender_id: user?.id,
            message_text: newMessage.trim(),
            channel: 'admin_citizen'
        });

        if (!error) setNewMessage('');
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        const { error } = await (supabase.from('report_comments') as any).insert({
            report_id: id,
            user_id: user?.id,
            comment_text: newComment.trim(),
        });

        if (!error) setNewComment('');
    };

    if (loading) return <div className="min-h-screen bg-brand-primary p-20 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary/30">Synchronizing Tactical Node...</p>
    </div>;

    if (!report) return <div className="min-h-screen bg-brand-primary p-20 text-center uppercase font-black text-brand-secondary/40">Data Stream Corrupted. Contact C-Node.</div>;

    const riskScore = Math.round((report.risk_score || 0) * 100);
    const operationAge = format(new Date(report.created_at), 'HH'); // Simplified
    const hoursRemaining = 54; // Mocked for UI demonstration

    return (
        <MinimalLayout navItems={navItems} title="Operational Intelligence">
            <div className="max-w-[1600px] mx-auto py-8 px-6 lg:px-12 space-y-16">

                {/* ✔ ISSUE RESOLVED SECTION — shown only when report is resolved/closed */}
                {(report.status === 'closed' || report.status === 'resolved') && (
                    <section>
                        {/* Green resolution header banner */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500 rounded-[2.5rem] p-8 shadow-2xl shadow-green-500/20 flex flex-col md:flex-row items-start md:items-center gap-6 mb-8"
                        >
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl shrink-0">
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">✔ Issue Resolved</h2>
                                <p className="text-white/70 text-sm font-medium mt-1">
                                    This civic issue has been officially verified and resolved by our operations team.
                                </p>
                                <div className="flex flex-wrap items-center gap-6 mt-3">
                                    <span className="flex items-center gap-1.5 text-white/70 text-[10px] font-black uppercase tracking-widest">
                                        <User size={12} />
                                        Field Agent: {assignedOperatives[0]?.profiles?.full_name || 'FixIt Operative'}
                                    </span>
                                    {proofs?.verified_at && (
                                        <span className="flex items-center gap-1.5 text-white/70 text-[10px] font-black uppercase tracking-widest">
                                            <Clock size={12} />
                                            Resolved: {format(new Date(proofs.verified_at), 'MMM dd, yyyy')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-5 py-3 bg-white/10 rounded-2xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest shrink-0">
                                <ShieldCheck size={14} /> Admin Verified
                            </div>
                        </motion.div>

                        {/* Before / After Comparison */}
                        {proofs && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                {/* Before */}
                                <div className="rounded-[2rem] overflow-hidden border border-brand-secondary/5 shadow-xl group relative">
                                    <div className="aspect-video relative">
                                        {report.image_url ? (
                                            <img src={report.image_url} alt="Before" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-brand-secondary/5 flex items-center justify-center text-brand-secondary/20 font-black uppercase text-xs">No Image</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 via-transparent to-transparent opacity-70" />
                                        <div className="absolute bottom-5 left-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">BEFORE — Original Report</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest pl-4">
                                                {format(new Date(report.created_at), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* After */}
                                <div className="rounded-[2rem] overflow-hidden border border-green-200 shadow-xl shadow-green-500/10 group relative">
                                    <div className="aspect-video relative">
                                        {proofs.after_image_url ? (
                                            <img src={proofs.after_image_url} alt="After" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-green-50 flex items-center justify-center text-green-300 font-black uppercase text-xs">Proof Submitted</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-transparent to-transparent opacity-70" />
                                        <div className="absolute bottom-5 left-5">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 size={12} className="text-green-400" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">AFTER — Issue Resolved</span>
                                            </div>
                                            {proofs.verified_at && (
                                                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest pl-5">
                                                    {format(new Date(proofs.verified_at), 'MMM dd, yyyy')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* 🔷 SECTION 1: CAPTURE EVIDENCE (LARGE) */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-brand-secondary/20" />
                        <h3 className="text-xl font-black uppercase tracking-tighter text-brand-secondary underline decoration-brand-secondary/10 underline-offset-4">Capture Evidence</h3>
                    </div>

                    <div className={proofs ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full"}>
                        {/* Initial Intel Card */}
                        <div className="minimal-card p-0 rounded-[2rem] overflow-hidden border-brand-secondary/5 group shadow-xl relative">
                            <div className={`${proofs ? "aspect-video" : "aspect-[21/9]"} relative`}>
                                {report.image_url ? (
                                    <>
                                        <img src={report.image_url} alt="Initial Intel" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/80 via-transparent to-transparent opacity-60" />
                                        <div className="absolute bottom-6 left-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">INITIAL INTELLIGENCE</p>
                                            </div>
                                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-3">
                                                {format(new Date(report.created_at), 'MMM dd, yyyy • HH:mm')}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-secondary/[0.02]">
                                        <Info size={32} className="text-brand-secondary/5 mb-3" />
                                        <p className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest">Packet Body Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resolution Card - Only shown if proofs exist */}
                        {proofs && (
                            <div className="minimal-card p-0 rounded-[2rem] overflow-hidden border-brand-secondary/5 group shadow-xl bg-brand-secondary/[0.02] flex flex-col">
                                <div className="aspect-video relative flex-1">
                                    <img src={proofs.after_image_url} alt="Resolution" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-transparent to-transparent opacity-60" />
                                    <div className="absolute bottom-6 left-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 size={12} className="text-green-400" />
                                            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">RESOLUTION VERIFIED</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-5">
                                            {proofs.verified_at ? format(new Date(proofs.verified_at), 'MMM dd, yyyy • HH:mm') : 'Pending Final Verification'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 🔷 SECTION 2: TACTICAL SUMMARY (WIDER) */}
                <section className="minimal-card p-0 rounded-[2.5rem] overflow-hidden border-brand-secondary/10 shadow-2xl bg-white grid grid-cols-1 lg:grid-cols-4 lg:divide-x divide-brand-secondary/10">
                    <div className="lg:col-span-3 p-10 space-y-8">
                        <div className="flex items-center gap-3 text-brand-secondary/20">
                            <Target size={20} />
                            <h3 className="text-xl font-black uppercase tracking-tighter text-brand-secondary">Tactical Summary</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                            <div className="space-y-1 border-l-2 border-brand-secondary/5 pl-4 hover:border-brand-secondary/20 transition-colors">
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Sector</p>
                                <p className="text-sm font-black uppercase tracking-tight text-brand-secondary leading-tight">{report.address?.split(',')[0]}</p>
                            </div>
                            <div className="space-y-1 border-l-2 border-brand-secondary/5 pl-4 hover:border-brand-secondary/20 transition-colors">
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Priority</p>
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm font-black uppercase tracking-tight ${report.severity >= 8 ? 'text-red-600' : 'text-brand-secondary'}`}>
                                        {report.severity >= 8 ? 'Critical' : 'Standard'}
                                    </p>
                                    {report.severity >= 8 && <div className="w-1 h-1 rounded-full bg-red-600 animate-ping" />}
                                </div>
                            </div>
                            <div className="space-y-1 border-l-2 border-brand-secondary/5 pl-4 hover:border-brand-secondary/20 transition-colors">
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Logged</p>
                                <p className="text-sm font-black uppercase tracking-tight text-brand-secondary leading-tight">{format(new Date(report.created_at), 'HH:mm')}<span className="text-[8px] opacity-30 ml-1">HRS</span></p>
                            </div>
                            <div className="space-y-1 border-l-2 border-brand-secondary/5 pl-4 hover:border-brand-secondary/20 transition-colors">
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-black uppercase tracking-tight text-brand-secondary leading-tight">{format(new Date(report.created_at), 'MMM dd')}</p>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-brand-secondary/5">
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Sustained Narrative</p>
                                <p className="text-xs font-medium text-brand-secondary/70 leading-relaxed max-w-4xl">{report.description}</p>
                            </div>
                            {report.auto_tags && report.auto_tags.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Tactical Auto-Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.auto_tags.map((tag: string, i: number) => (
                                            <span key={i} className="px-2.5 py-1 bg-brand-secondary/5 border border-brand-secondary/5 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-secondary opacity-60">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-secondary p-10 flex flex-col justify-center gap-6 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-brand-primary/30">
                                <Activity size={20} />
                                <h3 className="text-xl font-black uppercase tracking-tighter text-brand-primary">Risk Index</h3>
                            </div>
                            <Shield size={20} className="text-brand-primary/10" />
                        </div>
                        <div>
                            <div className="text-6xl font-black text-brand-primary tracking-tighter leading-none">{riskScore}%</div>
                            <p className="text-[6px] font-black uppercase tracking-[0.4em] text-brand-primary/30 mt-2">AI SYNC 0.94</p>
                        </div>
                        <div className="h-1 w-full bg-brand-primary/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${riskScore}%` }}
                                transition={{ duration: 1.5 }}
                                className="h-full bg-brand-primary shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            />
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* MAIN COLUMN */}
                    <div className="lg:col-span-8 space-y-12">

                        {/* 🔷 SECTION 3: COMMAND DIRECT (PRIVATE CHAT) */}
                        <section className="minimal-card p-0 rounded-[2.5rem] overflow-hidden border-brand-secondary/10 shadow-2xl h-[420px] flex flex-col bg-white">
                            <div className="p-4 border-b border-brand-secondary/10 bg-brand-secondary text-brand-primary flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <h4 className="text-sm font-black uppercase tracking-tighter">Command Direct (Admin Link)</h4>
                                </div>
                                <Radio size={14} className="opacity-40" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-brand-secondary/[0.01] custom-scrollbar">
                                {messages.map((msg) => {
                                    const isStaff = msg.profiles?.role !== 'citizen';
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'} space-y-1`}>
                                            <span className="text-[7px] font-black text-brand-secondary/30 uppercase px-1">
                                                {msg.profiles?.full_name} • {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                            <div className={`px-3 py-2 rounded-xl max-w-[85%] text-[10px] font-bold uppercase shadow-sm ${isStaff
                                                ? 'bg-brand-primary text-brand-secondary border border-brand-secondary/5'
                                                : 'bg-brand-secondary text-brand-primary border border-brand-secondary/10'
                                                }`}>
                                                {msg.message_text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-4 border-t border-brand-secondary/10">
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Transmit to HQ..."
                                        className="w-full pl-5 pr-14 py-3 bg-brand-secondary/5 border-transparent focus:border-brand-secondary/10 rounded-xl text-[9px] font-black uppercase"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand-secondary text-brand-primary flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </section>

                        {/* 🔷 NEW SECTION 6: TACTICAL COMMS LINK (COMMUNITY DISCUSSION) */}
                        <section className="minimal-card p-0 rounded-[2.5rem] overflow-hidden border-brand-secondary/10 shadow-2xl h-[420px] flex flex-col bg-white">
                            <div className="p-4 border-b border-brand-secondary/10 bg-brand-primary text-brand-secondary flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-brand-secondary/40" />
                                    <h4 className="text-sm font-black uppercase tracking-tighter">Tactical Comms Link</h4>
                                </div>
                                <Activity size={14} className="opacity-20" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                                {comments.length > 0 ? comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className="w-8 h-8 rounded-lg bg-brand-secondary/5 flex items-center justify-center flex-shrink-0">
                                            {comment.profiles?.avatar_url ? (
                                                <img src={comment.profiles.avatar_url} className="w-full h-full object-cover rounded-lg" />
                                            ) : <User size={12} className="text-brand-secondary/20" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase text-brand-secondary">{comment.profiles?.full_name}</span>
                                                <span className="text-[7px] font-black text-brand-secondary/20 uppercase">{format(new Date(comment.created_at), 'H:mm')}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-brand-secondary/80 leading-relaxed bg-brand-secondary/[0.02] p-3 rounded-xl rounded-tl-none border border-brand-secondary/5 group-hover:bg-brand-secondary/5 transition-colors">
                                                {comment.comment_text}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                                        <Users size={32} className="text-brand-secondary/5" />
                                        <p className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-[0.2em]">Broadcast Frequency Silent.</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t border-brand-secondary/10">
                                <form onSubmit={handleSendComment} className="relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Add coordination signal..."
                                        className="w-full pl-5 pr-14 py-3 bg-brand-secondary/5 border-transparent focus:border-brand-secondary/10 rounded-xl text-[9px] font-black uppercase"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand-secondary text-brand-primary flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>

                    {/* SIDEBAR COLUMN */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* 🔷 SECTION 4: PROTOCOL MATRIX */}
                        <section className="minimal-card p-8 rounded-[2rem] border-brand-secondary/10 bg-brand-secondary/[0.02] shadow-xl space-y-6">
                            <div className="flex items-center gap-3 text-brand-secondary/30">
                                <ShieldAlert size={20} />
                                <h3 className="text-lg font-black uppercase tracking-tighter text-brand-secondary">Protocol Matrix</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-white rounded-2xl border border-brand-secondary/5 shadow-sm space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-secondary/30">Operational Status</p>
                                    <span className="text-lg font-black uppercase tracking-tighter text-brand-secondary">{report.status.replace('_', ' ')}</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border border-brand-secondary/5 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-brand-secondary/5 flex items-center justify-center">
                                        {assignedOperatives.length > 0 ? (
                                            assignedOperatives[0].profiles?.avatar_url ? (
                                                <img src={assignedOperatives[0].profiles.avatar_url} className="w-full h-full object-cover rounded-xl" />
                                            ) : <User size={16} className="text-brand-secondary/40" />
                                        ) : <Radio size={16} className="text-brand-secondary/10 animate-pulse" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black uppercase tracking-tighter text-brand-secondary leading-none">
                                            {assignedOperatives.length > 0 ? assignedOperatives[0].profiles?.full_name : 'No Unit Dispatched'}
                                        </p>
                                        <p className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest mt-1">
                                            {assignedOperatives.length > 0 ? 'Field Agent' : 'In Queue'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-white rounded-2xl border border-brand-secondary/5 shadow-sm">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-secondary/30">Registry</p>
                                        <p className="text-[10px] font-black text-brand-secondary font-mono uppercase">NODE-{report.id.slice(0, 4)}</p>
                                    </div>
                                    <div className="p-4 bg-brand-secondary text-brand-primary rounded-2xl shadow-sm">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">SLA Recovery</p>
                                        <p className="text-[10px] font-black uppercase tracking-tighter">48H Remaining</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 🔷 SECTION 5: GEO-INTEL */}
                        <section className="minimal-card p-8 rounded-[2rem] border-brand-secondary/10 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 text-brand-secondary/[0.02]">
                                <Globe size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3 text-brand-secondary/30">
                                    <MapPin size={20} />
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-brand-secondary">Geo-Intelligence</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Coordinates</p>
                                            <p className="text-[9px] font-black uppercase tracking-tight text-brand-secondary font-mono bg-brand-secondary/5 px-2 py-1 rounded">
                                                {report.latitude?.toFixed(4)}° {report.longitude?.toFixed(4)}°
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Sector Index</p>
                                            <p className="text-[9px] font-black uppercase tracking-tight text-brand-secondary italic">BLR-WEST-7</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">Validated Address</p>
                                        <p className="text-[10px] font-black uppercase tracking-tight text-brand-secondary leading-tight opacity-70">{report.address}</p>
                                    </div>
                                    <div className="h-40 w-full bg-brand-secondary/5 rounded-2xl border border-dashed border-brand-secondary/10 flex flex-col items-center justify-center group overflow-hidden relative">
                                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+ff0000(0,0)/0,0,1/300x200?access_token=pk.xxx')] opacity-5 bg-center bg-cover grayscale" />
                                        <MapPin size={24} className="text-brand-secondary/10 animate-bounce relative z-10" />
                                        <p className="text-[7px] font-black text-brand-secondary/30 uppercase tracking-[0.4em] relative z-10 mt-2">Static Hub Map Proxy</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* 🔷 SECURITY FOOTER */}
                <footer className="pt-12 border-t border-brand-secondary/10 flex flex-col md:flex-row items-center justify-between gap-10 pb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.4em]">Registry Authority</p>
                            <p className="text-sm font-black text-brand-secondary uppercase tracking-tighter italic leading-none">FixIt Intel Services</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-[8px] font-black text-brand-secondary/10 uppercase tracking-[0.6em] mb-4">TACTICAL DATA ENCRYPTION V7.1.0</p>
                    </div>
                    <div className="flex items-center gap-8 text-brand-secondary/10">
                        <Award size={24} />
                        <ShieldAlert size={24} />
                    </div>
                </footer>
            </div>
        </MinimalLayout>
    );
};
