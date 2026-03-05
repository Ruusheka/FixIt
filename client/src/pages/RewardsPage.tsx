import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Star, Zap, Target, CheckCircle2, AlertTriangle,
    MapPin, Users, Flame, Award, Shield, Camera, FileText,
    TrendingUp, Clock, ChevronRight, Search, Globe, Bell,
    LayoutDashboard, Lock, Medal, Crown, Sparkles, Activity,
    ArrowUp
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Types ── */
interface CivicPoints {
    citizen_id: string;
    total_points: number;
    tasks_completed: number;
    level: string;
    badge: string;
    updated_at: string;
    citizen?: { full_name: string; email: string; avatar_url?: string };
}

interface ImpactStats {
    reported: number;
    resolved: number;
    microtasks: number;
    highRisk: number;
    areas: number;
}

interface ActivityItem {
    id: string;
    type: 'report' | 'microtask' | 'points' | 'level';
    title: string;
    subtitle: string;
    points?: number;
    date: string;
    icon: React.ElementType;
    color: string;
}

interface PointsLog {
    id: string;
    action: string;
    ref: string;
    points: number;
    date: string;
}

interface MapPoint {
    lat: number;
    lng: number;
    type: 'report' | 'microtask';
    title: string;
}

/* ── Level System ── */
const LEVELS = [
    { level: 'Civic Hero Level 1', badge: 'Rookie', min: 0, max: 100, color: 'from-slate-400 to-slate-600', glow: 'shadow-slate-400/40' },
    { level: 'Civic Hero Level 2', badge: 'Street Sentinel', min: 101, max: 250, color: 'from-green-400 to-emerald-600', glow: 'shadow-green-400/40' },
    { level: 'Civic Hero Level 3', badge: 'Urban Champion', min: 251, max: 500, color: 'from-blue-400 to-cyan-600', glow: 'shadow-blue-400/40' },
    { level: 'Civic Hero Level 4', badge: 'City Guardian', min: 501, max: Infinity, color: 'from-amber-400 to-orange-600', glow: 'shadow-amber-400/40' },
];

function getLevelInfo(points: number) {
    return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[0];
}

function getLevelProgress(points: number) {
    const lvl = getLevelInfo(points);
    if (lvl.max === Infinity) return 100;
    return Math.round(((points - lvl.min) / (lvl.max - lvl.min)) * 100);
}

function getNextLevelPts(points: number) {
    const lvl = getLevelInfo(points);
    return lvl.max === Infinity ? null : lvl.max + 1;
}

/* ── Badge Definitions ── */
const BADGE_DEFS = [
    { id: 'first_report', title: 'First Responder', desc: 'Submit your first civic report', icon: FileText, color: 'bg-blue-500', req: (s: ImpactStats) => s.reported >= 1 },
    { id: 'five_reports', title: 'Field Agent', desc: 'Submit 5 civic reports', icon: Shield, color: 'bg-indigo-500', req: (s: ImpactStats) => s.reported >= 5 },
    { id: 'ten_reports', title: 'Guardian', desc: 'Submit 10 civic reports', icon: Crown, color: 'bg-purple-500', req: (s: ImpactStats) => s.reported >= 10 },
    { id: 'first_microtask', title: 'Micro Pioneer', desc: 'Complete your first microtask', icon: Target, color: 'bg-teal-500', req: (s: ImpactStats) => s.microtasks >= 1 },
    { id: 'ten_microtasks', title: 'Ground Intel', desc: 'Complete 10 microtasks', icon: Camera, color: 'bg-cyan-500', req: (s: ImpactStats) => s.microtasks >= 10 },
    { id: 'high_risk_spotter', title: 'Risk Tracker', desc: 'Flag 3 high-risk civic issues', icon: AlertTriangle, color: 'bg-red-500', req: (s: ImpactStats) => s.highRisk >= 3 },
    { id: 'area_explorer', title: 'City Mapper', desc: 'Contribute from 3+ zones', icon: MapPin, color: 'bg-orange-500', req: (s: ImpactStats) => s.areas >= 3 },
    { id: 'community', title: 'Community Pillar', desc: 'Get 5 of your reports resolved', icon: Users, color: 'bg-green-500', req: (s: ImpactStats) => s.resolved >= 5 },
];

const navItems = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/reports', icon: Globe },
    { label: 'My Report', path: '/citizen/reports', icon: FileText },
    { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
    { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
    { label: 'Rewards', path: '/citizen/rewards', icon: Award },
];

/* ── Toast ── */
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-brand-secondary text-brand-primary rounded-2xl shadow-2xl shadow-brand-secondary/30 font-black text-sm"
    >
        <Sparkles size={18} />
        {message}
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 text-xs">✕</button>
    </motion.div>
);

export const RewardsPage: React.FC = () => {
    const { user, profile } = useAuth();
    const [civicPoints, setCivicPoints] = useState<CivicPoints | null>(null);
    const [stats, setStats] = useState<ImpactStats>({ reported: 0, resolved: 0, microtasks: 0, highRisk: 0, areas: 0 });
    const [leaderboard, setLeaderboard] = useState<CivicPoints[]>([]);
    const [leaderTab, setLeaderTab] = useState<'all' | 'weekly' | 'monthly'>('all');
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [pointsLog, setPointsLog] = useState<PointsLog[]>([]);
    const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
    const [logSearch, setLogSearch] = useState('');
    const [logPage, setLogPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const LOGS_PER_PAGE = 6;

    const fetchAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        // 1. Civic Points for self
        const { data: cp } = await (supabase.from('civic_points') as any)
            .select('*, citizen:profiles!citizen_id(full_name, email, avatar_url)')
            .eq('citizen_id', user.id)
            .maybeSingle();
        setCivicPoints(cp);

        // 2. Impact Stats
        const { data: issues } = await (supabase.from('issues') as any)
            .select('id, status, risk_score, latitude, longitude, title')
            .eq('user_id', user.id);

        const allIssues = issues || [];
        const uniqueAreas = new Set(allIssues.map((i: any) => `${Math.round(i.latitude || 0)},${Math.round(i.longitude || 0)}`)).size;
        setStats({
            reported: allIssues.length,
            resolved: allIssues.filter((i: any) => ['resolved', 'closed', 'RESOLVED'].includes(i.status)).length,
            microtasks: cp?.tasks_completed || 0,
            highRisk: allIssues.filter((i: any) => (i.risk_score || 0) > 70).length,
            areas: uniqueAreas,
        });

        // 3. Map points from issues
        const mPoints: MapPoint[] = allIssues
            .filter((i: any) => i.latitude && i.longitude)
            .map((i: any) => ({ lat: i.latitude, lng: i.longitude, type: 'report' as const, title: i.title }));

        // 4. Microtask responses for map + activity
        const { data: mResp } = await (supabase.from('microtask_responses') as any)
            .select('id, submitted_at, approved, points_awarded, microtask:microtasks(title)')
            .eq('citizen_id', user.id)
            .order('submitted_at', { ascending: false });

        const responses = mResp || [];
        responses.forEach((r: any) => {
            if (r.microtask?.latitude && r.microtask?.longitude) {
                mPoints.push({ lat: r.microtask.latitude, lng: r.microtask.longitude, type: 'microtask', title: r.microtask.title });
            }
        });
        setMapPoints(mPoints);

        // 5. Activity Feed
        const actItems: ActivityItem[] = [
            ...allIssues.slice(0, 5).map((i: any) => ({
                id: 'iss-' + i.id,
                type: 'report' as const,
                title: 'Report Submitted',
                subtitle: i.title,
                date: i.created_at || new Date().toISOString(),
                icon: FileText,
                color: 'bg-blue-500/10 text-blue-600',
            })),
            ...responses.slice(0, 5).map((r: any) => ({
                id: 'mt-' + r.id,
                type: 'microtask' as const,
                title: r.approved ? 'Microtask Approved' : 'Microtask Submitted',
                subtitle: r.microtask?.title || 'Mission',
                points: r.approved ? r.points_awarded : undefined,
                date: r.submitted_at,
                icon: r.approved ? CheckCircle2 : Target,
                color: r.approved ? 'bg-green-500/10 text-green-600' : 'bg-teal-500/10 text-teal-600',
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivity(actItems);

        // 6. Points Log
        const logs: PointsLog[] = responses
            .filter((r: any) => r.approved)
            .map((r: any) => ({
                id: r.id,
                action: 'Microtask Approved',
                ref: r.microtask?.title || 'Microtask',
                points: r.points_awarded,
                date: r.submitted_at,
            }));
        setPointsLog(logs);

        // 7. Leaderboard
        const { data: lb } = await (supabase.from('civic_points') as any)
            .select('*, citizen:profiles!citizen_id(full_name, email, avatar_url)')
            .order('total_points', { ascending: false })
            .limit(15);
        setLeaderboard(lb || []);

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchAll();
        const channel = supabase.channel('rewards_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'civic_points' }, () => fetchAll())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'microtask_responses' }, () => fetchAll())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchAll]);

    // Check level-up for toasts
    useEffect(() => {
        if (!civicPoints) return;
        const stored = localStorage.getItem('fixit_last_level');
        const current = civicPoints.level;
        if (stored && stored !== current) {
            setToast(`🎉 You reached ${current}!`);
        }
        localStorage.setItem('fixit_last_level', current);
    }, [civicPoints]);

    const totalPts = civicPoints?.total_points || 0;
    const levelInfo = getLevelInfo(totalPts);
    const levelProgress = getLevelProgress(totalPts);
    const nextLevel = getNextLevelPts(totalPts);

    // Leaderboard (filter mock for tabs — in production you'd pass date filters to Supabase)
    const displayedLeaderboard = leaderboard.slice(0, 10);
    const myRank = leaderboard.findIndex(l => l.citizen_id === user?.id) + 1;

    // Points log filtered + paginated
    const filteredLogs = pointsLog.filter(l =>
        l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        l.ref.toLowerCase().includes(logSearch.toLowerCase())
    );
    const pagedLogs = filteredLogs.slice(logPage * LOGS_PER_PAGE, (logPage + 1) * LOGS_PER_PAGE);

    if (loading) {
        return (
            <MinimalLayout navItems={navItems} title="Rewards & Achievements">
                <div className="space-y-8 pb-20">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="minimal-card h-40 animate-pulse bg-brand-secondary/5" />
                    ))}
                </div>
            </MinimalLayout>
        );
    }

    return (
        <MinimalLayout navItems={navItems} title="Rewards & Achievements">
            <div className="space-y-10 pb-24">

                {/* ── 1. HERO: CIVIC PROFILE SUMMARY ── */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${levelInfo.color} p-0.5 shadow-2xl ${levelInfo.glow}`}
                >
                    <div className="rounded-[2.4rem] bg-brand-secondary p-8 md:p-12 text-brand-primary flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-[2rem] bg-gradient-to-br ${levelInfo.color} flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden border-4 border-white/20`}>
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-brand-secondary">{profile?.full_name?.[0] || 'C'}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 px-3 py-1.5 bg-brand-primary rounded-xl text-brand-secondary text-[9px] font-black uppercase tracking-widest shadow-lg border border-brand-secondary/10">
                                {civicPoints?.badge || 'Rookie'}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-1">
                                    {profile?.full_name || 'Civic Agent'}
                                </h1>
                                <p className="text-sm font-black opacity-60 uppercase tracking-[0.3em]">{levelInfo.level}</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Level Progress</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                        {totalPts} / {nextLevel ?? '∞'} pts
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${levelProgress}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-brand-primary rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Points + Rank */}
                        <div className="shrink-0 flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-4 text-center md:text-right">
                            <div>
                                <div className="text-5xl md:text-6xl font-black leading-none">{totalPts}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Civic Points</div>
                            </div>
                            {myRank > 0 && (
                                <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                    <div className="text-2xl font-black">#{myRank}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-50">City Rank</div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                {/* ── 2. IMPACT SCORE CARDS ── */}
                <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Issues Reported', value: stats.reported, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Issues Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
                        { label: 'Microtasks Done', value: stats.microtasks, icon: Target, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                        { label: 'High Risk Flagged', value: stats.highRisk, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Areas Covered', value: stats.areas, icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { label: 'Total Points', value: totalPts, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    ].map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="minimal-card p-5 flex flex-col gap-3 hover:shadow-lg transition-all"
                        >
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon size={20} className={card.color} />
                            </div>
                            <div>
                                <div className="text-3xl font-black text-brand-secondary leading-none">{card.value}</div>
                                <div className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest mt-1">{card.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* ── 3 + 4. MAP & LEADERBOARD ── */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Civic Footprint Map */}
                    <div className="minimal-card overflow-hidden">
                        <div className="p-6 border-b border-brand-secondary/5 flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-secondary/5 rounded-xl flex items-center justify-center">
                                <MapPin size={16} className="text-brand-secondary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight">Your Civic Footprint</h3>
                                <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Locations of your contributions</p>
                            </div>
                        </div>
                        <div className="h-[320px] relative">
                            {mapPoints.length > 0 ? (
                                <MapContainer
                                    center={[mapPoints[0].lat || 13.0827, mapPoints[0].lng || 80.2707]}
                                    zoom={11}
                                    className="w-full h-full"
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {mapPoints.map((pt, i) => (
                                        <CircleMarker
                                            key={i}
                                            center={[pt.lat, pt.lng]}
                                            radius={pt.type === 'report' ? 10 : 7}
                                            pathOptions={{
                                                fillColor: pt.type === 'report' ? '#3b82f6' : '#14b8a6',
                                                fillOpacity: 0.7,
                                                color: pt.type === 'report' ? '#1d4ed8' : '#0f766e',
                                                weight: 2,
                                            }}
                                        >
                                            <Popup><b>{pt.title}</b><br />{pt.type === 'report' ? '📋 Report' : '🎯 Microtask'}</Popup>
                                        </CircleMarker>
                                    ))}
                                </MapContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <MapPin size={40} className="text-brand-secondary/10 mb-4" />
                                    <p className="text-sm font-black text-brand-secondary/20 uppercase tracking-widest">No locations yet</p>
                                    <p className="text-[10px] font-bold text-brand-secondary/15 uppercase tracking-widest mt-1">Submit reports to see your footprint</p>
                                </div>
                            )}
                            {/* Legend */}
                            <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1 bg-white/80 backdrop-blur-md border border-brand-secondary/10 rounded-xl p-2">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[9px] font-black uppercase text-brand-secondary/60">Reports</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-teal-500" /><span className="text-[9px] font-black uppercase text-brand-secondary/60">Microtasks</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="minimal-card overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-brand-secondary/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                        <Trophy size={16} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight">City Leaderboard</h3>
                                        <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Top civic contributors</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 bg-brand-secondary/5 p-1 rounded-xl">
                                {(['all', 'monthly', 'weekly'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setLeaderTab(tab)}
                                        className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${leaderTab === tab ? 'bg-brand-secondary text-brand-primary shadow' : 'text-brand-secondary/40 hover:text-brand-secondary'}`}
                                    >
                                        {tab === 'all' ? 'All Time' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[280px]">
                            {displayedLeaderboard.length === 0 ? (
                                <div className="p-8 text-center text-brand-secondary/20 font-black uppercase text-xs">No leaderboard data yet</div>
                            ) : (
                                displayedLeaderboard.map((entry, i) => {
                                    const isMe = entry.citizen_id === user?.id;
                                    const medals = [
                                        <Crown size={14} className="text-amber-500" />,
                                        <Medal size={14} className="text-slate-400" />,
                                        <Medal size={14} className="text-amber-700" />,
                                    ];
                                    return (
                                        <motion.div
                                            key={entry.citizen_id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className={`flex items-center gap-3 px-6 py-3 border-b border-brand-secondary/5 transition-all ${isMe ? 'bg-brand-secondary/5 border-l-4 border-l-brand-secondary' : 'hover:bg-brand-secondary/3'}`}
                                        >
                                            <div className="w-6 text-center shrink-0">
                                                {i < 3 ? medals[i] : <span className="text-[10px] font-black text-brand-secondary/30">#{i + 1}</span>}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                                                {entry.citizen?.avatar_url
                                                    ? <img src={entry.citizen.avatar_url} className="w-full h-full object-cover" />
                                                    : (entry.citizen?.full_name?.[0] || 'C')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-black uppercase tracking-tight truncate ${isMe ? 'text-brand-secondary' : 'text-brand-secondary/70'}`}>
                                                    {isMe ? 'You' : (entry.citizen?.full_name || 'Anonymous')}
                                                </p>
                                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">{entry.badge}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-black text-brand-secondary">{entry.total_points}</p>
                                                <p className="text-[8px] font-black text-brand-secondary/30 uppercase">pts</p>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                        {/* My rank if not in top 10 */}
                        {myRank > 10 && (
                            <div className="p-4 border-t border-brand-secondary/5 bg-brand-secondary/5 flex items-center justify-between">
                                <span className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Your Rank</span>
                                <span className="text-sm font-black text-brand-secondary">#{myRank} — {totalPts} pts</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── 5. ACHIEVEMENTS & BADGES ── */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-6">
                        <div>
                            <h3 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter">Achievements</h3>
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest mt-1">Unlock badges by contributing to your city</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-brand-secondary">{BADGE_DEFS.filter(b => b.req(stats)).length}</p>
                            <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">/ {BADGE_DEFS.length} Unlocked</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {BADGE_DEFS.map(badge => {
                            const earned = badge.req(stats);
                            return (
                                <motion.div
                                    key={badge.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`minimal-card p-6 flex flex-col items-center text-center gap-3 transition-all relative overflow-hidden ${!earned ? 'opacity-40 grayscale' : 'hover:shadow-lg'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${badge.color} flex items-center justify-center shadow-lg`}>
                                        <badge.icon size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-brand-secondary uppercase tracking-tight">{badge.title}</p>
                                        <p className="text-[9px] font-bold text-brand-secondary/40 mt-1 leading-snug">{badge.desc}</p>
                                    </div>
                                    {earned && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        </div>
                                    )}
                                    {!earned && (
                                        <div className="absolute inset-0 flex items-end justify-center pb-3">
                                            <div className="flex items-center gap-1 px-3 py-1 bg-brand-secondary/5 rounded-full">
                                                <Lock size={10} className="text-brand-secondary/30" />
                                                <span className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">Locked</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ── 6 + 7. TIMELINE & POINTS LOG ── */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Civic Journey Timeline */}
                    <div className="minimal-card overflow-hidden">
                        <div className="p-6 border-b border-brand-secondary/5 flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-secondary/5 rounded-xl flex items-center justify-center">
                                <Activity size={16} className="text-brand-secondary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight">Civic Journey</h3>
                                <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Your recent activity timeline</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                            {activity.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Clock size={32} className="text-brand-secondary/10 mx-auto mb-3" />
                                    <p className="text-xs font-black text-brand-secondary/20 uppercase tracking-widest">No activity yet</p>
                                    <p className="text-[9px] font-bold text-brand-secondary/15 uppercase tracking-widest mt-1">Complete your first microtask to start earning rewards.</p>
                                </div>
                            ) : (
                                activity.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="relative">
                                            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                                                <item.icon size={16} />
                                            </div>
                                            {i < activity.length - 1 && (
                                                <div className="absolute top-9 left-4 w-px h-4 bg-brand-secondary/10" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-3 border-b border-brand-secondary/5">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-black text-brand-secondary uppercase tracking-tight">{item.title}</p>
                                                {item.points && (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">+{item.points}pts</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-brand-secondary/40 truncate mt-0.5">{item.subtitle}</p>
                                            <p className="text-[9px] font-bold text-brand-secondary/25 uppercase tracking-widest mt-1">
                                                {format(new Date(item.date), 'MMM dd, yyyy · HH:mm')}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Points Activity Log */}
                    <div className="minimal-card overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-brand-secondary/5 flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                <Zap size={16} className="text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight">Points Log</h3>
                                <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Your earnings history</p>
                            </div>
                        </div>
                        {/* Search */}
                        <div className="px-6 pt-4 pb-2">
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-secondary/5 rounded-xl border border-brand-secondary/5">
                                <Search size={14} className="text-brand-secondary/30" />
                                <input
                                    id="points-log-search"
                                    name="points-log-search"
                                    value={logSearch}
                                    onChange={e => { setLogSearch(e.target.value); setLogPage(0); }}
                                    placeholder="Search activity..."
                                    className="flex-1 bg-transparent text-[10px] font-bold text-brand-secondary placeholder-brand-secondary/20 uppercase tracking-widest outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {filteredLogs.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Zap size={32} className="text-brand-secondary/10 mx-auto mb-3" />
                                    <p className="text-xs font-black text-brand-secondary/20 uppercase tracking-widest">No earnings yet</p>
                                    <p className="text-[9px] font-bold text-brand-secondary/15 uppercase tracking-widest mt-1">Complete microtasks to earn points</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-brand-secondary/5">
                                            {['Action', 'Reference', 'Pts', 'Date'].map(h => (
                                                <th key={h} className="px-6 py-3 text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagedLogs.map((log, i) => (
                                            <tr key={log.id} className={`border-b border-brand-secondary/5 hover:bg-brand-secondary/3 transition-colors ${i % 2 === 0 ? '' : 'bg-brand-secondary/2'}`}>
                                                <td className="px-6 py-3 text-[10px] font-black text-brand-secondary uppercase tracking-tight whitespace-nowrap">{log.action}</td>
                                                <td className="px-6 py-3 text-[10px] font-bold text-brand-secondary/50 max-w-[120px] truncate">{log.ref}</td>
                                                <td className="px-6 py-3">
                                                    <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap">+{log.points}</span>
                                                </td>
                                                <td className="px-6 py-3 text-[9px] font-bold text-brand-secondary/30 whitespace-nowrap">{format(new Date(log.date), 'MMM dd, yy')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredLogs.length > LOGS_PER_PAGE && (
                            <div className="p-4 border-t border-brand-secondary/5 flex items-center justify-between">
                                <button
                                    disabled={logPage === 0}
                                    onClick={() => setLogPage(p => p - 1)}
                                    className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl disabled:opacity-30 hover:bg-brand-secondary/5 transition-all"
                                >← Prev</button>
                                <span className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">
                                    {logPage + 1} / {Math.ceil(filteredLogs.length / LOGS_PER_PAGE)}
                                </span>
                                <button
                                    disabled={(logPage + 1) * LOGS_PER_PAGE >= filteredLogs.length}
                                    onClick={() => setLogPage(p => p + 1)}
                                    className="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl disabled:opacity-30 hover:bg-brand-secondary/5 transition-all"
                                >Next →</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── LEVEL PROGRESSION REFERENCE ── */}
                <section className="minimal-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-brand-secondary/5 rounded-xl flex items-center justify-center">
                            <TrendingUp size={16} className="text-brand-secondary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight">Level Progression</h3>
                            <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">Earn more points to unlock new tiers</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {LEVELS.map((lvl, i) => {
                            const isCurrentLevel = getLevelInfo(totalPts).level === lvl.level;
                            const isUnlocked = totalPts >= lvl.min;
                            return (
                                <div key={i} className={`relative p-5 rounded-2xl border-2 transition-all ${isCurrentLevel ? 'border-brand-secondary bg-brand-secondary/5' : isUnlocked ? 'border-green-500/20 bg-green-500/5' : 'border-brand-secondary/5 opacity-40'}`}>
                                    {isCurrentLevel && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-secondary text-brand-primary text-[9px] font-black uppercase tracking-widest rounded-full whitespace-nowrap">
                                            ← Current
                                        </div>
                                    )}
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${lvl.color} flex items-center justify-center mb-3`}>
                                        <Star size={18} className="text-white" />
                                    </div>
                                    <p className="text-xs font-black text-brand-secondary uppercase tracking-tight">{lvl.badge}</p>
                                    <p className="text-[9px] font-bold text-brand-secondary/40 mt-0.5">{lvl.min}–{lvl.max === Infinity ? '∞' : lvl.max} pts</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </MinimalLayout>
    );
};
