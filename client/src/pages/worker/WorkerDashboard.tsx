import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Star, RefreshCcw, CheckCircle, Briefcase, MapPin, Clock, ArrowRight, AlertTriangle, RotateCcw, Activity } from 'lucide-react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { useWorkerData } from '../../hooks/useWorkerData';
import { useAuth } from '../../hooks/useAuth';

// Deadline helper
const getDeadlineDisplay = (task: any) => {
    const deadline = task.report_assignments?.[0]?.deadline;
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl.getTime() - now.getTime();
    if (diffMs <= 0) return { label: 'EXPIRED', expired: true };
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    return { label: `${hrs}h left`, expired: false };
};

export const WorkerDashboard: React.FC = () => {
    const { profile } = useAuth();
    const { metrics, assignments, loading } = useWorkerData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    if (loading && !metrics) {
        return (
            <WorkerLayout title="Worker Dashboard">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    const badgeTitle = metrics?.badge_level || 'Probation Worker';
    const completionRate = metrics?.total_assigned ? Math.round((metrics.total_resolved / metrics.total_assigned) * 100) : 0;

    const pendingTasks = assignments.filter(a =>
        ['assigned', 'in_progress', 'reopened', 'awaiting_verification', 'under_review'].includes(a.status as string)
    );
    const completedTasks = assignments.filter(a =>
        ['resolved', 'closed'].includes(a.status as string)
    );

    const currentDisplayTasks = activeTab === 'pending' ? pendingTasks : completedTasks;

    const highPriority = currentDisplayTasks.filter(a => ['Urgent', 'High', 'Critical'].includes(a.priority as string));
    const mediumPriority = currentDisplayTasks.filter(a => a.priority === 'Medium');
    const lowPriority = currentDisplayTasks.filter(a => a.priority === 'Low');
    const otherTasks = currentDisplayTasks.filter(a => !['Urgent', 'High', 'Critical', 'Medium', 'Low'].includes(a.priority as string));

    const renderCard = (task: any, colorClass: string) => {
        const deadline = getDeadlineDisplay(task);
        const isRework = task.status === 'reopened';

        return (
            <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl border ${colorClass} bg-white shadow-soft flex flex-col h-full relative overflow-hidden`}
            >
                {/* Rework badge */}
                {isRework && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                        <RotateCcw size={10} /> Rework
                    </div>
                )}

                <div className="flex gap-2 mb-3 flex-wrap pr-20">
                    <span className="px-3 py-1 bg-brand-secondary text-brand-primary font-black uppercase tracking-widest text-[9px] rounded-full">
                        {task.priority || 'Medium'}
                    </span>
                    <span className="px-3 py-1 bg-brand-secondary/5 text-brand-secondary/60 font-black uppercase tracking-widest text-[9px] rounded-full border border-brand-secondary/10">
                        {task.category || 'General'}
                    </span>
                </div>

                {/* Issue thumbnail */}
                {task.image_url && (
                    <div className="w-full h-28 rounded-2xl overflow-hidden mb-3 border border-brand-secondary/5 shrink-0">
                        <img src={task.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                )}

                <h4 className="font-black text-brand-secondary text-lg uppercase tracking-tighter line-clamp-2 mb-2">
                    {task.title || 'Classified Incident'}
                </h4>

                <div className="space-y-1.5 mt-auto mb-4">
                    <div className="flex items-center gap-2 text-brand-secondary/60 text-[10px] uppercase font-bold tracking-widest">
                        <MapPin size={11} className="text-brand-secondary/40 shrink-0" />
                        <span className="truncate">{task.address || 'Location Encrypted'}</span>
                    </div>
                    {/* Deadline display */}
                    {deadline && (
                        <div className={`flex items-center gap-2 text-[10px] uppercase font-black tracking-widest ${deadline.expired ? 'text-red-500' : 'text-amber-600'}`}>
                            <Clock size={11} className="shrink-0" />
                            <span>{deadline.expired ? '⚠ DEADLINE EXPIRED' : `⏱ ${deadline.label}`}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => navigate(`/worker/works/${task.id}`)}
                    className={`mt-auto w-full py-3 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 ${isRework
                        ? 'bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-200'
                        : 'bg-brand-secondary/5 hover:bg-brand-secondary hover:text-white text-brand-secondary'
                        }`}
                >
                    {isRework ? <><RotateCcw size={14} /> View Rework</> : <>View Task <ArrowRight size={14} /></>}
                </button>
            </motion.div>
        );
    };

    return (
        <WorkerLayout title="Worker Dashboard">
            <div className="max-w-6xl mx-auto py-8">

                {/* 1. Badge Panel */}
                <div className="bg-brand-secondary rounded-[40px] p-8 md:p-10 mb-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                    <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                        <div className="w-24 h-24 rounded-full bg-brand-primary flex items-center justify-center text-brand-secondary font-black text-3xl shadow-lg border-4 border-white/10 shrink-0">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                profile?.full_name?.[0] || 'H'
                            )}
                        </div>
                        <div>
                            <div className="px-3 py-1 bg-brand-primary text-brand-secondary rounded-lg font-black text-[10px] uppercase tracking-widest mb-2 inline-block">
                                REAL HERO
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                                {profile?.full_name || 'Hero Operative'}
                                <Star className="text-yellow-400" size={24} fill="currentColor" />
                            </h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 font-bold text-yellow-400 text-sm">
                                    <Star size={14} fill="currentColor" /> 4.8 Rating
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto z-10">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-2xl font-black">{metrics?.total_resolved || 82}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50">Tasks Completed</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-2xl font-black">{assignments.length || 3}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50">Active Tasks</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-2xl font-black">91%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50">On Time Rate</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                            <div className="text-2xl font-black">{metrics?.rework_count || 4}%</div>
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-50">Rework Rate</div>
                        </div>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex items-center gap-4 mb-10 bg-brand-secondary/5 p-2 rounded-[24px] w-fit border border-brand-secondary/5">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending'
                            ? 'bg-brand-secondary text-white shadow-lg'
                            : 'text-brand-secondary/40 hover:text-brand-secondary hover:bg-brand-secondary/5'
                            }`}
                    >
                        Pending Ops ({pendingTasks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'completed'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'text-brand-secondary/40 hover:text-brand-secondary hover:bg-brand-secondary/5'
                            }`}
                    >
                        Completed ({completedTasks.length})
                    </button>
                </div>

                {/* 2. Task Grids */}
                <div className="space-y-12">
                    {/* Other/Uncategorized Priority (to be safe) */}
                    {otherTasks.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 mb-6 font-black text-brand-secondary/60 uppercase tracking-widest text-sm">
                                <Activity size={18} /> Classified Directives ({otherTasks.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherTasks.map(t => renderCard(t, "border-brand-secondary/10 hover:border-brand-secondary/20 hover:-translate-y-1 transition-all"))}
                            </div>
                        </section>
                    )}
                    {/* High Priority */}
                    {highPriority.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 mb-6 font-black text-red-600 uppercase tracking-widest text-sm">
                                <AlertTriangle size={18} /> High Priority Alert ({highPriority.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {highPriority.map(t => renderCard(t, "border-red-500/20 hover:border-red-500/40 hover:-translate-y-1 transition-all"))}
                            </div>
                        </section>
                    )}

                    {/* Medium Priority */}
                    {mediumPriority.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 mb-6 font-black text-amber-500 uppercase tracking-widest text-sm">
                                <Clock size={18} /> Medium Priority Queue ({mediumPriority.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mediumPriority.map(t => renderCard(t, "border-amber-500/20 hover:border-amber-500/40 hover:-translate-y-1 transition-all"))}
                            </div>
                        </section>
                    )}

                    {/* Low Priority */}
                    {lowPriority.length > 0 && (
                        <section>
                            <h3 className="flex items-center gap-2 mb-6 font-black text-green-600 uppercase tracking-widest text-sm">
                                <CheckCircle size={18} /> Standard Operations ({lowPriority.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {lowPriority.map(t => renderCard(t, "border-green-500/20 hover:border-green-500/40 hover:-translate-y-1 transition-all"))}
                            </div>
                        </section>
                    )}

                    {currentDisplayTasks.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft">
                            <Shield className="w-16 h-16 text-brand-secondary/10 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase mb-2">No {activeTab} Intelligence</h3>
                            <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-widest">Awaiting field directives for this sector.</p>
                        </div>
                    )}
                </div>

            </div>
        </WorkerLayout>
    );
};
