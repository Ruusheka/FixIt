import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, MessageSquare, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Report } from '../../hooks/useReports';

interface ReportCardProps {
    report: Report;
    isOverdue: boolean;
    overdueHours: number;
    onClick: (id: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, isOverdue, overdueHours, onClick }) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        reported: { label: 'Open', color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10', icon: null },
        open: { label: 'Open', color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10', icon: null },
        assigned: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: null },
        in_progress: { label: 'In Progress', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', icon: null },
        awaiting_verification: { label: 'Review', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: null },
        under_review: { label: 'Review', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: null },
        reopened: { label: 'Reopened', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <AlertTriangle size={14} className="mr-1" /> },
        resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> },
        RESOLVED: { label: 'Resolved', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> },
        closed: { label: 'Closed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> }
    };

    const config = statusConfig[report.status] || {
        label: report.status.toUpperCase(),
        color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10',
        icon: null
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={() => onClick(report.id)}
            className={`minimal-card flex flex-col cursor-pointer overflow-hidden ${isOverdue ? 'border-red-500/30 shadow-lg shadow-red-500/5' : ''}`}
        >
            {/* Header: User Info */}
            <div className="p-4 flex items-center justify-between border-b border-brand-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-secondary/5 flex items-center justify-center overflow-hidden border border-brand-secondary/10">
                        {report.profiles?.avatar_url ? (
                            <img src={report.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User size={16} className="text-brand-secondary/40" />
                        )}
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">
                            {report.profiles?.full_name || 'Anonymous Operator'}
                        </div>
                        <div className="text-[9px] font-bold text-brand-secondary/30 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(report.created_at))} ago
                        </div>
                    </div>
                </div>
                {isOverdue && (
                    <div className="bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md animate-pulse">
                        Overdue {overdueHours}h
                    </div>
                )}
            </div>

            {/* Image Section */}
            <div className="aspect-square bg-brand-secondary/5 relative overflow-hidden group">
                <img
                    src={report.image_url || 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&w=800&q=80'}
                    alt={report.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-brand-secondary/5 group-hover:bg-transparent transition-colors" />

                {/* Status Overlay */}
                <div className="absolute top-4 right-4">
                    <div className={`badge-tonal ${config.color} flex items-center shadow-lg border-white/20 backdrop-blur-md`}>
                        {config.icon}
                        {config.label}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter mb-2 line-clamp-1">
                    {report.title}
                </h3>
                <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-tight line-clamp-2 mb-4 leading-relaxed">
                    {report.description}
                </p>

                <div className="mt-auto pt-4 border-t border-brand-secondary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                        <MapPin size={12} className="text-brand-secondary/20" />
                        {report.location || 'Tactical Origin'}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-brand-secondary/40">
                            <MessageSquare size={14} />
                            <span className="text-[10px] font-black">{report.comments_count}</span>
                        </div>
                        <div className="flex -space-x-2">
                            {report.assigned_workers?.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-brand-secondary/10 flex items-center justify-center">
                                    <User size={10} className="text-brand-secondary/40" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
