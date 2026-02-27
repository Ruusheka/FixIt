import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, Clock, ChevronRight,
    LayoutDashboard, Bell, FileText, Globe, Target, Award, CheckCircle2
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';

interface Report {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: number;
    category: string;
    address: string;
    image_url?: string;
    created_at: string;
    risk_score?: number;
    ai_confidence?: number;
}

const navItems = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/reports', icon: Globe },
    { label: 'My Report', path: '/citizen/reports', icon: FileText },
    { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
    { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
    { label: 'Rewards', path: '/citizen/profile#rewards', icon: Award },
];

export const MyReportsPage: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const navigate = useNavigate();

    const completedStatuses = ['closed', 'resolved', 'RESOLVED'];

    useEffect(() => {
        if (!user) return;
        fetchMyReports();
    }, [user]);

    const fetchMyReports = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase.from('issues') as any)
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
        const reportStatus = (r.status || '').toLowerCase();
        const isCompleted = completedStatuses.some(status => status.toLowerCase() === reportStatus);
        const matchesTab = activeTab === 'completed' ? isCompleted : !isCompleted;
        return matchesSearch && matchesTab;
    });

    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'resolved':
            case 'closed':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'assigned': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default: return 'bg-brand-secondary/5 text-brand-secondary/60 border-brand-secondary/10';
        }
    };

    return (
        <MinimalLayout navItems={navItems} title="My Intelligence Feed">
            <div className="max-w-7xl mx-auto space-y-12 py-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-secondary/5 pb-10">
                    <div>
                        <h1 className="text-5xl font-black text-brand-secondary tracking-tighter uppercase mb-2">My Reports</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Personal operational history and tactical status</p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter reports..."
                                className="input-field pl-12 py-3 w-64 bg-transparent border-brand-secondary/10"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/citizen/report')}
                            className="btn-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 px-8"
                        >
                            <Plus size={16} />
                            Deploy New INTEL
                        </button>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-8 border-b border-brand-secondary/5">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'active' ? 'text-brand-secondary' : 'text-brand-secondary/30 hover:text-brand-secondary/60'}`}
                    >
                        Personnel Assignments ({reports.filter(r => !completedStatuses.includes(r.status?.toLowerCase() || '')).length})
                        {activeTab === 'active' && <motion.div layoutId="citizenHubTabLine" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-secondary rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'completed' ? 'text-brand-secondary' : 'text-brand-secondary/30 hover:text-brand-secondary/60'}`}
                    >
                        Resolved Directives ({reports.filter(r => completedStatuses.includes(r.status?.toLowerCase() || '')).length})
                        {activeTab === 'completed' && <motion.div layoutId="citizenHubTabLine" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-secondary rounded-full" />}
                    </button>
                </div>

                {/* Reports Grid */}
                <div className="min-h-[60vh]">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="minimal-card h-80 bg-brand-secondary/5 animate-pulse rounded-3xl" />
                            ))}
                        </div>
                    ) : filteredReports.length > 0 ? (
                        <motion.div
                            layout
                            className="space-y-6"
                        >
                            <AnimatePresence mode='popLayout'>
                                {filteredReports.map((report) => (
                                    <motion.div
                                        key={report.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ x: 10 }}
                                        onClick={() => navigate(`/citizen/reports/${report.id}`)}
                                        className="minimal-card p-0 rounded-3xl overflow-hidden cursor-pointer group border-brand-secondary/5 bg-white hover:border-brand-secondary/20 transition-all duration-300 shadow-xl shadow-brand-secondary/5 hover:shadow-2xl hover:shadow-brand-secondary/10 flex flex-col md:flex-row h-auto md:h-48"
                                    >
                                        {/* Image Section - Wide Layout */}
                                        <div className="w-full md:w-80 h-48 md:h-full bg-brand-secondary/5 relative overflow-hidden shrink-0">
                                            {report.image_url ? (
                                                <img
                                                    src={report.image_url}
                                                    alt={report.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-10">
                                                    <FileText size={32} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${getStatusStyles(report.status)}`}>
                                                    {report.status?.replace('_', ' ')}
                                                </div>
                                                {completedStatuses.includes(report.status?.toLowerCase() || '') && (
                                                    <div className="px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                                                        <CheckCircle2 size={10} /> MISSION RESOLVED
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content - Wide Layout */}
                                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] px-2 py-0.5 bg-brand-secondary/5 rounded">
                                                            {report.category}
                                                        </span>
                                                        {report.severity >= 8 && (
                                                            <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                                                                CRITICAL INTEL
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-2xl font-black text-brand-secondary uppercase tracking-tight group-hover:text-brand-secondary/80 transition-colors">
                                                        {report.title}
                                                    </h3>
                                                    <p className="text-[10px] text-brand-secondary/50 font-medium uppercase tracking-wider line-clamp-1 max-w-xl">
                                                        {report.description}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 text-right">
                                                    <div className="text-[20px] font-black text-brand-secondary tracking-tighter">
                                                        {Math.round((report.risk_score || 0) * 100)}%
                                                        <span className="text-[8px] block opacity-30 mt-[-4px]">RISK INDEX</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-brand-secondary/5 mt-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                                        <Clock size={12} className="opacity-30" />
                                                        {report.created_at ? format(new Date(report.created_at), 'MMM dd, yyyy') : 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                                        <Globe size={12} className="opacity-30" />
                                                        {report.address?.split(',')[0] || 'Unknown'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    Secure Node Access <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="minimal-card p-24 text-center border-dashed border-brand-secondary/10 flex flex-col items-center justify-center rounded-3xl bg-brand-secondary/[0.02]">
                            <div className="w-20 h-20 rounded-full bg-brand-secondary/5 flex items-center justify-center mb-8">
                                <FileText className="w-8 h-8 text-brand-secondary/20" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-secondary/40 uppercase tracking-tighter">Tactical Registry Empty</h3>
                            <p className="text-[10px] font-black text-brand-secondary/20 uppercase tracking-[0.3em] mt-4 max-w-xs leading-relaxed"> No operational reports found under your credentials. Deploy your first intelligence packet using the button above.</p>
                        </div>
                    )}
                </div>
            </div>
        </MinimalLayout>
    );
};
