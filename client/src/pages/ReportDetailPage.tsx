import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, MapPin, Clock, CheckCircle2,
    ShieldAlert, AlertTriangle, User,
    UserPlus, Edit3, Trash2, Layers
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { ReportTimeline } from '../components/reports/ReportTimeline';
import { CommentSection } from '../components/reports/CommentSection';
import { supabase } from '../services/supabase';
import { useReports, Report } from '../hooks/useReports';
import { format } from 'date-fns';

export const ReportDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [report, setReport] = useState<Report | null>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOverdue, getOverdueHours } = useReports();
    const navigate = useNavigate();

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);

        const { data: reportData } = await supabase
            .from('issues')
            .select('*, profiles:user_id(full_name)')
            .eq('id', id)
            .single();

        const { data: updateData } = await supabase
            .from('report_updates')
            .select('*, updated_by_profile:updated_by(full_name)')
            .eq('report_id', id)
            .order('created_at', { ascending: true });

        if (reportData) {
            const data = reportData as any;
            const formatted: any = {
                ...data,
                status: data.status === 'reported' ? 'open' : data.status,
                location: data.address || 'Tactical Origin',
                priority: data.severity >= 8 ? 'high' : data.severity >= 5 ? 'medium' : 'low',
                profiles: data.profiles
            };
            setReport(formatted);
        }
        if (updateData) setUpdates(updateData as any);
        setLoading(false);
    };

    useEffect(() => {
        fetchDetail();

        // Subscribe to status updates in realtime
        const channel = supabase
            .channel(`report-detail-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'issues',
                filter: `id=eq.${id}`
            }, () => fetchDetail())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id]);

    if (loading) return <div className="min-h-screen bg-brand-primary p-20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-secondary/20 border-t-brand-secondary rounded-full animate-spin" /></div>;
    if (!report) return <div className="min-h-screen bg-brand-primary p-20 text-center">Data Packet Corrupted.</div>;

    const overdue = isOverdue(report.created_at, report.status);

    const navItems = [
        { label: 'Dashboard', path: '/citizen', icon: Layers },
        { label: 'All Reports', path: '/reports', icon: Clock },
    ];

    return (
        <MinimalLayout navItems={navItems} title="Operational Intel">
            <div className="max-w-6xl mx-auto py-10 space-y-16">
                {/* Navigation & Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-brand-secondary/5 pb-12">
                    <div className="space-y-6">
                        <button
                            onClick={() => navigate('/reports')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 hover:text-brand-secondary transition-colors"
                        >
                            <ArrowLeft size={14} />
                            Return to Feed
                        </button>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h1 className="text-4xl md:text-5xl font-black text-brand-secondary uppercase tracking-tighter">
                                    {report.title}
                                </h1>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${report.status === 'resolved' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10'
                                    }`}>
                                    {(report.status === 'reported' ? 'open' : report.status).replace('_', ' ')}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">
                                <div className="flex items-center gap-2"><User size={14} className="opacity-30" />{report.profiles?.full_name}</div>
                                <div className="flex items-center gap-2"><MapPin size={14} className="opacity-30" />{report.location}</div>
                                <div className="flex items-center gap-2"><Clock size={14} className="opacity-30" />{format(new Date(report.created_at), 'MMMM dd, yyyy HH:mm')}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {overdue && (
                            <div className="minimal-card bg-red-500 text-white p-6 border-red-400 flex flex-col justify-center animate-pulse">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-1">
                                    <ShieldAlert size={16} />
                                    Overdue Protocol
                                </div>
                                <div className="text-2xl font-black">+{getOverdueHours(report.created_at)}H</div>
                            </div>
                        )}
                        <div className="minimal-card p-6 border-brand-secondary/5 flex flex-col justify-center">
                            <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 mb-1">Priority Vector</div>
                            <div className={`text-2xl font-black uppercase tracking-tighter ${(report.priority || (report.severity >= 8 ? 'high' : 'medium')) === 'high' ? 'text-brand-secondary' : 'text-brand-secondary/40'
                                }`}>
                                {report.priority || (report.severity >= 8 ? 'high' : 'medium')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                    {/* Left Panel: Details & Timeline */}
                    <div className="lg:col-span-7 space-y-20">
                        {/* Summary */}
                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter flex items-center gap-3">
                                    <Layers size={24} className="text-brand-secondary/20" />
                                    Tactical Intel
                                </h3>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/20">
                                    Ref: {report.id.split('-')[0]}
                                </div>
                            </div>

                            <div className="minimal-card p-0 rounded-3xl overflow-hidden border-brand-secondary/5 bg-white shadow-2xl shadow-brand-secondary/5">
                                {report.image_url && (
                                    <div className="aspect-video w-full overflow-hidden border-b border-brand-secondary/5">
                                        <img src={report.image_url} alt="Intel Evidence" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-10">
                                    <p className="text-base font-bold text-brand-secondary uppercase tracking-tight leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="space-y-12">
                            <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter flex items-center gap-3">
                                <Clock size={24} className="text-brand-secondary/20" />
                                Operational Timeline
                            </h3>
                            <ReportTimeline updates={updates} />
                        </section>
                    </div>

                    {/* Right Panel: Social & Ops */}
                    <div className="lg:col-span-5 space-y-20">

                        {/* Discussion */}
                        <CommentSection reportId={id!} />
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};
