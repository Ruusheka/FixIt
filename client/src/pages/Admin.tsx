import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';
import { socket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import {
    LayoutDashboard,
    ClipboardCheck,
    Shield,
    Users,
    Radio,
    BarChart3,
    AlertTriangle,
    Zap,
    CheckCircle2,
    TrendingDown,
    ArrowRight,
    Activity,
    ShieldAlert,
    UserPlus,
    MapPin,
    ChevronRight
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { MinimalLayout } from '../components/MinimalLayout';

// Admin components
import { CommandHero } from '../components/admin/CommandHero';
import { ReportAnalytics } from '../components/admin/ReportAnalytics';
import { SLATracker } from '../components/admin/SLATracker';
import { LiveIssuePanel } from '../components/admin/LiveIssuePanel';
import { WorkerAssignModal } from '../components/admin/WorkerAssignModal';
import { Worker } from '../types/reports';
import { VerificationPanel } from '../components/admin/VerificationPanel';
import { HeatmapSection } from '../components/admin/HeatmapSection';
import { BroadcastCenter } from '../components/admin/BroadcastCenter';
import { BudgetPanel } from '../components/admin/BudgetPanel';

/* ── Types ── */
interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'citizen' | 'worker' | 'admin';
    created_at: string;
}

const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { profile: adminProfile } = useAuth();

    // State for all data
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        active: 0,
        highRisk: 0,
        escalated: 0,
        workersActive: 0
    });

    const [recentIssues, setRecentIssues] = useState<any[]>([]);
    const [highRiskIssues, setHighRiskIssues] = useState<any[]>([]);
    const [workerStats, setWorkerStats] = useState({
        available: 0,
        busy: 0,
        onLeave: 0,
        activeAssignments: 0
    });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [trendFilter, setTrendFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
    const [escalations, setEscalations] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [workerLoad, setWorkerLoad] = useState<any[]>([]);
    const [allIssues, setAllIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();

        // Subscription for real-time updates
        const channel = supabase
            .channel('admin_dashboard_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => fetchAllData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations' }, () => fetchAllData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [trendFilter]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Stats
            const resolvedStatuses = ['resolved', 'closed', 'RESOLVED'];

            const [
                { count: totalCount },
                { count: resolvedCount },
                { count: highRiskCount },
                { count: escalatedCount },
                { count: activeWorkersCount }
            ] = await Promise.all([
                supabase.from('issues').select('*', { count: 'exact', head: true }),
                supabase.from('issues').select('*', { count: 'exact', head: true }).in('status', resolvedStatuses),
                supabase.from('issues').select('*', { count: 'exact', head: true }).gt('risk_score', 70),
                supabase.from('issues').select('*', { count: 'exact', head: true }).eq('is_escalated', true),
                supabase.from('workers').select('*', { count: 'exact', head: true }).eq('status', 'busy')
            ]);

            setStats({
                total: totalCount || 0,
                resolved: resolvedCount || 0,
                active: (totalCount || 0) - (resolvedCount || 0),
                highRisk: highRiskCount || 0,
                escalated: escalatedCount || 0,
                workersActive: activeWorkersCount || 0
            });

            // 2. Recent Issues
            const { data: recent } = await supabase.from('issues')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentIssues(recent || []);

            // 3. Removed High Risk Issues fetch

            // 4. Worker Activity
            const { data: workers = [] } = await supabase.from('workers').select('*') as { data: any[] | null };
            if (workers) {
                setWorkerStats({
                    available: workers.filter((w: any) => w.status === 'available').length,
                    busy: workers.filter((w: any) => w.status === 'busy').length,
                    onLeave: workers.filter((w: any) => w.status === 'on_leave').length,
                    activeAssignments: stats.workersActive // Approximation
                });
            }

            // 5. Trend Analytics
            const { data: trendIssues } = await supabase.from('issues').select('created_at, resolved_at');
            if (trendIssues) {
                processTrendData(trendIssues);
            }

            // 6. Map Data
            const { data: allMapIssues } = await supabase.from('issues').select('id, title, latitude, longitude, status, risk_score');
            setAllIssues(allMapIssues || []);

            // 7. Escalations
            const { data: recentEsc } = await supabase.from('escalations')
                .select('*, report:issues(title, status)')
                .order('created_at', { ascending: false })
                .limit(5);
            setEscalations(recentEsc || []);

            // 8. Activity Logs
            const { data: logs } = await supabase.from('admin_activity_logs')
                .select('*, admin:profiles(full_name)')
                .order('created_at', { ascending: false })
                .limit(5);
            setActivityLogs(logs || []);

            // 9. Worker Load
            const { data: load } = await supabase.from('report_assignments')
                .select('worker_id, worker:profiles!report_assignments_worker_id_fkey(full_name)')
                .eq('is_active', true);

            if (load) {
                const loadMap = new Map();
                load.forEach((item: any) => {
                    const name = item.worker?.full_name || 'Worker ' + item.worker_id.slice(0, 4);
                    loadMap.set(name, (loadMap.get(name) || 0) + 1);
                });
                setWorkerLoad(Array.from(loadMap.entries()).map(([name, tasks]) => ({ name, tasks })));
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const processTrendData = (issues: any[]) => {
        // Logic for grouping issues by day/week/month
        const now = new Date();
        let data: any[] = [];

        if (trendFilter === 'weekly') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayStr = date.toLocaleDateString(undefined, { weekday: 'short' });
                const created = issues.filter(iss => new Date(iss.created_at).toDateString() === date.toDateString()).length;
                const resolved = issues.filter(iss => iss.resolved_at && new Date(iss.resolved_at).toDateString() === date.toDateString()).length;
                data.push({ name: dayStr, created, resolved });
            }
        } else if (trendFilter === 'monthly') {
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() - (i * 7));

                const created = issues.filter(iss => {
                    const d = new Date(iss.created_at);
                    return d >= weekStart && d <= weekEnd;
                }).length;
                const resolved = issues.filter(iss => {
                    const d = iss.resolved_at ? new Date(iss.resolved_at) : null;
                    return d && d >= weekStart && d <= weekEnd;
                }).length;
                data.push({ name: `Week ${4 - i}`, created, resolved });
            }
        } else {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthStr = monthDate.toLocaleDateString(undefined, { month: 'short' });
                const created = issues.filter(iss => {
                    const d = new Date(iss.created_at);
                    return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
                }).length;
                const resolved = issues.filter(iss => {
                    const d = iss.resolved_at ? new Date(iss.resolved_at) : null;
                    return d && d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
                }).length;
                data.push({ name: monthStr, created, resolved });
            }
        }
        setTrendData(data);
    };

    return (
        <MinimalLayout navItems={navItems} title="Command Center">
            <div className="space-y-12 pb-20">
                {/* 1. ADMIN CONTROL HERO */}
                <section className="relative overflow-hidden rounded-[40px] bg-brand-secondary p-12 text-white shadow-2xl">
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest"
                        >
                            <Shield size={12} className="text-brand-primary" /> System Online
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl font-black tracking-tighter"
                        >
                            Welcome Back, <span className="text-brand-primary">{adminProfile?.full_name?.split(' ')[0] || 'Administrator'}</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl font-medium text-white/60 leading-tight"
                        >
                            FixIt Command & Intelligence Center
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm font-medium text-white/40"
                        >
                            Monitor city issues, coordinate workers, and ensure rapid civic response across all districts.
                        </motion.p>
                    </div>
                    {/* Abstract Grid Pattern */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <div className="grid grid-cols-6 gap-2 h-full uppercase text-[8px] font-black tracking-tighter overflow-hidden">
                            {Array.from({ length: 100 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-center border border-white/20 p-2">
                                    {(Math.random() * 1000).toFixed(0)}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 2. CITY OPERATIONS STATS */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {[
                        { label: 'Total Reports', value: stats.total, icon: Zap, trend: 'All Time' },
                        { label: 'Resolved Issues', value: stats.resolved, icon: CheckCircle2, trend: 'Verified' },
                        { label: 'Issues In Progress', value: stats.active, icon: Activity, trend: 'In Field' },
                        { label: 'Critical Risk', value: stats.highRisk, icon: AlertTriangle, trend: 'Alert Level 4' },
                        { label: 'Escalations', value: stats.escalated, icon: ShieldAlert, trend: 'Immediate Action' },
                        { label: 'Workers Active', value: stats.workersActive, icon: Users, trend: 'On Site' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="minimal-card p-6 border-b-4 border-b-brand-secondary/5 hover:border-b-brand-secondary transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-brand-secondary/5 rounded-xl group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                                    <stat.icon size={20} />
                                </div>
                                <span className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-widest">{stat.trend}</span>
                            </div>
                            <h4 className="text-4xl font-black tracking-tighter mb-1 font-mono">
                                {loading ? '...' : <Counter value={stat.value} />}
                            </h4>
                            <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">{stat.label}</p>
                        </motion.div>
                    ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* 3. INCIDENT TREND ANALYTICS */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Incident Trend Analytics</h3>
                                <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Chronological issue density & resolution velocity</p>
                            </div>
                            <div className="flex gap-1 bg-brand-secondary/5 p-1 rounded-xl shrink-0">
                                {['weekly', 'monthly', 'yearly'].map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTrendFilter(t as any)}
                                        className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${trendFilter === t
                                            ? 'bg-brand-secondary text-white shadow-lg'
                                            : 'text-brand-secondary/40 hover:text-brand-secondary'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="minimal-card p-6 h-[400px] flex flex-col relative overflow-hidden">
                            {/* Background accent for chart */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                            <div className="flex-1 w-full relative min-h-0 mt-2">
                                <div className="absolute inset-0">
                                    <TrendChart data={trendData} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. WORKFORCE ACTIVITY OVERVIEW */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Workforce Activity</h3>
                            <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Personnel status & deployment integrity</p>
                        </div>
                        <div className="minimal-card p-6 h-[400px] flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-full -ml-16 -mt-16 blur-3xl pointer-events-none" />
                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <ActivityMetric label="Available" value={workerStats.available} color="bg-green-500" />
                                <ActivityMetric label="Busy" value={workerStats.busy} color="bg-orange-500" />
                                <ActivityMetric label="On Leave" value={workerStats.onLeave} color="bg-red-500" />
                                <ActivityMetric label="Deployed" value={workerStats.activeAssignments} color="bg-brand-secondary" />
                            </div>
                            <div className="flex-1 border-t border-brand-secondary/5 pt-4 flex flex-col relative z-10 min-h-0">
                                <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-2 text-center pointer-events-none">Resource Allocation</h4>
                                <div className="flex-1 w-full relative min-h-0">
                                    <div className="absolute inset-0">
                                        <DonutChart data={[
                                            { name: 'Available', value: workerStats.available, fill: '#22c55e' },
                                            { name: 'Busy', value: workerStats.busy, fill: '#f97316' },
                                            { name: 'On Leave', value: workerStats.onLeave, fill: '#ef4444' }
                                        ]} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. LIVE INCIDENT FEED */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Live Incident Feed</h3>
                            <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Real-time civilian intelligence stream (Unresolved)</p>
                        </div>
                        <Link to="/admin/reports" className="text-[10px] font-black text-brand-secondary opacity-40 hover:opacity-100 uppercase tracking-widest flex items-center gap-2 transition-all">
                            Expand Repo <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recentIssues.filter(iss => !['resolved', 'closed', 'RESOLVED'].includes(iss.status)).slice(0, 3).map((issue, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/admin/reports/${issue.id}`)}
                                className="minimal-card overflow-hidden group cursor-pointer hover:border-brand-secondary transition-all"
                            >
                                <div className="h-48 bg-brand-secondary/5 overflow-hidden">
                                    <img
                                        src={issue.image_url || 'https://via.placeholder.com/400x300?text=No+Incident+Image'}
                                        alt={issue.title}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                                    />
                                </div>
                                <div className="p-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-widest">{new Date(issue.created_at).toLocaleDateString()}</span>
                                        <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${(issue.risk_score || 0) > 70 ? 'bg-red-500 text-white' : 'bg-brand-secondary/10 text-brand-secondary'
                                            }`}>
                                            Risk: {Math.round(issue.risk_score || 0)}
                                        </div>
                                    </div>
                                    <h4 className="text-sm font-black text-brand-secondary leading-tight truncate">{issue.title}</h4>
                                    <div className="flex items-center gap-2 text-[8px] font-bold text-brand-secondary/30 uppercase tracking-widest">
                                        <MapPin size={10} /> {issue.address?.split(',')[0]}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 7. ISSUE DISTRIBUTION MAP */}
                <section className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Issue Distribution Map</h3>
                        <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Geospatial cluster analysis & hotspot identification • Highlighting Chennai-Kelambakkam</p>
                    </div>
                    <div className="rounded-[40px] overflow-hidden border border-brand-secondary/10 shadow-2xl h-[500px]">
                        <AdminMap issues={allIssues} />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* 8. ESCALATION CENTER SUMMARY */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Escalation Center</h3>
                        <div className="minimal-card divide-y divide-brand-secondary/5">
                            {escalations.map((esc, i) => (
                                <EscalationItem key={i} escalation={esc} />
                            ))}
                            {escalations.length === 0 && <EmptyState text="Zero escalations active" />}
                        </div>
                        <button
                            onClick={() => navigate('/admin/operations')}
                            className="w-full py-3 bg-brand-secondary/5 border border-brand-secondary/10 rounded-2xl text-[10px] font-black text-brand-secondary uppercase tracking-widest hover:bg-brand-secondary hover:text-white transition-all"
                        >
                            View Escalations Center
                        </button>
                    </div>

                    {/* 9. ADMIN ACTIVITY LOG */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">System Activity Log</h3>
                        <div className="minimal-card divide-y divide-brand-secondary/5">
                            {activityLogs.map((log, i) => (
                                <div key={i} className="p-4 space-y-1">
                                    <p className="text-xs font-bold text-brand-secondary">{log.action}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-widest">{log.admin?.full_name || 'System'}</p>
                                        <p className="text-[8px] font-bold text-brand-secondary/20 uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 10. WORKER LOAD OVERVIEW */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-brand-secondary uppercase tracking-tight">Worker Load Analysis</h3>
                        <div className="minimal-card p-6 space-y-4">
                            {workerLoad.map((worker, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-brand-secondary/60">{worker.name}</span>
                                        <span className="text-brand-secondary">{worker.tasks} Active</span>
                                    </div>
                                    <div className="h-2 bg-brand-secondary/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(worker.tasks * 20, 100)}%` }}
                                            className={`h-full ${worker.tasks > 3 ? 'bg-red-500' : 'bg-brand-secondary/40'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                            {workerLoad.length === 0 && <EmptyState text="No active assignments" />}
                        </div>
                    </div>
                </div>

                {/* 11. QUICK ADMIN ACTION PANEL */}
                <section className="bg-brand-secondary/5 rounded-[40px] p-10 border border-brand-secondary/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tighter text-brand-secondary uppercase">Quick Operations Panel</h3>
                            <p className="text-[10px] font-bold text-brand-secondary/30 uppercase tracking-widest">Tactical shortcuts for immediate command execution</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-end gap-4">
                            {[
                                { label: 'Assign Worker', icon: UserPlus, path: '/admin/reports' },
                                { label: 'View Reports Hub', icon: ClipboardCheck, path: '/admin/reports' },
                                { label: 'Create Broadcast', icon: Radio, path: '/admin/broadcast' },
                                { label: 'View Analytics', icon: BarChart3, path: '/admin/analytics' },
                            ].map((action, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigate(action.path)}
                                    className="flex items-center gap-3 px-6 py-3 bg-white border border-brand-secondary/10 rounded-2xl text-[10px] font-black text-brand-secondary uppercase tracking-widest hover:bg-brand-secondary hover:text-white hover:scale-105 transition-all shadow-card"
                                >
                                    <action.icon size={16} />
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </MinimalLayout>
    );
};

/* --- Sub-components (to keep file cleaner) --- */

const Counter: React.FC<{ value: number }> = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;
        let totalMilisecForCount = 1000;
        let timer = setInterval(() => {
            start += Math.ceil(end / 20);
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, totalMilisecForCount / 20);
        return () => clearInterval(timer);
    }, [value]);
    return <>{count}</>;
};

const ActivityMetric: React.FC<{ label: string; value: number, color: string }> = ({ label, value, color }) => (
    <div className="p-4 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/5">
        <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
            <span className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-xl font-black text-brand-secondary">{value}</p>
    </div>
);

const IssueListItem: React.FC<{ issue: any; onClick: () => void }> = ({ issue, onClick }) => (
    <div
        onClick={onClick}
        className="minimal-card p-4 flex items-center justify-between group cursor-pointer hover:bg-brand-secondary transition-all"
    >
        <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-brand-secondary/5 group-hover:bg-white/10 flex items-center justify-center shrink-0">
                <LayoutDashboard size={18} className="text-brand-secondary group-hover:text-white" />
            </div>
            <div className="overflow-hidden">
                <h4 className="text-sm font-black text-brand-secondary group-hover:text-white truncate">{issue.title}</h4>
                <div className="flex items-center gap-2 text-[8px] font-bold text-brand-secondary/30 group-hover:text-white/40 uppercase tracking-widest">
                    <MapPin size={10} /> {issue.address?.split(',')[0]}
                    <span>•</span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
            <div className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest ${(issue.risk_score || 0) > 70 ? 'bg-red-500 text-white' : 'bg-brand-secondary/10 text-brand-secondary group-hover:bg-white/20 group-hover:text-white'
                }`}>
                Risk: {Math.round(issue.risk_score || 0)}
            </div>
            <ChevronRight size={14} className="text-brand-secondary/20 group-hover:text-white/20" />
        </div>
    </div>
);

const HighRiskCard: React.FC<{ issue: any; onClick: () => void }> = ({ issue, onClick }) => (
    <div
        onClick={onClick}
        className="minimal-card p-5 border-l-4 border-l-red-600 bg-red-50/30 group cursor-pointer hover:bg-red-600 transition-all"
    >
        <div className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-secondary/10 shrink-0">
                <img src={issue.image_url || 'https://via.placeholder.com/80'} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-red-600 group-hover:text-white uppercase tracking-widest">Priority Critical</span>
                    <span className="text-[12px] font-black text-red-600 group-hover:text-white uppercase tracking-tighter italic">SCORE {Math.round(issue.risk_score)}</span>
                </div>
                <h4 className="text-sm font-black text-brand-secondary group-hover:text-white leading-tight truncate">{issue.title}</h4>
                <div className="flex items-center gap-2 text-[8px] font-bold text-red-600/60 group-hover:text-white/60 uppercase">
                    <MapPin size={10} /> {issue.address?.split(',')[0]}
                </div>
            </div>
        </div>
    </div>
);

const EscalationItem: React.FC<{ escalation: any }> = ({ escalation }) => (
    <div className="p-4 space-y-1">
        <div className="flex items-center justify-between font-black uppercase tracking-widest text-[9px]">
            <span className="text-red-600 italic">Severity {escalation.severity}</span>
            <span className="text-brand-secondary/20">{new Date(escalation.created_at).toLocaleDateString()}</span>
        </div>
        <h4 className="text-xs font-bold text-brand-secondary">{escalation.report?.title}</h4>
        <p className="text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest italic">{escalation.reason?.slice(0, 40)}...</p>
    </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-10 text-center text-brand-secondary/20 font-black uppercase tracking-widest text-[10px]">
        {text}
    </div>
);

/* -- Analytics -- */
import {
    LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const TrendChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BFFF04" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#BFFF04" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
            <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#00000030' }}
                dy={10}
            />
            <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#00000030' }}
            />
            <Tooltip
                cursor={{ stroke: '#00000010', strokeWidth: 2 }}
                contentStyle={{
                    borderRadius: '24px',
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textTransform: 'uppercase',
                    fontSize: '10px',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    padding: '16px'
                }}
                itemStyle={{ padding: '4px 0' }}
            />
            <Area
                type="monotone"
                dataKey="created"
                stroke="#000"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorCreated)"
                animationDuration={1500}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#000' }}
            />
            <Area
                type="monotone"
                dataKey="resolved"
                stroke="#BFFF04"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorResolved)"
                animationDuration={2000}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#BFFF04' }}
            />
        </AreaChart>
    </ResponsiveContainer>
);

const DonutChart: React.FC<{ data: any[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={10}
                dataKey="value"
                stroke="none"
            >
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Pie>
            <Tooltip
                contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                }}
            />
        </PieChart>
    </ResponsiveContainer>
);

/* -- Map -- */
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const AdminMap: React.FC<{ issues: any[] }> = ({ issues }) => {
    const mainCenter: [number, number] = [12.7909, 80.2209]; // Kelambakkam, Chennai area
    const kelambakkamCoords: [number, number] = [12.7909, 80.2209];

    return (
        <MapContainer
            center={mainCenter}
            zoom={13}
            className="w-full h-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Highlight Kelambakkam Area */}
            <CircleMarker
                center={kelambakkamCoords}
                radius={40}
                pathOptions={{
                    fillColor: '#BFFF04',
                    color: '#BFFF04',
                    fillOpacity: 0.1,
                    dashArray: '5, 10'
                }}
            />

            {issues.map((issue) => (
                issue.latitude && issue.longitude && (
                    <CircleMarker
                        key={issue.id}
                        center={[issue.latitude, issue.longitude]}
                        radius={issue.risk_score ? (issue.risk_score / 10) + 5 : 8}
                        pathOptions={{
                            fillColor: issue.risk_score > 70 ? '#ef4444' : '#000',
                            color: 'transparent',
                            fillOpacity: 0.6
                        }}
                    >
                        <Popup>
                            <div className="p-2 space-y-1">
                                <h4 className="font-black uppercase text-[10px] tracking-widest">{issue.title}</h4>
                                <p className="text-[9px] font-black text-brand-secondary/40 uppercase">Risk Index: {Math.round(issue.risk_score)}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[4px] bg-brand-secondary text-white`}>{issue.status}</span>
                            </div>
                        </Popup>
                    </CircleMarker>
                )
            ))}
        </MapContainer>
    );
};
