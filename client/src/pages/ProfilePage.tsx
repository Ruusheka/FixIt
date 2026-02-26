import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Shield, Star, TrendingUp, CheckCircle2,
    AlertTriangle, Award, Eye, Droplets, Flame, Trophy,
    User, Mail, MapPin, Calendar, BarChart2, Target,
    ThumbsUp, ShieldCheck, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — clearly marked, replace with real API/context calls later
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_PROFILE = {
    full_name: 'Arjun Sharma',
    email: 'arjun.sharma@fixit.sys',
    location: 'Sector 12, New Delhi',
    joined: 'January 2024',
    avatar_initials: 'AS',
    verifiedFixes: 18,
    accuracyRate: 94,           // percentage
    totalUpvotes: 312,
    totalReports: 23,
    spamFlags: 0,
    verificationRate: 87,       // percentage
};

const DUMMY_CATEGORY_DATA = [
    { name: 'Pothole', count: 9 },
    { name: 'Streetlight', count: 5 },
    { name: 'Garbage', count: 4 },
    { name: 'Flooding', count: 3 },
    { name: 'Other', count: 2 },
];

const DUMMY_TOP_AREAS = [
    { area: 'MG Road, Sector 12', reports: 7 },
    { area: 'Ring Road Junction', reports: 5 },
    { area: 'Park Avenue, Block C', reports: 4 },
];

const DUMMY_CONTRIBUTION_POINTS = [
    { id: 1, lat: 28.6139, lng: 77.2090, label: 'MG Road Pothole', intensity: 3 },
    { id: 2, lat: 28.6200, lng: 77.2200, label: 'Streetlight Fault', intensity: 2 },
    { id: 3, lat: 28.6080, lng: 77.1990, label: 'Garbage Overflow', intensity: 3 },
    { id: 4, lat: 28.6310, lng: 77.2150, label: 'Flood Zone', intensity: 1 },
    { id: 5, lat: 28.6050, lng: 77.2300, label: 'Road Crack', intensity: 2 },
];
// ─────────────────────────────────────────────────────────────────────────────

// ── Reputation Level System ──────────────────────────────────────────────────
interface ReputationLevel {
    title: string;
    minScore: number;
    maxScore: number;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}

const REPUTATION_LEVELS: ReputationLevel[] = [
    {
        title: 'Bronze Reporter',
        minScore: 0, maxScore: 250,
        color: 'text-amber-600',
        bg: 'bg-amber-600/10',
        border: 'border-amber-600/20',
        icon: <Shield className="w-5 h-5 text-amber-600" />,
    },
    {
        title: 'Silver Guardian',
        minScore: 250, maxScore: 600,
        color: 'text-slate-400',
        bg: 'bg-slate-400/10',
        border: 'border-slate-400/20',
        icon: <Shield className="w-5 h-5 text-slate-400" />,
    },
    {
        title: 'Gold Civic Hero',
        minScore: 600, maxScore: 1000,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20',
        icon: <Star className="w-5 h-5 text-yellow-400" />,
    },
    {
        title: 'Platinum City Defender',
        minScore: 1000, maxScore: 1500,
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-400/20',
        icon: <Trophy className="w-5 h-5 text-cyan-400" />,
    },
];

const calculateReputationScore = (d: typeof DUMMY_PROFILE): number => {
    // Score = (verifiedFixes × 20) + (accuracyRate × 3) + (totalUpvotes × 0.5)
    return Math.round(d.verifiedFixes * 20 + d.accuracyRate * 3 + d.totalUpvotes * 0.5);
};

const getReputationLevel = (score: number): { level: ReputationLevel; next: ReputationLevel | null; progress: number } => {
    const idx = REPUTATION_LEVELS.findIndex(
        (l) => score >= l.minScore && score < l.maxScore
    );
    const safeIdx = idx === -1 ? REPUTATION_LEVELS.length - 1 : idx;
    const level = REPUTATION_LEVELS[safeIdx];
    const next = REPUTATION_LEVELS[safeIdx + 1] || null;
    const progress = next
        ? ((score - level.minScore) / (level.maxScore - level.minScore)) * 100
        : 100;
    return { level, next, progress };
};

const calculateTrustScore = (d: typeof DUMMY_PROFILE): number => {
    // Trust = weighted average of accuracy, no-spam, verification, upvote normalised
    const spamScore = d.spamFlags === 0 ? 100 : Math.max(0, 100 - d.spamFlags * 20);
    const upvoteScore = Math.min(100, (d.totalUpvotes / d.totalReports) * 10);
    return Math.round(
        d.accuracyRate * 0.35 +
        spamScore * 0.30 +
        d.verificationRate * 0.25 +
        upvoteScore * 0.10
    );
};

// ── Badge System ─────────────────────────────────────────────────────────────
interface Badge {
    id: string;
    emoji: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockHint: string;
}

const getBadges = (d: typeof DUMMY_PROFILE): Badge[] => [
    {
        id: 'early',
        emoji: '🔍',
        title: 'Early Reporter',
        description: 'One of the first 100 citizens to report an issue on FixIt.',
        unlocked: true,
        unlockHint: 'Awarded to early adopters',
    },
    {
        id: 'monsoon',
        emoji: '🌧',
        title: 'Monsoon Watcher',
        description: 'Reported 3+ flood or water-related issues during monsoon season.',
        unlocked: d.totalReports >= 3,
        unlockHint: 'Report 3+ flood issues during monsoon',
    },
    {
        id: 'critical',
        emoji: '🔥',
        title: 'Critical Alert Contributor',
        description: 'Filed a severity-9 or higher issue that was verified and resolved.',
        unlocked: d.verifiedFixes >= 5,
        unlockHint: 'Get 5+ verified critical fixes',
    },
    {
        id: 'top10',
        emoji: '🏆',
        title: 'Top 10 This Month',
        description: 'Ranked in the top 10 civic contributors this calendar month.',
        unlocked: d.totalUpvotes >= 200,
        unlockHint: 'Reach 200+ community upvotes',
    },
];

// ── Pie chart colors matching brand ──────────────────────────────────────────
const PIE_COLORS = ['#540023', '#7a0033', '#a00044', '#c70055', '#e80066'];

// ── Circular progress component ───────────────────────────────────────────────
const CircularProgress: React.FC<{ score: number; size?: number }> = ({ score, size = 120 }) => {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="currentColor"
                    strokeWidth="8"
                    className="text-brand-secondary/5"
                />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    whileInView={{ strokeDashoffset: offset }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    className="text-brand-secondary"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-brand-secondary">{score}%</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/30">Trust</span>
            </div>
        </div>
    );
};

// ── Tooltip wrapper ──────────────────────────────────────────────────────────
const Tooltip2: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-brand-secondary text-brand-primary text-[10px] font-bold uppercase tracking-wide rounded-xl shadow-2xl pointer-events-none">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brand-secondary" />
                </div>
            )}
        </div>
    );
};

// ── Custom recharts tooltip ───────────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="minimal-card px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary border-brand-secondary/10">
                <p>{label}: {payload[0].value} reports</p>
            </div>
        );
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const profile = DUMMY_PROFILE; // Replace with useAuth().profile when wiring to backend

    const reputationScore = calculateReputationScore(profile);
    const { level, next, progress } = getReputationLevel(reputationScore);
    const trustScore = calculateTrustScore(profile);
    const badges = getBadges(profile);

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Back button */}
                <button
                    onClick={() => navigate('/citizen')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="border-b border-brand-secondary/5 pb-10">
                    <h1 className="text-5xl font-black text-brand-secondary tracking-tighter uppercase mb-2">
                        Civic Identity
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">
                        Your personal contribution record & reputation on the grid
                    </p>
                </div>

                {/* ── Section 1: Identity Card + Reputation ───────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="minimal-card p-8 space-y-6 lg:col-span-1"
                    >
                        {/* Avatar */}
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-brand-secondary flex items-center justify-center shadow-xl shadow-brand-secondary/20 shrink-0">
                                <span className="text-xl font-black text-brand-primary">{profile.avatar_initials}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-secondary uppercase tracking-tighter">{profile.full_name}</h2>
                                <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${level.bg} ${level.color} ${level.border}`}>
                                    {level.icon}
                                    {level.title}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                { icon: <Mail size={13} />, value: profile.email },
                                { icon: <MapPin size={13} />, value: profile.location },
                                { icon: <Calendar size={13} />, value: `Joined ${profile.joined}` },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                                    <span className="text-brand-secondary/20">{item.icon}</span>
                                    {item.value}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-secondary/5">
                            {[
                                { label: 'Reports', value: profile.totalReports },
                                { label: 'Verified', value: profile.verifiedFixes },
                                { label: 'Upvotes', value: profile.totalUpvotes },
                                { label: 'Accuracy', value: `${profile.accuracyRate}%` },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-2xl font-black text-brand-secondary tracking-tighter">{stat.value}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/30">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Reputation Level System */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="minimal-card p-8 lg:col-span-2 space-y-8"
                    >
                        <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">Civic Reputation</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">Level progression & score breakdown</p>
                            </div>
                            <Tooltip2 text="Score = (Verified Fixes × 20) + (Accuracy % × 3) + (Upvotes × 0.5)">
                                <div className="p-2 rounded-xl bg-brand-secondary/5 border border-brand-secondary/10 cursor-help">
                                    <AlertTriangle size={16} className="text-brand-secondary/40" />
                                </div>
                            </Tooltip2>
                        </div>

                        {/* Score display */}
                        <div className="flex items-end gap-4">
                            <div className="text-6xl font-black text-brand-secondary tracking-tighter">{reputationScore}</div>
                            <div className="pb-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">Reputation Score</div>
                                {next && (
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/50 mt-1">
                                        {next.minScore - reputationScore} pts to {next.title}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">
                                <span className={level.color}>{level.title}</span>
                                {next && <span>{next.title}</span>}
                            </div>
                            <div className="h-2 bg-brand-secondary/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${progress}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    className="h-full bg-brand-secondary rounded-full"
                                />
                            </div>
                            <div className="text-right text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">
                                {Math.round(progress)}% to next level
                            </div>
                        </div>

                        {/* All 4 levels */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                            {REPUTATION_LEVELS.map((l) => {
                                const isActive = l.title === level.title;
                                return (
                                    <Tooltip2 key={l.title} text={`${l.minScore}–${l.maxScore} pts`}>
                                        <div className={`p-3 rounded-2xl border text-center cursor-default transition-all ${isActive ? `${l.bg} ${l.border}` : 'bg-brand-secondary/3 border-brand-secondary/5 opacity-40'}`}>
                                            <div className="flex justify-center mb-2">{l.icon}</div>
                                            <div className={`text-[9px] font-black uppercase tracking-widest ${isActive ? l.color : 'text-brand-secondary/30'}`}>
                                                {l.title}
                                            </div>
                                        </div>
                                    </Tooltip2>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* ── Section 2: Contribution Analytics ───────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="border-b border-brand-secondary/5 pb-6">
                        <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">Contribution Analytics</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">Issue breakdown by category & top contributing areas</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Bar Chart */}
                        <div className="minimal-card p-8 lg:col-span-2 space-y-6">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">
                                <BarChart2 size={14} className="text-brand-secondary/30" />
                                Issues by Category
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={DUMMY_CATEGORY_DATA} barSize={28}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(84,0,35,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 9, fontWeight: 900, fill: 'rgba(84,0,35,0.3)' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(84,0,35,0.04)' }} />
                                    <Bar dataKey="count" fill="#540023" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Areas + Verification rate */}
                        <div className="space-y-6">
                            <div className="minimal-card p-6 space-y-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 flex items-center gap-2">
                                    <MapPin size={13} className="text-brand-secondary/30" />
                                    Top 3 Areas
                                </div>
                                {DUMMY_TOP_AREAS.map((area, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase tracking-tight text-brand-secondary/60 truncate max-w-[70%]">{area.area}</span>
                                            <span className="text-[11px] font-black text-brand-secondary">{area.reports}</span>
                                        </div>
                                        <div className="h-1 bg-brand-secondary/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${(area.reports / DUMMY_TOP_AREAS[0].reports) * 100}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.2, delay: i * 0.15 }}
                                                className="h-full bg-brand-secondary rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="minimal-card p-6 space-y-3">
                                <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 flex items-center gap-2">
                                    <Target size={13} className="text-brand-secondary/30" />
                                    Verification Rate
                                </div>
                                <div className="text-4xl font-black text-brand-secondary tracking-tighter">
                                    {profile.verificationRate}%
                                </div>
                                <div className="h-1.5 bg-brand-secondary/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${profile.verificationRate}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.4 }}
                                        className="h-full bg-brand-secondary rounded-full"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">
                                    of your reports were independently verified
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Section 3: Trust Score ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="border-b border-brand-secondary/5 pb-6">
                        <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">Trust Score</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">Community confidence in your reports</p>
                    </div>

                    <div className="minimal-card p-8">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            {/* Circular progress */}
                            <div className="shrink-0">
                                <CircularProgress score={trustScore} size={140} />
                            </div>

                            <div className="hidden md:block w-px h-28 bg-brand-secondary/5" />

                            {/* Score breakdown */}
                            <div className="flex-1 space-y-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 mb-6">
                                    Score calculated from:
                                </div>
                                {[
                                    { label: 'Accurate Reports', value: `${profile.accuracyRate}%`, ok: profile.accuracyRate >= 80, weight: '35%' },
                                    { label: 'No Spam Flags', value: profile.spamFlags === 0 ? 'Clean' : `${profile.spamFlags} flags`, ok: profile.spamFlags === 0, weight: '30%' },
                                    { label: 'High Verification Rate', value: `${profile.verificationRate}%`, ok: profile.verificationRate >= 70, weight: '25%' },
                                    { label: 'Community Support', value: `${profile.totalUpvotes} upvotes`, ok: profile.totalUpvotes >= 100, weight: '10%' },
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.08 }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.ok ? 'bg-brand-secondary/10' : 'bg-red-500/10'}`}>
                                                {item.ok
                                                    ? <CheckCircle2 size={12} className="text-brand-secondary" />
                                                    : <AlertTriangle size={12} className="text-red-400" />
                                                }
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-secondary/60">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[11px] font-black text-brand-secondary">{item.value}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">{item.weight}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Section 4: Badge Showcase ────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="border-b border-brand-secondary/5 pb-6">
                        <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">Badge Showcase</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">Achievements earned through civic contributions</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {badges.map((badge, i) => (
                            <Tooltip2 key={badge.id} text={badge.unlocked ? badge.description : `Locked: ${badge.unlockHint}`}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    whileHover={{ y: -4 }}
                                    className={`minimal-card p-6 text-center cursor-default transition-all ${badge.unlocked
                                        ? 'border-brand-secondary/10'
                                        : 'opacity-40 grayscale border-brand-secondary/5'
                                    }`}
                                >
                                    <div className={`text-4xl mb-4 transition-all ${badge.unlocked ? '' : 'blur-[1px]'}`}>
                                        {badge.emoji}
                                    </div>
                                    <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-widest mb-2 leading-tight">
                                        {badge.title}
                                    </h4>
                                    <div className={`text-[9px] font-black uppercase tracking-widest mt-3 ${badge.unlocked ? 'text-brand-secondary/40' : 'text-brand-secondary/20'}`}>
                                        {badge.unlocked ? '✔ Unlocked' : '⬡ Locked'}
                                    </div>
                                </motion.div>
                            </Tooltip2>
                        ))}
                    </div>
                </motion.div>

                {/* ── Section 5: Contribution Map (Mini Heatmap) ──────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="border-b border-brand-secondary/5 pb-6">
                        <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">Contribution Map</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-1">Locations where your reports made an impact</p>
                    </div>

                    <div className="minimal-card p-0 overflow-hidden rounded-3xl border-brand-secondary/5">
                        {/* Map header bar */}
                        <div className="px-8 py-5 border-b border-brand-secondary/5 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">
                                <MapPin size={14} className="text-brand-secondary/30" />
                                {DUMMY_CONTRIBUTION_POINTS.length} contribution zones
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">
                                <span className="w-2 h-2 rounded-full bg-brand-secondary/60" /> High
                                <span className="w-2 h-2 rounded-full bg-brand-secondary/30 ml-2" /> Medium
                                <span className="w-2 h-2 rounded-full bg-brand-secondary/10 ml-2" /> Low
                            </div>
                        </div>

                        {/* SVG pseudo-map — lightweight, no library needed, mock coordinates normalised */}
                        <div className="relative bg-brand-secondary/[0.02] h-72 overflow-hidden">
                            {/* Grid lines for map feel */}
                            <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-brand-secondary" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>

                            {/* Contribution points — coordinates normalised to viewport */}
                            {(() => {
                                const lats = DUMMY_CONTRIBUTION_POINTS.map(p => p.lat);
                                const lngs = DUMMY_CONTRIBUTION_POINTS.map(p => p.lng);
                                const minLat = Math.min(...lats), maxLat = Math.max(...lats);
                                const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
                                const padX = 80, padY = 60;

                                return DUMMY_CONTRIBUTION_POINTS.map((point, i) => {
                                    const xPct = ((point.lng - minLng) / (maxLng - minLng || 1)) * (100 - 2 * (padX / 10)) + (padX / 10);
                                    const yPct = (1 - (point.lat - minLat) / (maxLat - minLat || 1)) * (100 - 2 * (padY / 10)) + (padY / 10);
                                    const size = point.intensity === 3 ? 32 : point.intensity === 2 ? 22 : 14;
                                    return (
                                        <Tooltip2 key={point.id} text={point.label}>
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                whileInView={{ scale: 1, opacity: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                                                className="absolute cursor-pointer group"
                                                style={{
                                                    left: `${xPct}%`,
                                                    top: `${yPct}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                }}
                                            >
                                                {/* Pulse ring */}
                                                <motion.div
                                                    animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                                                    className="absolute inset-0 rounded-full bg-brand-secondary/20"
                                                    style={{ width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                                                />
                                                <div
                                                    className="rounded-full bg-brand-secondary flex items-center justify-center shadow-lg shadow-brand-secondary/30"
                                                    style={{ width: size, height: size }}
                                                >
                                                    <MapPin size={size * 0.45} className="text-brand-primary" />
                                                </div>
                                            </motion.div>
                                        </Tooltip2>
                                    );
                                });
                            })()}
                        </div>

                        <div className="px-8 py-4 border-t border-brand-secondary/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/20">
                                Mock coordinates — replace with real issue lat/lng from Supabase when wiring to backend
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Footer spacer */}
                <div className="pt-12 border-t border-brand-secondary/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-20">
                    <span className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">FixIt</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} FixIt Systems. Civic Identity Record.</p>
                </div>

            </div>
        </div>
    );
};
