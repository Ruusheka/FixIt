import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin,
    User,
    Clock,
    MessageSquare,
    History,
    AlertCircle,
    ShieldAlert,
    ChevronRight,
    Activity,
    Zap,
    Sparkles
} from 'lucide-react';
import { Report } from '../../types/reports';
import { Link } from 'react-router-dom';

interface AdminReportCardProps {
    report: Report;
    bulkMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
    viewMode?: 'grid' | 'list';
}

export const AdminReportCard: React.FC<AdminReportCardProps> = ({
    report,
    bulkMode,
    isSelected,
    onSelect,
    viewMode = 'grid'
}) => {
    const isOverdue = useMemo(() => {
        if (report.status === 'closed') return false;
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours > 72;
    }, [report.created_at, report.status]);

    const overdueHours = useMemo(() => {
        if (!isOverdue) return 0;
        const createdAt = new Date(report.created_at);
        const now = new Date();
        return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) - 72);
    }, [isOverdue, report.created_at]);

    const timeAgo = useMemo(() => {
        const createdAt = new Date(report.created_at);
        const now = new Date();
        const diffMin = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return `${Math.floor(diffHrs / 24)}d ago`;
    }, [report.created_at]);

    const statusColors: Record<string, string> = {
        reported: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10',
        assigned: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
        in_progress: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
        awaiting_verification: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        reopened: 'bg-red-500/10 text-red-700 border-red-500/20',
        closed: 'bg-green-500/10 text-green-700 border-green-500/20',
    };

    const priorityColors: Record<string, string> = {
        Low: 'border-blue-500/10 text-blue-500',
        Medium: 'border-brand-secondary/10 text-brand-secondary/60',
        High: 'border-orange-500/10 text-orange-500',
        Urgent: 'border-red-500/10 text-red-500 font-bold',
        Critical: 'border-red-700/20 text-red-700 bg-red-50 font-bold',
    };

    const isGrid = viewMode === 'grid';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`relative group bg-white rounded-3xl p-6 border transition-all duration-300 ${isOverdue && report.status !== 'closed'
                ? 'border-red-500/20 shadow-lg shadow-red-500/5'
                : 'border-brand-secondary/5 shadow-soft hover:shadow-card-hover'
                } ${isSelected ? 'ring-2 ring-brand-secondary ring-offset-2' : ''}`}
        >
            {bulkMode && (
                <div className="absolute top-4 right-4 z-10 transition-all">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect?.(report.id)}
                        className="w-5 h-5 rounded-lg border-brand-secondary/20 text-brand-secondary focus:ring-brand-secondary appearance-none checked:bg-brand-secondary checked:border-transparent transition-all cursor-pointer bg-brand-primary/10"
                    />
                </div>
            )}

            <Link to={`/admin/reports/${report.id}`} className="block h-full">
                <div className={`flex ${isGrid ? 'flex-col space-y-4' : 'flex-col md:flex-row md:items-center gap-4 md:gap-8'} h-full`}>

                    {/* Visual Evidence Preview */}
                    {report.image_url && (
                        <div className={`${isGrid ? 'w-full h-32' : 'w-full md:w-48 h-32 flex-shrink-0'} rounded-2xl overflow-hidden border border-brand-secondary/10 bg-brand-primary/5`}>
                            <img
                                src={report.image_url}
                                alt={report.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}

                    <div className="flex-1 flex flex-col space-y-4 min-w-0">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusColors[report.status]}`}>
                                {report.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] border rounded-lg ${priorityColors[report.priority] || 'border-brand-secondary/10 text-brand-secondary/60'}`}>
                                {report.priority}
                            </span>

                            {/* Risk Score Badge */}
                            {(report.risk_score_int !== undefined || report.risk_score) && (() => {
                                const score = report.risk_score_int ?? Math.round((report.risk_score || 0) * 100);
                                const riskClass = score >= 80 ? 'bg-red-500 text-white' :
                                    score >= 60 ? 'bg-orange-500 text-white' :
                                        score >= 30 ? 'bg-yellow-500 text-brand-secondary' :
                                            'bg-green-500 text-white';
                                return (
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 ${riskClass}`}>
                                        <Activity size={9} />
                                        Risk {score}
                                    </span>
                                );
                            })()}

                            {report.is_escalated && (
                                <span className="px-2 py-0.5 bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 shadow-md shadow-red-700/10">
                                    <ShieldAlert size={10} /> {report.is_auto_escalated ? 'Auto-Escalated' : 'Escalated'}
                                </span>
                            )}
                            {report.ai_generated && (
                                <span className="px-2 py-0.5 bg-brand-secondary/5 text-brand-secondary text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 border border-brand-secondary/10">
                                    <Sparkles size={9} /> AI
                                </span>
                            )}
                            {isOverdue && (
                                <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                    <AlertCircle size={10} /> Overdue
                                </span>
                            )}
                        </div>

                        {/* Heading */}
                        <div className="min-w-0">
                            <h3 className="text-xl font-black text-brand-secondary tracking-tight group-hover:text-brand-secondary/80 transition-colors line-clamp-1">
                                {report.title}
                            </h3>
                            <p className={`text-sm text-brand-secondary/40 font-medium ${isGrid ? 'line-clamp-2 mt-1 min-h-[40px]' : 'line-clamp-1 mt-0.5'}`}>
                                {report.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Location & Metadata */}
                        <div className={`grid ${isGrid ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} gap-4 pb-4 border-b border-brand-secondary/5`}>
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary/40">
                                <MapPin size={14} className="shrink-0" />
                                <span className="truncate">{report.address || 'Unknown Location'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary/40">
                                <Clock size={14} className="shrink-0" />
                                <span className="truncate">{timeAgo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary/40" title={report.reporter?.email || 'Anonymous'}>
                                <User size={14} className="shrink-0" />
                                <span className="truncate">
                                    {report.reporter?.full_name || (report.reporter?.email ? report.reporter.email.split('@')[0] : 'Anonymous')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-brand-secondary/30" title="Comments">
                                <MessageSquare size={14} />
                                <span className="text-[10px] font-black">{report.comments_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-brand-secondary/30" title="Timeline Updates">
                                <History size={14} />
                                <span className="text-[10px] font-black">{report.updates_count || 0}</span>
                            </div>
                        </div>

                        <div className="flex items-center -space-x-2">
                            {report.assignments?.slice(0, 3).map((a, i) => (
                                <div
                                    key={i}
                                    className="w-7 h-7 rounded-full border-2 border-white bg-brand-primary flex items-center justify-center overflow-hidden shadow-sm"
                                    title={a.worker.full_name || a.worker.email}
                                >
                                    <span className="text-[10px] font-black text-brand-secondary/40">
                                        {(a.worker.full_name?.[0] || a.worker.email[0]).toUpperCase()}
                                    </span>
                                </div>
                            ))}
                            {report.assignments && report.assignments.length > 3 && (
                                <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-secondary/5 flex items-center justify-center shadow-sm">
                                    <span className="text-[8px] font-black text-brand-secondary/40">+{report.assignments.length - 3}</span>
                                </div>
                            )}
                            {(!report.assignments || report.assignments.length === 0) && (
                                <span className="text-[10px] font-black text-brand-secondary/20 italic tracking-wider">UNASSIGNED</span>
                            )}
                        </div>
                    </div>

                    {isOverdue && (
                        <div className="mt-2 pt-2 border-t border-red-500/10">
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                Overdue by {overdueHours} hours
                            </p>
                        </div>
                    )}

                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-secondary text-white p-1 rounded-full shadow-lg">
                        <ChevronRight size={16} />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
