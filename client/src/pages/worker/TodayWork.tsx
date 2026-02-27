import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { useWorkerData } from '../../hooks/useWorkerData';
import { MapPin, Clock, ArrowRight, Shield, RotateCcw, AlertTriangle } from 'lucide-react';

const getDeadlineDisplay = (task: any): { label: string; expired: boolean } | null => {
    const deadline = task.report_assignments?.[0]?.deadline;
    if (!deadline) return null;
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) return { label: 'EXPIRED', expired: true };
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `${hrs}h ${mins}m remaining`, expired: false };
};

const getPriorityBg = (priority: string) => {
    switch (priority) {
        case 'Critical': return 'border-red-400/30 bg-red-50';
        case 'High': return 'border-orange-400/30 bg-orange-50/30';
        case 'Medium': return 'border-amber-400/30 bg-amber-50/30';
        default: return 'border-brand-secondary/10 bg-white';
    }
};

export const TodayWork: React.FC = () => {
    const { assignments, loading } = useWorkerData();
    const navigate = useNavigate();

    if (loading) {
        return (
            <WorkerLayout title="Today's Work">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    return (
        <WorkerLayout title="Today's Work">
            <div className="max-w-5xl mx-auto py-8">

                {/* Header */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-black text-brand-secondary uppercase tracking-tighter">Today's Work</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">
                            {assignments.length} Active Mission{assignments.length !== 1 ? 's' : ''} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>
                    {assignments.some(a => a.status === 'reopened') && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-200 rounded-full text-red-700 text-[10px] font-black uppercase tracking-widest">
                            <RotateCcw size={12} /> {assignments.filter(a => a.status === 'reopened').length} Rework Required
                        </div>
                    )}
                </div>

                {/* Task List */}
                {assignments.length === 0 ? (
                    <div className="py-24 text-center rounded-[40px] border border-dashed border-brand-secondary/10 bg-brand-secondary/[0.02]">
                        <Shield size={48} className="mx-auto mb-4 text-brand-secondary/20" />
                        <h3 className="text-xl font-black text-brand-secondary/30 uppercase tracking-tight">No Active Assignments</h3>
                        <p className="text-[10px] font-bold text-brand-secondary/20 uppercase tracking-widest mt-2">Check back later for new missions.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((task: any, i: number) => {
                            const deadline = getDeadlineDisplay(task);
                            const isRework = task.status === 'reopened';
                            const isWaiting = task.status === 'awaiting_verification';

                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => navigate(`/worker/works/${task.id}`)}
                                    className={`group p-0 rounded-3xl border-2 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-xl ${getPriorityBg(task.priority || 'Low')} ${isRework ? 'border-red-400/50' : ''}`}
                                >
                                    {/* Image */}
                                    <div className="w-full sm:w-48 h-32 sm:h-auto bg-brand-secondary/10 shrink-0 relative overflow-hidden">
                                        {task.image_url ? (
                                            <img src={task.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                                <Shield size={32} />
                                            </div>
                                        )}
                                        {/* Priority ribbon */}
                                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${task.priority === 'Critical' || task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-brand-secondary'}`}>
                                            {task.priority || 'Low'}
                                        </div>
                                        {isRework && (
                                            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white bg-red-500 animate-pulse">
                                                <RotateCcw size={9} /> Rework
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 px-2 py-0.5 bg-brand-secondary/5 rounded">
                                                    {task.category || 'General'}
                                                </span>
                                                {task.risk_score && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                                                        Risk: {Math.round(task.risk_score * 100)}%
                                                    </span>
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isRework ? 'bg-red-100 text-red-600' : isWaiting ? 'bg-blue-100 text-blue-600' : 'bg-brand-secondary/5 text-brand-secondary/60'}`}>
                                                    {task.status?.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-brand-secondary uppercase tracking-tight line-clamp-2">
                                                {task.title}
                                            </h4>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-brand-secondary/5">
                                            <div className="flex flex-wrap items-center gap-5">
                                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                                                    <MapPin size={11} /> {task.address?.split(',')[0] || 'Unknown'}
                                                </span>
                                                {deadline && (
                                                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${deadline.expired ? 'text-red-500' : 'text-amber-600'}`}>
                                                        <Clock size={11} />
                                                        {deadline.expired ? '⚠ EXPIRED' : deadline.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-secondary/50 group-hover:text-brand-secondary transition-colors">
                                                {isRework ? <>Rework <RotateCcw size={12} /></> : <>View Task <ArrowRight size={12} /></>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </WorkerLayout>
    );
};
