import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, MapPin, Calendar, IdCard, Edit3, Lock,
    CheckCircle, AlertTriangle, BarChart3, Trophy,
    Bell, Home, Shield, LogOut, ChevronRight,
    Camera, ShieldCheck, Ticket, Zap, Car, Bus, CreditCard,
    Phone, LayoutDashboard, FileText, Globe, Target, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { MinimalLayout } from '../components/MinimalLayout';
import { NavigationGrid } from '../components/citizen/NavigationGrid';

interface Issue {
    id: string;
    created_at: string;
    title: string;
    description: string;
    status: string;
    risk_score: number;
    category: string;
    image_url: string | null;
}

/* ── Types ── */
interface ProfileStats {
    totalReports: number;
    resolved: number;
    inProgress: number;
    highRisk: number;
    avgRiskScore: number;
}

interface RewardCard {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon: React.ReactNode;
    color: string;
}

export const ProfilePage: React.FC = () => {
    const { user, profile, signOut, updatePassword, updateProfile } = useAuth();
    const [stats, setStats] = useState<ProfileStats>({
        totalReports: 0,
        resolved: 0,
        inProgress: 0,
        highRisk: 0,
        avgRiskScore: 0
    });
    const [recentReports, setRecentReports] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use profile avatar_url directly
    const avatarUrl = profile?.avatar_url || null;

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            const { data: issues, error } = await (supabase
                .from('issues') as any)
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && issues) {
                const resolved = issues.filter((i: Issue) => i.status === 'resolved').length;
                const inProgress = issues.filter((i: Issue) => i.status === 'in_progress').length;
                const highRisk = issues.filter((i: Issue) => i.status === 'high_risk' || i.risk_score >= 80).length;
                const totalScore = issues.reduce((acc: number, curr: Issue) => acc + (curr.risk_score || 0), 0);

                setStats({
                    totalReports: issues.length,
                    resolved,
                    inProgress,
                    highRisk,
                    avgRiskScore: issues.length > 0 ? Math.round(totalScore / issues.length) : 0
                });

                setRecentReports(issues.slice(0, 5));
            }
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const impactScore = Math.min(100, (stats.resolved * 10) + (stats.highRisk * 15) + (stats.totalReports * 5));
    const citizenId = `CIT-${user?.id?.slice(0, 8).toUpperCase() || 'XXXXXX'}`;

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await updateProfile({ avatar_url: publicUrl });

            alert('Identity record updated. Registry synchronized.');
            window.location.reload();
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Error updating identity registry: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async () => {
        const newPassword = prompt("Enter new tactical access key (password):");
        if (!newPassword || newPassword.length < 6) {
            alert("Key must be at least 6 characters.");
            return;
        }

        try {
            await updatePassword(newPassword);
            alert("Security parameters updated. Access key synchronized.");
        } catch (error: any) {
            alert("Security Breach: " + error.message);
        }
    };

    const rewards: RewardCard[] = [
        { id: '1', title: 'Priority Parking', description: 'Reserved spots in city center zones', cost: 500, icon: <Car />, color: 'bg-blue-500' },
        { id: '2', title: 'Utility Bill Discount', description: '$5 off water or electricity bill', cost: 800, icon: <Zap />, color: 'bg-orange-500' },
        { id: '3', title: 'Public Transit Pass', description: 'Free all-day city transit pass', cost: 300, icon: <Bus />, color: 'bg-green-500' },
        { id: '4', title: 'Express Permit', description: 'Priority processing for civic permits', cost: 1200, icon: <IdCard />, color: 'bg-indigo-500' },
    ];

    const navItems = [
        { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
        { label: 'Reports Hub', path: '/reports', icon: Globe },
        { label: 'My Report', path: '/citizen/reports', icon: FileText },
        { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
        { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
        { label: 'Rewards', path: '/citizen/profile#rewards', icon: Award },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <MinimalLayout navItems={navItems} title="Civic Identity Node">
            <div className="max-w-7xl mx-auto space-y-16 py-8">

                {/* 1. Identity Block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 minimal-card p-12 relative overflow-hidden flex flex-col md:flex-row gap-12 items-center md:items-start"
                    >
                        <div className="relative group shrink-0">
                            <div className="w-40 h-40 rounded-[2.5rem] bg-brand-secondary flex items-center justify-center text-brand-primary text-5xl font-black shadow-2xl overflow-hidden border-4 border-white">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    profile?.full_name?.[0] || 'U'
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute -bottom-2 -right-2 p-3 bg-brand-primary text-brand-secondary rounded-2xl shadow-xl border border-brand-secondary/5 hover:scale-110 transition-transform disabled:opacity-50"
                            >
                                {uploading ? <div className="w-5 h-5 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin" /> : <Camera size={20} />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <div className="space-y-2">
                                <div className="flex items-center justify-center md:justify-start gap-3">
                                    <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tight leading-none">
                                        {profile?.full_name || 'Civic Agent'}
                                    </h2>
                                    <ShieldCheck size={24} className="text-green-600" />
                                </div>
                                <p className="text-[12px] font-black text-brand-secondary/30 uppercase tracking-[0.4em]">
                                    Grid Registry: {citizenId}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <Mail size={16} className="text-brand-secondary/30" /> {profile?.email}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <Phone size={16} className="text-brand-secondary/30" /> {profile?.phone || '+91 99000 00000'}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <MapPin size={16} className="text-brand-secondary/30" /> {profile?.ward || 'Sector 7, Outer Ring Road'}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-brand-secondary/60 bg-brand-secondary/5 p-4 rounded-2xl">
                                    <Calendar size={16} className="text-brand-secondary/30" /> Joined {format(new Date(profile?.created_at || Date.now()), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-green-600 bg-green-50 p-4 rounded-2xl border border-green-100">
                                    <Shield size={16} /> Verified Citizen
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                                <button className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-brand-primary rounded-xl flex items-center gap-2">
                                    <Edit3 size={14} /> Edit Identity
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest border border-brand-secondary/10 rounded-xl flex items-center gap-2"
                                >
                                    <Lock size={14} /> Security Key
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="minimal-card p-12 bg-brand-secondary text-brand-primary flex flex-col items-center justify-center text-center shadow-2xl relative group"
                    >
                        <div className="absolute top-6 left-6 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Trophy size={24} />
                        </div>
                        <div className="relative mb-8">
                            <div className="w-36 h-36 rounded-full border-[10px] border-brand-primary/10 flex items-center justify-center relative">
                                <div className="text-5xl font-black">{impactScore}</div>
                                <svg className="absolute inset-0 w-36 h-36 -rotate-90 pointer-events-none">
                                    <circle
                                        cx="72" cy="72" r="62"
                                        stroke="currentColor"
                                        strokeWidth="10"
                                        fill="transparent"
                                        strokeDasharray={390}
                                        strokeDashoffset={390 - (390 * impactScore) / 100}
                                        className="text-brand-primary transition-all duration-1000"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">CIVIC HERO Rep.</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Impact Performance Score</p>
                    </motion.div>
                </div>

                {/* Logistics History (MOVED UP) */}
                <section className="space-y-8">
                    <div className="border-b border-brand-secondary/5 pb-8 flex items-center justify-between">
                        <div>
                            <h3 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter">Logistics History</h3>
                            <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mt-1">Detailed status of your last 5 deployments</p>
                        </div>
                        <button className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest hover:text-brand-secondary flex items-center gap-2">
                            View All Feed <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {recentReports.length > 0 ? recentReports.map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="minimal-card overflow-hidden flex flex-col md:flex-row items-stretch border border-brand-secondary/5 group hover:border-brand-secondary/20 transition-all"
                            >
                                <div className="w-full md:w-64 h-48 md:h-auto shrink-0 bg-brand-secondary/5 relative">
                                    {report.image_url ? (
                                        <img src={report.image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-10">
                                            <Camera size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md shadow-xl ${report.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-brand-secondary text-brand-primary'
                                            }`}>
                                            {report.status}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 p-8 flex flex-col justify-between gap-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.3em] mb-2">
                                                <Calendar size={12} /> {format(new Date(report.created_at), 'MMMM dd, yyyy')}
                                            </div>
                                            <h4 className="text-2xl font-black text-brand-secondary uppercase tracking-tighter leading-none">
                                                {report.title}
                                            </h4>
                                            <p className="text-sm font-bold text-brand-secondary/40 uppercase tracking-tight mt-2 line-clamp-1">
                                                {report.description || 'No description provided for this tactical entry'}
                                            </p>
                                        </div>
                                        <div className="bg-brand-secondary/5 p-4 rounded-2xl text-center border border-brand-secondary/5 min-w-[100px]">
                                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest mb-1 leading-none">Risk Index</p>
                                            <p className="text-2xl font-black text-brand-secondary leading-none">{Math.round(report.risk_score || 0)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-6 border-t border-brand-secondary/5">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-secondary/20" />
                                                <span className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">{report.category}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IdCard size={14} className="text-brand-secondary/20" />
                                                <span className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">ID: FX-{report.id.slice(0, 4).toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl bg-brand-secondary/5 hover:bg-brand-secondary hover:text-brand-primary transition-all">
                                            View Logs <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="p-24 text-center border-2 border-dashed border-brand-secondary/5 rounded-[3rem] flex flex-col items-center justify-center">
                                <BarChart3 className="w-16 h-16 text-brand-secondary/5 mb-8" />
                                <h3 className="text-2xl font-black text-brand-secondary/20 uppercase tracking-tighter">Empty Deployment Registry</h3>
                                <p className="text-[10px] font-black text-brand-secondary/10 uppercase tracking-widest mt-2">Start reporting civic issues to see history</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Deployments', value: stats.totalReports, icon: BarChart3 },
                        { label: 'Successful Resolves', value: stats.resolved, icon: CheckCircle },
                        { label: 'Critical Threats', value: stats.highRisk, icon: AlertTriangle },
                        { label: 'System Accuracy', value: '98%', icon: Shield },
                    ].map((item, i) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="minimal-card p-8 border border-brand-secondary/5 flex flex-col justify-between"
                        >
                            <item.icon className="w-6 h-6 text-brand-secondary/20 mb-6" />
                            <div>
                                <div className="text-4xl font-black text-brand-secondary leading-none mb-2">{item.value}</div>
                                <div className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">{item.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* Rewards & Redemption (MOVED DOWN) */}
                <section className="space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-secondary/5 pb-8">
                        <div>
                            <h3 className="text-4xl font-black text-brand-secondary uppercase tracking-tighter">Civic Credits & Rewards</h3>
                            <p className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-[0.3em] mt-2">Earn credits for reporting and verifying fixes</p>
                            <div className="mt-4 flex flex-wrap gap-4">
                                <span className="bg-green-50 text-green-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-green-100">Redeem for priority parking</span>
                                <span className="bg-blue-50 text-blue-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-blue-100">$5 off Utility Bills</span>
                                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-indigo-100">Free Public Transit Passes</span>
                            </div>
                        </div>
                        <div className="bg-brand-secondary text-brand-primary px-8 py-3 rounded-2xl flex items-center gap-4">
                            <CreditCard size={20} />
                            <div>
                                <p className="text-[8px] font-black uppercase opacity-50 tracking-widest leading-none mb-1">Available Credits</p>
                                <p className="text-xl font-black leading-none">{impactScore * 10}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {rewards.map((reward) => (
                            <motion.div
                                key={reward.id}
                                whileHover={{ y: -10 }}
                                className="minimal-card p-8 flex flex-col h-full bg-white group hover:shadow-2xl transition-all"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${reward.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                    {reward.icon}
                                </div>
                                <h4 className="font-black text-brand-secondary uppercase tracking-tight text-lg mb-2">{reward.title}</h4>
                                <p className="text-xs font-bold text-brand-secondary/60 uppercase tracking-tighter leading-snug mb-8 flex-1">
                                    {reward.description}
                                </p>
                                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-brand-secondary/5 group-hover:bg-brand-secondary group-hover:text-brand-primary transition-all">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{reward.cost} Credits</span>
                                    <Ticket size={16} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Footer Navigation */}
                <div className="pt-16">
                    <div className="border-b border-brand-secondary/5 pb-12 text-center">
                        <h3 className="text-2xl font-black text-brand-secondary/20 uppercase tracking-[0.5em]">Command Link Hub</h3>
                    </div>
                    <NavigationGrid />
                </div>
            </div>
        </MinimalLayout>
    );
};
