import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Clock,
    MapPin,
    User,
    Calendar,
    AlertCircle,
    Activity,
    MessageSquare,
    ShieldCheck,
    Send,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    ShieldAlert,
    FileCheck,
    Lock,
    UserPlus,
    LayoutDashboard,
    ClipboardCheck,
    Shield,
    Users,
    Radio,
    BarChart3,
    X,
    Maximize2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { Report, ReportComment, ReportActivityLog, ReportStatus, ResolutionProof } from '../types/reports';
import { MinimalLayout } from '../components/MinimalLayout';
import { AdminAssignmentPanel } from '../components/admin/AdminAssignmentPanel';
import { AdminPrivateThread } from '../components/admin/AdminPrivateThread';
import { AdminWorkerThread } from '../components/admin/AdminWorkerThread';
import { ProofVerificationModal } from '../components/admin/ProofVerificationModal';
import { useAuth } from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminReportDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { profile: adminProfile } = useAuth();
    const [report, setReport] = useState<Report | null>(null);
    const [comments, setComments] = useState<ReportComment[]>([]);
    const [logs, setLogs] = useState<ReportActivityLog[]>([]);
    const [proofs, setProofs] = useState<ResolutionProof[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'private' | 'worker' | 'timeline' | 'proofs'>('public');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const fetchReportData = async () => {
        if (!id) return;

        const [reportRes, commentsRes, logsRes, proofsRes] = await Promise.all([
            supabase.from('issues').select('*, reporter:profiles!user_id(id, email, full_name, role), assignments:report_assignments(worker:profiles!report_assignments_worker_id_fkey(id, email, full_name, role))').eq('id', id).single(),
            supabase.from('report_comments').select('*, user:profiles(id, email, full_name, role)').eq('report_id', id).order('created_at', { ascending: true }),
            supabase.from('report_activity_logs').select('*, updater:profiles(id, full_name, email, role)').eq('report_id', id).order('created_at', { ascending: false }),
            supabase.from('resolution_proofs').select('*, worker:profiles!worker_id(id, full_name, email)').eq('report_id', id).order('created_at', { ascending: false })
        ]);

        if ((reportRes as any).data) {
            const rawReport = (reportRes as any).data;
            setReport({
                ...rawReport,
                reporter: Array.isArray(rawReport.reporter) ? rawReport.reporter[0] : rawReport.reporter
            });
        }
        if ((commentsRes as any).data) setComments((commentsRes as any).data);
        if ((logsRes as any).data) setLogs((logsRes as any).data);
        if ((proofsRes as any).data) setProofs((proofsRes as any).data);
        setLoading(false);
    };

    useEffect(() => {
        fetchReportData();

        // Realtime subscriptions
        const channel = supabase.channel(`report_detail_${id}`)
            .on('postgres_changes', { event: '*', table: 'issues', schema: 'public', filter: `id=eq.${id}` }, () => fetchReportData())
            .on('postgres_changes', { event: '*', table: 'resolution_proofs', schema: 'public', filter: `report_id=eq.${id}` }, () => fetchReportData())
            .on('postgres_changes', { event: 'INSERT', table: 'report_comments', schema: 'public', filter: `report_id=eq.${id}` }, () => fetchReportData())
            .on('postgres_changes', { event: 'INSERT', table: 'report_activity_logs', schema: 'public', filter: `report_id=eq.${id}` }, () => fetchReportData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !id || !adminProfile) return;

        const { error } = await (supabase.from('report_comments') as any).insert({
            report_id: id,
            user_id: adminProfile.id,
            comment_text: commentText
        });

        if (!error) setCommentText('');
    };

    // SLA Logic
    const slaInfo = useMemo(() => {
        if (!report) return null;
        if (report.status === 'closed') return { isClosed: true };
        const createdAt = new Date(report.created_at);
        const deadline = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const isBreached = diffMs < 0;

        return {
            since: Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)),
            remaining: isBreached ? 'EXPIRED' : `${diffHrs}h ${diffMins}m`,
            isBreached,
            isClosed: false
        };
    }, [report]);

    if (loading) return (
        <MinimalLayout navItems={navItems} title="Intel Deep Dive">
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
            </div>
        </MinimalLayout>
    );

    if (!report) return (
        <MinimalLayout navItems={navItems} title="Error">
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <AlertCircle size={64} className="text-red-500/20" />
                <h2 className="text-2xl font-black text-brand-secondary uppercase text-brand-secondary/20 uppercase tracking-widest text-[10px] leading-relaxed">Intel Package Not Found</h2>
                <Link to="/admin/reports" className="btn-primary">Return to Hub</Link>
            </div>
        </MinimalLayout>
    );

    return (
        <MinimalLayout navItems={navItems} title={`Report: ${report.title.slice(0, 20)}...`}>
            <div className="max-w-7xl mx-auto px-8 py-10">
                {/* Header Navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <Link to="/admin/reports" className="group flex items-center gap-2 text-brand-secondary/40 hover:text-brand-secondary transition-all">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Exit Intelligence Deep Dive</span>
                    </Link>

                    {report.status === 'closed' && (
                        <div className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-500/20">
                            <Lock size={14} /> Permanently Locked
                        </div>
                    )}
                </div>

                {/* Primary Report Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Status Warning Banner */}
                        {report.status === 'awaiting_verification' && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-amber-500 rounded-[32px] flex items-center justify-between gap-6 shadow-xl shadow-amber-500/20"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                        <FileCheck size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Pending Verification</h4>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Worker has submitted proof. Action required.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setActiveTab('proofs');
                                        setShowVerifyModal(true);
                                    }}
                                    className="px-8 py-3 bg-white text-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                >
                                    Review Proof
                                </button>
                            </motion.div>
                        )}

                        {report.status === 'closed' && (
                            <div className="p-8 bg-green-500 text-white rounded-[32px] flex items-center gap-6 shadow-xl shadow-green-500/20">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase tracking-tight text-white">Verified & Closed</h4>
                                    <p className="text-[10px] font-bold text-green-100 uppercase tracking-widest">
                                        Resolved on {report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Report Header Content */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 bg-brand-secondary/5 text-brand-secondary`}>
                                    {report.status.replace(/_/g, ' ')}
                                </span>
                                <span className="px-3 py-1 bg-brand-secondary text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                    {report.priority} PRIORITY
                                </span>
                                {report.is_escalated && (
                                    <span className="px-3 py-1 bg-red-700 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-700/20">
                                        ESCALATED INCIDENT
                                    </span>
                                )}
                            </div>

                            <div>
                                <h1 className="text-5xl font-black text-brand-secondary tracking-tighter uppercase leading-[0.95] mb-2">
                                    {report.title}
                                </h1>
                                <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <User size={12} className="text-brand-secondary/20" />
                                    Submitted By: {report.reporter?.full_name || (report.reporter?.email ? report.reporter.email.split('@')[0] : 'Anonymous')}
                                </p>
                                <p className="text-lg text-brand-secondary/60 font-medium leading-relaxed max-w-2xl">
                                    {report.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white border border-brand-secondary/5 rounded-[40px] shadow-soft">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] flex items-center gap-1.5"><MapPin size={10} /> Sector</label>
                                    <p className="text-xs font-black text-brand-secondary">{report.category?.toUpperCase() || 'INFRASTRUCTURE'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] flex items-center gap-1.5" title={report.reporter?.email || 'Anonymous'}>
                                        <User size={10} /> Originator
                                    </label>
                                    <p className="text-xs font-black text-brand-secondary truncate">
                                        {report.reporter?.full_name || (report.reporter?.email ? report.reporter.email.split('@')[0] : 'Anonymous')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] flex items-center gap-1.5"><Calendar size={10} /> Logged At</label>
                                    <p className="text-xs font-black text-brand-secondary">{new Date(report.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] flex items-center gap-1.5"><Activity size={10} /> Risk Index</label>
                                    <p className={`text-xs font-black ${report.risk_score > 0.7 ? 'text-red-600' : 'text-brand-secondary'}`}>{(report.risk_score * 100).toFixed(0)}% AI CONFIDENCE</p>
                                </div>
                            </div>
                        </div>

                        {/* Visual Evidence (If any) */}
                        {report.image_url && (
                            <div className="rounded-[40px] overflow-hidden border-8 border-white shadow-soft group relative">
                                <img src={report.image_url} alt="Evidence" className="w-full h-[400px] object-cover group-hover:scale-105 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/40 to-transparent" />
                                <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
                                        <Activity size={24} />
                                    </div>
                                    <p className="text-white font-black uppercase text-xs tracking-widest">Photographic Evidence Logs</p>
                                </div>
                            </div>
                        )}

                        {/* Interactive Discussion Areas */}
                        <div className="space-y-6">
                            <div className="flex bg-brand-primary/10 p-1.5 rounded-[24px] border border-brand-secondary/5 self-start overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'public', label: 'Public Discussion', icon: MessageSquare },
                                    { id: 'private', label: 'Admin-Citizen Link', icon: ShieldCheck },
                                    { id: 'worker', label: 'Admin-Worker Link', icon: UserPlus },
                                    { id: 'timeline', label: 'Ops Log', icon: Activity },
                                    { id: 'proofs', label: 'Resolution Proofs', icon: FileCheck },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-secondary text-white shadow-lg' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                        {tab.id === 'proofs' && proofs.length > 0 && (
                                            <span className="ml-1 w-4 h-4 bg-brand-primary text-brand-secondary rounded-full flex items-center justify-center text-[8px]">
                                                {proofs.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'public' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="public" className="space-y-6">
                                        <div className="minimal-card p-6 bg-white overflow-hidden flex flex-col h-[400px]">
                                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                                {comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 flex items-center justify-center font-black text-brand-secondary/30 shrink-0">
                                                            {((comment.user?.full_name?.[0] || comment.user?.email?.[0]) || 'U').toUpperCase()}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${comment.user?.role === 'admin' ? 'text-brand-secondary' : 'text-brand-secondary/40'}`}>
                                                                    {comment.user?.role === 'admin' ? '[HQ OPERATIVE]' : comment.user?.full_name || 'Citizen'}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-brand-secondary/20 uppercase">{new Date(comment.created_at).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-sm font-medium text-brand-secondary/80 leading-relaxed bg-brand-primary/5 p-4 rounded-2xl rounded-tl-none border border-brand-secondary/5">
                                                                {comment.comment_text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {comments.length === 0 && <div className="h-full flex flex-col items-center justify-center text-brand-secondary/20 italic text-xs font-bold uppercase tracking-widest">No communications recorded</div>}
                                            </div>

                                            <form onSubmit={handleComment} className="mt-6 pt-6 border-t border-brand-secondary/5">
                                                <div className="relative">
                                                    <input
                                                        disabled={report.status === 'closed'}
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder={report.status === 'closed' ? "REPORT LOCKED" : "Add Intel..."}
                                                        className="w-full pl-6 pr-20 py-4 bg-brand-primary/5 border border-brand-secondary/5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-secondary/10 transition-all outline-none disabled:opacity-50"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={report.status === 'closed' || !commentText.trim()}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-0 transition-opacity"
                                                    >
                                                        Transmit
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'private' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="private">
                                        {adminProfile && <AdminPrivateThread report={report} adminId={adminProfile.id} />}
                                    </motion.div>
                                )}

                                {activeTab === 'worker' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="worker">
                                        {adminProfile && <AdminWorkerThread report={report} adminId={adminProfile.id} />}
                                    </motion.div>
                                )}

                                {activeTab === 'timeline' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="timeline" className="space-y-4">
                                        <div className="minimal-card p-10 bg-white shadow-soft">
                                            <div className="space-y-10 border-l-2 border-brand-secondary/5 ml-4 pl-10 relative">
                                                {logs.map((update, idx) => (
                                                    <div key={update.id} className="relative">
                                                        <div className="absolute -left-[54px] top-0 p-2 bg-white border-2 border-brand-secondary/5 rounded-xl text-brand-secondary/40 shadow-sm">
                                                            <Activity size={12} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">{update.updater?.full_name || 'SYSTEM CORE'}</p>
                                                                <span className="text-[9px] font-bold text-brand-secondary/20 uppercase tracking-widest">{new Date(update.created_at).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-brand-secondary/60">{(update as any).details?.message || (update as any).update_text}</p>
                                                            {(update as any).details?.status_after && (
                                                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-brand-secondary/5 border border-brand-secondary/10 rounded-full">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary">Status: {(update as any).details.status_after.replace(/_/g, ' ')}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="relative">
                                                    <div className="absolute -left-[54px] top-0 p-2 bg-brand-secondary text-white rounded-xl shadow-lg shadow-brand-secondary/20">
                                                        <CheckCircle2 size={12} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Report Initialised</p>
                                                        <p className="text-[9px] font-bold text-brand-secondary/20 uppercase tracking-widest">{new Date(report.created_at).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'proofs' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="proofs" className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {proofs.map((proof) => (
                                                <div
                                                    key={proof.id}
                                                    onClick={() => !proof.verified_at && setShowVerifyModal(true)}
                                                    className={`minimal-card p-6 bg-white overflow-hidden space-y-4 group cursor-pointer transition-all ${proof.verified_at ? 'opacity-80' : 'ring-2 ring-amber-500/20'}`}
                                                >
                                                    <div className="aspect-video rounded-2xl overflow-hidden relative group/img">
                                                        <img src={proof.after_image_url || proof.before_image_url} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setLightboxImage(proof.after_image_url || proof.before_image_url || null);
                                                                }}
                                                                className="p-3 bg-white text-brand-secondary rounded-full transform scale-50 group-hover/img:scale-100 transition-all shadow-xl hover:bg-brand-primary"
                                                                title="View Fullscreen"
                                                            >
                                                                <Maximize2 size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center font-black text-brand-secondary/40 text-[10px]">
                                                                {proof.worker?.full_name?.[0] || 'W'}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">{proof.worker?.full_name || 'Worker'}</p>
                                                                <p className="text-[9px] font-bold text-brand-secondary/20 uppercase">{new Date(proof.created_at).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {proof.verified_at ? (
                                                            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">VERIFIED</span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">PENDING</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-brand-secondary/60 leading-relaxed line-clamp-2">
                                                        {proof.admin_notes || 'No worker notes provided.'}
                                                    </p>
                                                </div>
                                            ))}
                                            {proofs.length === 0 && (
                                                <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-brand-primary/5 rounded-[40px] border border-dashed border-brand-secondary/10">
                                                    <FileCheck size={48} className="text-brand-secondary/10" />
                                                    <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">No resolution proof uploaded yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Sidebar: SLA & Assignment */}
                    <div className="space-y-10 lg:pt-[220px]">
                        {/* Assignment Panel */}
                        <div className="minimal-card p-1 bg-brand-primary/5 border-brand-secondary/5">
                            <div className="bg-white rounded-[2.25rem] p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8 border-b border-brand-secondary/5 pb-6">
                                    <div className="p-2 bg-brand-secondary/5 rounded-xl text-brand-secondary">
                                        <UserPlus size={18} />
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">
                                        {['resolved', 'RESOLVED', 'closed', 'CLOSED'].includes(report.status) ? 'Assigned Worker' : 'Assign Worker'}
                                    </h4>
                                </div>
                                <AdminAssignmentPanel report={report} onUpdate={fetchReportData} />
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="minimal-card p-8 bg-white space-y-6">
                            <div className="flex items-center gap-3 border-b border-brand-secondary/5 pb-6">
                                <div className="p-2 bg-brand-secondary/5 rounded-xl text-brand-secondary">
                                    <MapPin size={18} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Geo-Intelligence</h4>
                            </div>
                            <div className="space-y-4">
                                <div className="h-48 w-full rounded-2xl overflow-hidden border border-brand-secondary/10 bg-brand-primary/5 relative z-0">
                                    {(report.latitude && report.longitude) ? (
                                        <MapContainer
                                            center={[report.latitude, report.longitude]}
                                            zoom={15}
                                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                                            zoomControl={false}
                                            dragging={false}
                                            scrollWheelZoom={false}
                                            doubleClickZoom={false}
                                        >
                                            <TileLayer
                                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                attribution="&copy; OpenStreetMap contributors"
                                            />
                                            <Marker position={[report.latitude, report.longitude]} />
                                        </MapContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-brand-secondary/30 font-bold text-[10px] uppercase tracking-widest">
                                            No GPS Data
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-secondary/5">
                                        <p className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-widest mb-1">Target Coordinates</p>
                                        <p className="text-xs font-black text-brand-secondary">
                                            {report.latitude?.toFixed(5) || '0.000'} <br /> {report.longitude?.toFixed(5) || '0.000'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-secondary/5">
                                        <p className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-widest mb-1">Authenticated Address</p>
                                        <p className="text-xs font-black text-brand-secondary leading-relaxed line-clamp-3" title={report.address}>{report.address}</p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${report.latitude || 0},${report.longitude || 0}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 bg-brand-primary text-brand-secondary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center justify-center gap-2"
                                >
                                    Open Tactical Map <ChevronRight size={14} />
                                </a>
                            </div>
                        </div>

                        {/* Operational Timeline */}
                        <div className="minimal-card p-8 bg-white space-y-6">
                            <div className="flex items-center gap-3 border-b border-brand-secondary/5 pb-6">
                                <div className="p-2 bg-brand-secondary/5 rounded-xl text-brand-secondary">
                                    <Clock size={18} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary">Operational Timeline</h4>
                            </div>
                            <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-2.5 before:w-px before:bg-brand-secondary/10">
                                {/* Reported */}
                                <div className="relative pl-8 pb-6">
                                    <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-secondary ring-4 ring-white" />
                                    <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest mb-0.5">Reported</p>
                                    <p className="text-xs font-black text-brand-secondary">{new Date(report.created_at).toLocaleString()}</p>
                                </div>

                                {/* Assigned */}
                                {report.status !== 'reported' && (
                                    <div className="relative pl-8 pb-6">
                                        <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-4 ring-white" />
                                        <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest mb-0.5">Assigned to Field</p>
                                        <p className="text-xs font-black text-brand-secondary">
                                            {logs.find(l => typeof l.action_type === 'string' && l.action_type.includes('assigned'))?.created_at ? new Date(logs.find(l => typeof l.action_type === 'string' && l.action_type.includes('assigned'))!.created_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                )}

                                {/* Completed */}
                                {['resolved', 'RESOLVED', 'closed', 'CLOSED'].includes(report.status) && (
                                    <div className="relative pl-8">
                                        <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                                        <p className="text-[9px] font-black text-green-600/60 uppercase tracking-widest mb-0.5">Completion Verified</p>
                                        <p className="text-xs font-black text-green-600">
                                            {report.resolved_at ? new Date(report.resolved_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showVerifyModal && proofs.length > 0 && (
                    <ProofVerificationModal
                        reportId={id!}
                        proof={proofs[0]}
                        onSuccess={() => {
                            setShowVerifyModal(false);
                            fetchReportData();
                        }}
                        onClose={() => setShowVerifyModal(false)}
                    />
                )}

                {/* Lightbox Modal */}
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-secondary/95 backdrop-blur-xl"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button
                            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md"
                            onClick={() => setLightboxImage(null)}
                        >
                            <ArrowLeft size={16} /> Back to Details
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            src={lightboxImage}
                            alt="Resolution Proof Fullscreen"
                            className="max-w-full max-h-[90vh] rounded-[32px] shadow-2xl shadow-black/50 object-contain"
                            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking image
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </MinimalLayout>
    );
};
