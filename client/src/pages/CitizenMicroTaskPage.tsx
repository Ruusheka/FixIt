import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Target, Image as ImageIcon, BarChart2, ClipboardCheck,
    Clock, CheckCircle2, Lock, MapPin, Zap, Users,
    Star, Trophy, Eye, CheckCheck, Sparkles,
    LayoutDashboard, Globe, FileText, Bell, ChevronRight, Camera, Award
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { useMicrotasks, Microtask } from '../hooks/useMicrotasks';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

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
    poll: { label: 'Quick Survey', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    report_review: { label: 'Audit Mission', icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    future_inspection: { label: 'Site Check', icon: Eye, color: 'text-green-500', bg: 'bg-green-500/10' },
};

const LEVEL_COLORS: Record<string, string> = {
    'Civic Hero Level 1': 'from-slate-400 to-slate-600',
    'Civic Hero Level 2': 'from-blue-400 to-blue-600',
    'Civic Hero Level 3': 'from-purple-400 to-purple-600',
    'Civic Hero Level 4': 'from-amber-400 to-amber-600',
};

export const CitizenMicroTaskPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { tasks, loading, leaderboard, getMyResponse } = useMicrotasks('citizen', user?.id);

    const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

    // Get my civic points from leaderboard
    const myPoints = leaderboard.find(e => e.citizen_id === user?.id);

    const openTasks = tasks.filter(t => t.status === 'open');
    const closedTasks = tasks.filter(t => t.status !== 'open');
    const displayTasks = activeTab === 'open' ? openTasks : closedTasks;

    const myCompletedCount = tasks.filter(t => t.responses?.some(r => r.citizen_id === user?.id)).length;

    return (
        <MinimalLayout navItems={citizenNavItems} title="Mission Hub">
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pb-24">

                {/* ── HERO ── */}
                <section className="relative rounded-[40px] overflow-hidden bg-brand-secondary p-6 md:p-10 text-white shadow-2xl">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="inline-block w-10 h-10 border border-white/30 text-[7px] font-black text-center leading-10">{(Math.random() * 99).toFixed(0)}</div>
                        ))}
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase tracking-widest">
                                <Target size={12} className="text-brand-primary" /> Civic Intel Network
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">OPERATIONS CENTER</h1>
                            <p className="text-white/50 font-bold text-sm max-w-md">Ground-level missions deployed by Central Command. Your participation keeps the city running.</p>
                        </div>

                        {/* Civic Hero Card */}
                        <div className={`shrink-0 w-64 p-6 rounded-[32px] bg-gradient-to-br ${LEVEL_COLORS[myPoints?.level || 'Civic Hero Level 1']} text-white shadow-2xl border border-white/10`}>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                                <Trophy size={10} /> HERO STATUS
                            </p>
                            <p className="text-4xl font-black mt-2 tracking-tighter">{myPoints?.total_points || 0} <span className="text-[12px] opacity-60 tracking-normal">PTS</span></p>
                            <p className="text-[10px] font-black uppercase mt-1 tracking-widest">{myPoints?.level || 'Civic Hero Level 1'}</p>
                            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_white]" style={{ width: `${Math.min(((myPoints?.total_points || 0) % 250) / 250 * 100, 100)}%` }} />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">{myPoints?.badge || 'Recruit'} Badge</p>
                                <Sparkles size={12} className="text-white/40" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── QUICK STATS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Completed Missions', value: myCompletedCount, icon: CheckCheck, color: 'text-green-500' },
                        { label: 'Ground Intel Points', value: myPoints?.total_points || 0, icon: Star, color: 'text-amber-500' },
                        { label: 'Available Operations', value: openTasks.length, icon: Zap, color: 'text-blue-500' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="minimal-card p-6 flex items-center gap-5 border-l-4 border-l-brand-secondary/5 hover:border-l-brand-primary transition-all">
                            <div className={`w-14 h-14 rounded-2xl bg-brand-secondary/5 flex items-center justify-center ${s.color} shadow-inner`}>
                                <s.icon size={24} />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-brand-secondary tracking-tighter">{s.value}</p>
                                <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mt-0.5">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ── TASKS GRID ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="flex items-center gap-2 bg-brand-secondary/5 p-1.5 rounded-2xl w-fit border border-brand-secondary/5 shadow-inner">
                            {[
                                { id: 'open', label: `Active Ops (${openTasks.length})` },
                                { id: 'closed', label: `Archive (${closedTasks.length})` },
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-secondary text-white shadow-xl' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-40 rounded-[32px] bg-brand-secondary/5 animate-pulse" />)}</div>
                        ) : displayTasks.length === 0 ? (
                            <div className="minimal-card p-24 text-center flex flex-col items-center gap-6 border-dashed border-brand-secondary/10">
                                <Target size={48} className="text-brand-secondary/10" />
                                <p className="text-[11px] font-black text-brand-secondary/20 uppercase tracking-[0.3em]">Sector Clear. No current missions.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {displayTasks.map((task, i) => {
                                    const typeConf = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.image;
                                    const myResponse = getMyResponse(task, user?.id || '');
                                    const isExpired = task.status !== 'open';
                                    const hasResponded = !!myResponse;
                                    const Icon = typeConf.icon;

                                    return (
                                        <motion.div key={task.id}
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => navigate(`/citizen/micro-tasks/${task.id}`)}
                                            className={`minimal-card p-0 cursor-pointer group transition-all hover:scale-[1.01] hover:shadow-2xl active:scale-[0.99] border-2 ${hasResponded ? 'border-green-500/20 bg-green-50/20' : 'border-transparent hover:border-brand-primary/20'} overflow-hidden h-44 flex relative shadow-xl`}
                                        >
                                            {/* Mission Tag */}
                                            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest z-10 ${hasResponded ? 'bg-green-500 text-white shadow-lg' : isExpired ? 'bg-brand-secondary/10 text-brand-secondary/30' : 'bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20 animate-pulse'}`}>
                                                {hasResponded ? 'Complete' : isExpired ? 'Closed' : 'Available'}
                                            </div>

                                            {/* Side Accent */}
                                            <div className={`w-3 h-full shrink-0 ${hasResponded ? 'bg-green-500' : 'bg-brand-secondary/10 group-hover:bg-brand-primary'} transition-colors duration-500`} />

                                            <div className="flex-1 p-8 flex flex-col justify-between">
                                                <div className="flex items-start gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${typeConf.color} ${typeConf.bg} shadow-inner`}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${typeConf.color} ${typeConf.bg}`}>
                                                                {typeConf.label}
                                                            </span>
                                                            {hasResponded && (
                                                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] bg-green-500 text-white">
                                                                    <CheckCheck size={10} /> {myResponse.approved ? 'Verified' : 'Submitted'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight leading-none group-hover:text-brand-primary transition-colors">{task.title}</h3>
                                                        <p className="text-sm text-brand-secondary/50 font-medium line-clamp-1 mt-2">{task.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={12} /> {isExpired ? 'Mission Ended' : task.end_time ? formatDistanceToNow(new Date(task.end_time), { addSuffix: true }) : 'Continuous'}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={12} /> {task.response_count || 0} Citizens Deployed
                                                    </div>
                                                    {task.latitude && <div className="flex items-center gap-2"><MapPin size={12} /> Geotagged</div>}
                                                </div>
                                            </div>

                                            <div className="w-24 shrink-0 flex flex-col items-center justify-center border-l border-brand-secondary/5 bg-brand-secondary/[0.01] group-hover:bg-white transition-colors gap-2">
                                                <Zap size={20} className="text-amber-500" fill="currentColor" />
                                                <p className="text-xl font-black text-brand-secondary tracking-tighter">{task.points}</p>
                                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest font-black">PTS</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── LEADERBOARD ── */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight flex items-center gap-3">
                                <Trophy size={20} className="text-amber-500" /> TOP OPERATIVES
                            </h3>
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mt-1">REAL-TIME RANKINGS</p>
                        </div>
                        <div className="minimal-card p-0 overflow-hidden shadow-2xl border-2 border-brand-secondary/5">
                            {leaderboard.length === 0 ? (
                                <div className="p-16 text-center text-[10px] font-black text-brand-secondary/20 uppercase tracking-[0.3em]">Awaiting first operatives...</div>
                            ) : leaderboard.slice(0, 10).map((entry, i) => {
                                const isMe = entry.citizen_id === user?.id;
                                return (
                                    <div key={entry.citizen_id} className={`flex items-center gap-4 p-5 border-b border-brand-secondary/5 last:border-0 transition-all ${i < 3 ? 'bg-amber-50/50' : ''} ${isMe ? 'bg-blue-50/80 border-l-4 border-l-brand-primary' : ''}`}>
                                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-200 text-brand-secondary' : i === 2 ? 'bg-amber-700/80 text-white' : 'bg-brand-secondary/5 text-brand-secondary/40'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-[14px] bg-white shadow-inner flex items-center justify-center font-black text-brand-secondary text-base shrink-0 overflow-hidden border border-brand-secondary/5">
                                            {entry.citizen?.avatar_url ? <img src={entry.citizen.avatar_url} className="w-full h-full object-cover" /> : (entry.citizen?.full_name?.[0] || 'C')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-brand-secondary uppercase tracking-tight truncate flex items-center gap-2">
                                                {entry.citizen?.full_name || 'Anonymous'}{isMe && <span className="text-[7px] bg-brand-primary text-brand-secondary px-1.5 py-0.5 rounded-md font-black">YOU</span>}
                                            </p>
                                            <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-[0.2em] mt-0.5">{entry.level}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-black text-brand-secondary">{entry.total_points}</p>
                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest font-black">pts</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};
