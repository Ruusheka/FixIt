import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Camera, FileText, Megaphone, ListChecks,
    LayoutDashboard, ClipboardCheck, Shield, Radio,
    BarChart3, Target, Zap, ArrowRight, ShieldCheck,
    Award, Heart, MessageSquare, Trophy
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems } from '../constants/adminNav';
import { supabase } from '../services/supabase';

const navItems = adminNavItems;

const engagementCommands = [
    {
        label: 'Report Issue',
        icon: <Camera className="w-6 h-6" />,
        path: '/citizen/report',
        description: 'Citizen intake portal for issue collection',
        category: 'Intake'
    },
    {
        label: 'My Reports',
        icon: <FileText className="w-6 h-6" />,
        path: '/citizen/reports',
        description: 'User tracker for submitted tickets',
        category: 'Tracking'
    },
    {
        label: 'Announcements',
        icon: <Megaphone className="w-6 h-6" />,
        path: '/citizen/announcements',
        description: 'Global broadcast channel for notifications',
        category: 'Communication'
    },
    {
        label: 'Micro-Tasks',
        icon: <ListChecks className="w-6 h-6" />,
        path: '/citizen/micro-tasks',
        description: 'Community-led task resolution system',
        category: 'Ops'
    },
    {
        label: 'Leaderboard',
        icon: <Trophy className="w-6 h-6" />,
        path: '/citizen/rewards',
        description: 'Citizen contribution rankings & rewards',
        category: 'Engagement'
    },
    {
        label: 'AI Insights',
        icon: <Zap className="w-6 h-6" />,
        path: '/admin/analytics',
        description: 'Advanced predictive modeling & analysis',
        category: 'Intelligence'
    }
];



export const AdminEngageCommand: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = React.useState({
        totalReports: 0,
        activeTasks: 0,
        totalUsers: 0,
        loading: true
    });

    const [transmissionActive, setTransmissionActive] = React.useState(false);
    const [loadingMessages, setLoadingMessages] = React.useState(false);
    const [contactMessages, setContactMessages] = React.useState<any[]>([]);

    const startTransmission = async () => {
        setTransmissionActive(true);
        setLoadingMessages(true);
        try {
            // Fetch messages from citizen contact form (Engage Command)
            const { data, error } = await (supabase.from('contact_messages') as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContactMessages(data || []);
        } catch (err) {
            console.error('TRANSMISSION ERROR:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const [
                    { count: reportsCount },
                    { count: tasksCount },
                    { count: usersCount }
                ] = await Promise.all([
                    supabase.from('issues').select('*', { count: 'exact', head: true }),
                    supabase.from('microtasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
                    supabase.from('profiles').select('*', { count: 'exact', head: true })
                ]);

                setStats({
                    totalReports: reportsCount || 0,
                    activeTasks: tasksCount || 0,
                    totalUsers: usersCount || 0,
                    loading: false
                });
            } catch (err) {
                console.error('ST-CORE ERROR:', err);
                setStats(s => ({ ...s, loading: false }));
            }
        };
        fetchStats();
    }, []);

    return (
        <MinimalLayout navItems={navItems} title="Engage Command Centre">
            <div className={`space-y-12 pb-32 transition-opacity duration-1000 ${stats.loading ? 'opacity-50' : 'opacity-100'}`}>
                {/* Header Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="minimal-card p-8 bg-brand-secondary text-brand-primary">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Network Feed Throughput</p>
                        <h3 className="text-4xl font-black">{stats.totalReports} Reports</h3>
                        <div className="h-1 w-12 bg-white/20 mt-4 rounded-full" />
                    </div>
                    <div className="minimal-card p-8 bg-brand-primary border border-brand-secondary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 mb-2">Active Mission Deployments</p>
                        <h3 className="text-4xl font-black text-brand-secondary">{stats.activeTasks} Units</h3>
                        <div className="h-1 w-12 bg-brand-secondary/10 mt-4 rounded-full" />
                    </div>
                    <div className="minimal-card p-8 bg-brand-primary border border-brand-secondary/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 mb-2">Citizen Intel Network</p>
                        <h3 className="text-4xl font-black text-brand-secondary">{stats.totalUsers / 1000}k Nodes</h3>
                        <div className="h-1 w-12 bg-brand-secondary/10 mt-4 rounded-full" />
                    </div>
                </section>

                {/* Main Command Grid */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between border-b border-brand-secondary/5 pb-8">
                        <div>
                            <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter">Operational Command Interface</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30 mt-1">Direct access to citizen-facing engagement modules</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {engagementCommands.map((command, idx) => (
                            <motion.button
                                key={command.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(command.path)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="minimal-card p-8 text-left group hover:bg-brand-secondary transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="p-3.5 rounded-2xl bg-brand-secondary/5 text-brand-secondary group-hover:bg-brand-primary transition-all">
                                            {command.icon}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-brand-secondary/5 group-hover:bg-brand-primary/10 transition-all">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-secondary group-hover:text-brand-primary">
                                                {command.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-2xl font-black text-brand-secondary group-hover:text-brand-primary uppercase tracking-tighter transition-colors">
                                            {command.label}
                                        </h3>
                                        <p className="text-xs font-bold text-brand-secondary/40 group-hover:text-brand-primary/60 uppercase tracking-tighter transition-colors leading-relaxed">
                                            {command.description}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/20 group-hover:text-brand-primary/80">
                                        Active Link State <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* Abstract background patterns for premium feel */}
                                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-all" />
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Engage Control Panel / Transmission Initialization */}
                <section className="minimal-card p-12 bg-white relative overflow-hidden border border-brand-secondary/5 shadow-2xl">
                    <div className="relative z-10">
                        {!transmissionActive ? (
                            <div className="max-w-4xl mx-auto text-center space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-secondary/5 text-brand-secondary rounded-full">
                                    <div className="w-2 h-2 bg-brand-secondary rounded-full animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Command Link</span>
                                </div>
                                <h1 className="text-6xl font-black text-brand-secondary uppercase tracking-tighter leading-none">
                                    Initialize Citizen<br />Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-secondary to-brand-secondary/40">Transmission</span>
                                </h1>
                                <p className="text-sm font-bold text-brand-secondary/40 uppercase tracking-tight max-w-xl mx-auto leading-relaxed">
                                    Establish a secure data bridge to synchronize with the citizen-side 'Engage Command' module and retrieve all pending operational intel.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={startTransmission}
                                    className="px-12 py-6 bg-brand-secondary text-brand-primary rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-brand-secondary/30 flex items-center gap-4 mx-auto"
                                >
                                    <Zap size={20} className="text-brand-primary" />
                                    Initialize Transmission
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                <div className="flex items-end justify-between border-b border-brand-secondary/5 pb-8">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full">
                                            <ShieldCheck size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Bridge Active</span>
                                        </div>
                                        <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter">Engage Command Transmissions</h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/30">Direct intelligence feed from the citizen service hub</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mb-1">Nodes Detected</p>
                                        <span className="text-3xl font-black text-brand-secondary">{contactMessages.length}</span>
                                    </div>
                                </div>

                                {loadingMessages ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-48 bg-brand-secondary/5 rounded-3xl" />
                                        ))}
                                    </div>
                                ) : contactMessages.length === 0 ? (
                                    <div className="py-24 text-center border-2 border-dashed border-brand-secondary/5 rounded-[40px]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/20">No active transmissions in queue</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {contactMessages.map((msg, idx) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="minimal-card p-8 bg-brand-secondary/5 border border-brand-secondary/10 hover:border-brand-secondary/30 transition-all flex flex-col justify-between"
                                            >
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="p-2 rounded-lg bg-brand-secondary/5">
                                                            <MessageSquare size={16} className="text-brand-secondary" />
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/30">
                                                            {new Date(msg.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-black text-brand-secondary uppercase tracking-tighter truncate">{msg.name}</h4>
                                                        <p className="text-[10px] font-bold text-brand-secondary/40 truncate">{msg.email}</p>
                                                    </div>
                                                    <p className="text-xs font-medium text-brand-secondary/70 italic line-clamp-4 leading-relaxed">
                                                        "{msg.message}"
                                                    </p>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-brand-secondary/5 flex items-center justify-between">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded">Transmission Secure</span>
                                                    <ArrowRight size={12} className="text-brand-secondary/20" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Background Visuals for the panel */}
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-brand-secondary/5 rounded-full blur-[60px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
                </section>
            </div>
        </MinimalLayout>
    );
};
