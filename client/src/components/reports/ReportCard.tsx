import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, MessageSquare, CheckCircle, AlertTriangle, User, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Report } from '../../hooks/useReports';
import { InlineAlertMap } from '../citizen/InlineAlertMap';

interface ReportCardProps {
    report: Report;
    isOverdue: boolean;
    overdueHours: number;
    onClick: (id: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, isOverdue, overdueHours, onClick }) => {
    const [showMap, setShowMap] = useState(false);

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
        reported: { label: 'Open', color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10', icon: null },
        open: { label: 'Open', color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10', icon: null },
        assigned: { label: 'Assigned', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20', icon: null },
        in_progress: { label: 'In P.', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', icon: null },
        awaiting_verification: { label: 'Review', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: null },
        under_review: { label: 'Review', color: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: null },
        reopened: { label: 'Reop.', color: 'bg-red-500/10 text-red-700 border-red-500/20', icon: <AlertTriangle size={14} className="mr-1" /> },
        resolved: { label: 'Resolv.', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> },
        RESOLVED: { label: 'Resolv.', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> },
        closed: { label: 'Closed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: <CheckCircle size={14} className="mr-1" /> }
    };

    const config = statusConfig[report.status] || {
        label: report.status.toUpperCase(),
        color: 'bg-brand-secondary/5 text-brand-secondary border-brand-secondary/10',
        icon: null
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`minimal-card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 overflow-hidden group hover:shadow-2xl hover:shadow-brand-secondary/5 transition-all duration-500 relative bg-white border border-brand-secondary/5 rounded-3xl ${isOverdue ? 'border-red-500/30 shadow-lg shadow-red-500/5' : ''}`}
        >
            {/* Status Indicator */}
            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl border-l border-b flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] ${config.color}`}>
                {config.icon}
                {config.label}
            </div>

            {/* Initial Column: Dates and Risk */}
            <div className="shrink-0 flex flex-row md:flex-col gap-6 md:w-40 border-b md:border-b-0 md:border-r border-brand-secondary/5 pb-6 md:pb-0 md:pr-6 justify-between md:justify-start">
                <div className="space-y-6 flex-1 md:flex-none">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                            <Clock size={12} />
                            Reported
                        </div>
                        <p className="text-sm font-black text-brand-secondary uppercase tracking-tighter">
                            {format(new Date(report.created_at), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-[10px] font-bold text-brand-secondary/50 uppercase tracking-tight">
                            {formatDistanceToNow(new Date(report.created_at))} ago
                        </p>
                    </div>

                    <div className="space-y-1 pt-6 border-t border-brand-secondary/5">
                        <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                            <ShieldAlert size={12} />
                            Risk Factor
                        </div>
                        <div className="flex items-end gap-1">
                            <p className={`text-2xl font-black uppercase tracking-tighter ${report.severity >= 8 ? 'text-red-500' : report.severity >= 5 ? 'text-orange-500' : 'text-brand-secondary'}`}>
                                {report.risk_score ? Math.round(report.risk_score * 100) : (report.severity * 10)}%
                            </p>
                            {report.severity >= 8 && <div className="w-1.5 h-1.5 mb-2 rounded-full bg-red-500 animate-ping" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Column: Details + Reporter */}
            <div className="flex-1 space-y-6 flex flex-col justify-between" onClick={() => onClick(report.id)}>
                <div className="cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-3 bg-brand-secondary/5 p-2 rounded-2xl pr-4 border border-brand-secondary/5">
                            <div className="w-8 h-8 rounded-xl bg-brand-secondary/10 flex items-center justify-center overflow-hidden">
                                {report.profiles?.avatar_url ? (
                                    <img src={report.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={14} className="text-brand-secondary/40" />
                                )}
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest leading-none">Reporter</p>
                                <p className="text-[10px] font-black text-brand-secondary uppercase tracking-tight mt-0.5">{report.profiles?.full_name || 'Anonymous Operator'}</p>
                            </div>
                        </div>

                        {isOverdue && (
                            <div className="bg-red-500/10 flex items-center gap-2 text-red-600 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl border border-red-500/20 animate-pulse">
                                Overdue {overdueHours}H
                            </div>
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tight leading-none group-hover:text-brand-primary transition-colors duration-300 mb-3">
                        {report.title}
                    </h3>
                    <p className="text-brand-secondary/60 font-medium leading-relaxed text-sm line-clamp-2">
                        {report.description}
                    </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-brand-secondary/5">
                    <div className="flex items-center gap-4 p-4 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/5 group-hover:bg-brand-secondary/10 transition-colors">
                        <div className="w-8 h-8 bg-brand-secondary text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                        </div>
                        <div className="flex-1 min-w-0 pointer-events-none">
                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Geolocation</p>
                            <p className="text-[11px] font-black text-brand-secondary uppercase tracking-wide truncate pr-4">{report.location || 'Tactical Origin'}</p>
                        </div>
                        {report.latitude && report.longitude && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMap(!showMap);
                                }}
                                className={`shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 relative z-10 ${showMap
                                    ? 'bg-brand-secondary text-brand-primary border-brand-secondary'
                                    : 'bg-white text-brand-secondary border-brand-secondary/10 hover:border-brand-secondary/30'
                                    }`}
                            >
                                <MapIcon size={12} />
                                {showMap ? 'Hide visual' : 'View Section'}
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {showMap && report.latitude && report.longitude && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <InlineAlertMap
                                    lat={report.latitude}
                                    lng={report.longitude}
                                    address={report.location}
                                    title={report.title}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Column: Image & Quick Stats */}
            <div className="shrink-0 w-full md:w-64 max-w-full flex flex-col gap-4 justify-between cursor-pointer" onClick={() => onClick(report.id)}>
                <div className="aspect-[4/3] md:aspect-square bg-brand-secondary/5 rounded-2xl overflow-hidden relative shadow-inner">
                    <img
                        src={report.image_url || 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&w=800&q=80'}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-brand-secondary/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>

                <div className="flex items-center justify-between px-2 text-brand-secondary/40">
                    <div className="flex items-center gap-1.5 hover:text-brand-primary transition-colors">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{report.comments_count} Comms</span>
                    </div>
                    {report.assigned_workers && report.assigned_workers.length > 0 && (
                        <div className="flex -space-x-2">
                            {report.assigned_workers.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-brand-secondary/10 flex items-center justify-center shadow-sm">
                                    <User size={10} className="text-brand-secondary/40" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
