import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Plus,
    Grid2X2,
    List,
    RefreshCcw,
    LayoutDashboard,
    ClipboardCheck,
    Shield,
    Users,
    Radio,
    BarChart3,
    ShieldAlert
} from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { AdminStatsSection } from '../components/admin/AdminStatsSection';
import { AdminFilters } from '../components/admin/AdminFilters';
import { AdminReportCard } from '../components/admin/AdminReportCard';
import { useAdminReports } from '../hooks/useAdminReports';

const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminReportsHub: React.FC = () => {
    const {
        reports,
        loading,
        filters,
        setFilters,
        refetch
    } = useAdminReports();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    useEffect(() => {
        const isCompletedFilter = ['closed', 'resolved', 'RESOLVED', 'CLOSED'].includes(filters.status);
        if (isCompletedFilter) {
            setActiveTab('completed');
        } else if (filters.status !== 'all') {
            setActiveTab('active');
        }
    }, [filters.status]);

    const completedStatuses = ['closed', 'resolved', 'RESOLVED', 'CLOSED'];

    const filteredReportsByTab = reports.filter(r => {
        const isCompleted = completedStatuses.includes(r.status);
        return activeTab === 'completed' ? isCompleted : !isCompleted;
    });

    const escalatedReports = filteredReportsByTab.filter(r => r.is_escalated);
    const otherReports = filteredReportsByTab.filter(r => !r.is_escalated);

    const handleSelectReport = (id: string) => {
        setSelectedReports(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + ["Title,Status,Priority,Created At,Address"].join(",") + "\n"
            + reports.map(r => [
                `"${r.title}"`,
                r.status,
                r.priority,
                new Date(r.created_at).toLocaleString(),
                `"${r.address}"`
            ].join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fixit_reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <MinimalLayout navItems={navItems} title="Reports Hub">
            <div className="max-w-7xl mx-auto px-8 py-10 space-y-12">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-brand-secondary/5 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-brand-secondary/5 rounded-xl text-brand-secondary">
                                <LayoutDashboard size={20} />
                            </div>
                            <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase">Civic Intelligence Hub</h1>
                        </div>
                        <p className="text-xs font-bold text-brand-secondary/30 uppercase tracking-[0.2em] leading-relaxed">
                            Real-time monitoring & strategic resource orchestration
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="p-3 bg-white border border-brand-secondary/10 rounded-2xl text-brand-secondary/40 hover:text-brand-secondary hover:bg-brand-primary/5 transition-all shadow-soft"
                            title="Refresh Data"
                        >
                            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="flex bg-brand-primary/10 p-1.5 rounded-2xl border border-brand-secondary/5">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-brand-secondary' : 'text-brand-secondary/30'}`}
                            >
                                <Grid2X2 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-brand-secondary' : 'text-brand-secondary/30'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                        <Link to="/citizen/report" className="flex items-center gap-2 px-6 py-3 bg-brand-secondary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <Plus size={16} /> New Intel
                        </Link>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-8 border-b border-brand-secondary/5">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'active' ? 'text-brand-secondary' : 'text-brand-secondary/30 hover:text-brand-secondary/60'}`}
                    >
                        Active Operations ({reports.filter(r => !completedStatuses.includes(r.status)).length})
                        {activeTab === 'active' && <motion.div layoutId="hubTabLine" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-secondary rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'completed' ? 'text-brand-secondary' : 'text-brand-secondary/30 hover:text-brand-secondary/60'}`}
                    >
                        Historical Archive ({reports.filter(r => completedStatuses.includes(r.status)).length})
                        {activeTab === 'completed' && <motion.div layoutId="hubTabLine" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-secondary rounded-full" />}
                    </button>
                </div>

                {/* Stats Section */}
                <AdminStatsSection reports={reports} />

                {/* Filters Section */}
                <AdminFilters
                    filters={filters}
                    setFilters={setFilters}
                    onExport={handleExport}
                    bulkMode={bulkMode}
                    setBulkMode={setBulkMode}
                />

                {/* Bulk Actions Toolbar */}
                <AnimatePresence>
                    {bulkMode && selectedReports.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-brand-secondary text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
                        >
                            <p className="text-xs font-black uppercase tracking-widest">
                                {selectedReports.length} Reports Selected
                            </p>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="flex gap-2">
                                <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Mark Resolved</button>
                                <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Assign Worker</button>
                                <button
                                    onClick={() => setSelectedReports([])}
                                    className="px-4 py-2 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Area */}
                {loading ? (
                    <div className={`grid gap-8 py-20 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`minimal-card bg-white/50 animate-pulse border-brand-secondary/5 ${viewMode === 'grid' ? 'h-64' : 'h-32'}`} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-16 pb-20">
                        {/* Escalated Reports Section */}
                        {escalatedReports.length > 0 && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-700 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-700/20">
                                        <ShieldAlert size={12} /> High Risk Escalations
                                    </div>
                                    <div className="h-px flex-1 bg-red-700/10" />
                                </div>
                                <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {escalatedReports.map(report => (
                                        <AdminReportCard
                                            key={report.id}
                                            report={report}
                                            bulkMode={bulkMode}
                                            viewMode={viewMode}
                                            isSelected={selectedReports.includes(report.id)}
                                            onSelect={handleSelectReport}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* General Reports Grid */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">
                                    {activeTab === 'active' ? 'Active Operations Archive' : 'Completed Resolution History'} ({otherReports.length})
                                </div>
                                <div className="h-px flex-1 bg-brand-secondary/5" />
                            </div>

                            {otherReports.length > 0 ? (
                                <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    {otherReports.map(report => (
                                        <AdminReportCard
                                            key={report.id}
                                            report={report}
                                            bulkMode={bulkMode}
                                            viewMode={viewMode}
                                            isSelected={selectedReports.includes(report.id)}
                                            onSelect={handleSelectReport}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white/50 rounded-[40px] border border-dashed border-brand-secondary/10">
                                    <div className="p-4 bg-brand-secondary/5 rounded-full text-brand-secondary/20">
                                        <ClipboardCheck size={48} />
                                    </div>
                                    <p className="text-sm font-bold text-brand-secondary/40 uppercase tracking-widest">No matching reports found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MinimalLayout>
    );
};
