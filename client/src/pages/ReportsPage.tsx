import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search, Filter, Grid, List as ListIcon, Plus,
    LayoutDashboard, FileText, Bell, Globe, Target, Award
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { ReportCard } from '../components/reports/ReportCard';
import { useReports } from '../hooks/useReports';

const filterItems = [
    { id: 'all', label: 'All Reports' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'overdue', label: 'Overdue' }
];

export const ReportsPage: React.FC = () => {
    const { reports, loading, isOverdue, getOverdueHours } = useReports();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const filteredReports = reports.filter(report => {
        const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeFilter === 'all') return matchesSearch;

        const reportStatus = (report.status || '').toLowerCase();

        if (activeFilter === 'overdue') return matchesSearch && isOverdue(report.created_at, report.status);

        if (activeFilter === 'resolved') {
            return matchesSearch && (reportStatus === 'resolved' || reportStatus === 'closed');
        }

        return matchesSearch && reportStatus === activeFilter.toLowerCase();
    });

    const navItems = [
        { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
        { label: 'Reports Hub', path: '/reports', icon: Globe },
        { label: 'My Report', path: '/citizen/reports', icon: FileText },
        { label: 'Announcement', path: '/citizen/announcements', icon: Bell },
        { label: 'Micro Task', path: '/citizen/micro-tasks', icon: Target },
        { label: 'Rewards', path: '/citizen/profile#rewards', icon: Award },
    ];

    return (
        <MinimalLayout navItems={navItems} title="Civic Intel Feed">
            <div className="space-y-10 py-6">
                {/* Header & Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-brand-secondary/5 pb-10">
                    <div>
                        <h1 className="text-5xl font-black text-brand-secondary tracking-tighter uppercase mb-2">Social Hub</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Community intelligence stream and status tracker</p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tactical data..."
                                className="input-field pl-12 py-3 w-64 bg-transparent border-brand-secondary/10"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/citizen/report')}
                            className="btn-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 px-8"
                        >
                            <Plus size={16} />
                            Deploy Report
                        </button>
                    </div>
                </div>

                {/* Horizontal Tab Navigation */}
                <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-center p-1 bg-brand-secondary/5 rounded-2xl w-fit mx-auto backdrop-blur-sm border border-brand-secondary/5">
                        {filterItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveFilter(item.id)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === item.id
                                    ? 'bg-brand-secondary text-brand-primary shadow-xl shadow-brand-secondary/20 -translate-y-0.5'
                                    : 'text-brand-secondary/40 hover:text-brand-secondary'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="min-h-[60vh]">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="minimal-card aspect-square bg-brand-secondary/5 animate-pulse rounded-3xl" />
                                ))}
                            </div>
                        ) : filteredReports.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                            >
                                {filteredReports.map((report) => (
                                    <ReportCard
                                        key={report.id}
                                        report={report}
                                        isOverdue={isOverdue(report.created_at, report.status)}
                                        overdueHours={getOverdueHours(report.created_at)}
                                        onClick={(id) => navigate(`/reports/${id}`)}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <div className="minimal-card p-24 text-center border-dashed border-brand-secondary/10 flex flex-col items-center justify-center rounded-3xl">
                                <Search className="w-16 h-16 text-brand-secondary/5 mb-6" />
                                <h3 className="text-xl font-black text-brand-secondary/20 uppercase tracking-tighter">No intelligence vectors match criteria</h3>
                                <p className="text-[10px] font-black text-brand-secondary/10 uppercase tracking-widest mt-2">Adjust filtering parameters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};
