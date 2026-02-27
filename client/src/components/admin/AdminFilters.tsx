import React, { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    SortAsc,
    RotateCcw,
    Download,
    CheckSquare,
    ChevronDown
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ReportFilters } from '../../hooks/useAdminReports';
import { Profile } from '../../types/reports';

interface AdminFiltersProps {
    filters: ReportFilters;
    setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
    onExport?: () => void;
    bulkMode: boolean;
    setBulkMode: (mode: boolean) => void;
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
    filters,
    setFilters,
    onExport,
    bulkMode,
    setBulkMode
}) => {
    const [workers, setWorkers] = useState<Profile[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const fetchWorkers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'worker');
            if (data) setWorkers(data);
        };
        fetchWorkers();
    }, []);

    const handleReset = () => {
        setFilters({
            search: '',
            status: 'all',
            priority: 'all',
            worker: 'all',
            overdue: false,
            sortBy: 'newest',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-brand-secondary/5 shadow-soft">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/30" size={18} />
                    <input
                        type="text"
                        placeholder="Search reports by title, location, or user..."
                        className="w-full pl-12 pr-4 py-3 bg-brand-primary/10 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-secondary/10 transition-all placeholder:text-brand-secondary/20"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Quick Status Filter */}
                    <div className="flex bg-brand-primary/10 p-1 rounded-2xl gap-1">
                        {['all', 'reported', 'in_progress', 'RESOLVED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilters(prev => ({ ...prev, status: s as any }))}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.status === s
                                    ? 'bg-brand-secondary text-white shadow-lg'
                                    : 'text-brand-secondary/40 hover:text-brand-secondary'
                                    }`}
                            >
                                {s.toLowerCase() === 'resolved' ? 'RESOLVED' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-brand-secondary/5 mx-1 hidden md:block" />

                    {/* Action Buttons */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${isFilterOpen || filters.priority !== 'all' || filters.worker !== 'all' || filters.overdue
                            ? 'bg-brand-secondary text-white'
                            : 'bg-brand-primary/10 text-brand-secondary'
                            }`}
                    >
                        <Filter size={16} />
                        Advanced
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                        onClick={() => setBulkMode(!bulkMode)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${bulkMode ? 'bg-brand-secondary text-white' : 'bg-brand-primary/10 text-brand-secondary'
                            }`}
                    >
                        <CheckSquare size={16} />
                        Bulk Actions
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary/10 text-brand-secondary rounded-2xl text-xs font-bold hover:bg-brand-primary/20 transition-all"
                    >
                        <Download size={16} />
                        Export
                    </button>

                    <button
                        onClick={handleReset}
                        className="p-2.5 bg-brand-secondary/5 text-brand-secondary rounded-2xl hover:bg-brand-secondary/10 transition-all"
                        title="Reset Filters"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {isFilterOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border border-brand-secondary/5 shadow-soft animate-slide-up">
                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Priority Level</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full bg-brand-primary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-2.5 rounded-xl focus:outline-none font-bold appearance-none"
                        >
                            <option value="all">ALL PRIORITIES</option>
                            {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                <option key={p} value={p}>{p.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assigned Worker */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Assigned Worker</label>
                        <select
                            value={filters.worker}
                            onChange={(e) => setFilters(prev => ({ ...prev, worker: e.target.value }))}
                            className="w-full bg-brand-primary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-4 py-2.5 rounded-xl focus:outline-none font-bold appearance-none"
                        >
                            <option value="all">ALL WORKERS</option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.full_name?.toUpperCase() || w.email.split('@')[0].toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Overdue */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Time Status</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, overdue: !prev.overdue }))}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${filters.overdue
                                    ? 'bg-red-500/10 border-red-500/20 text-red-600'
                                    : 'bg-brand-primary/5 border-transparent text-brand-secondary/40'
                                    }`}
                            >
                                {filters.overdue ? 'OVERDUE ONLY' : 'ALL TIMELINES'}
                            </button>
                        </div>
                    </div>

                    {/* Sorting */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest block ml-1">Sort Results</label>
                        <div className="relative">
                            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/20" size={14} />
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                                className="w-full pl-9 pr-4 bg-brand-primary/5 border border-brand-secondary/5 text-brand-secondary text-sm py-2.5 rounded-xl focus:outline-none font-bold appearance-none"
                            >
                                <option value="newest">NEWEST FIRST</option>
                                <option value="oldest">OLDEST FIRST</option>
                                <option value="most_overdue">MOST OVERDUE</option>
                                <option value="highest_priority">HIGHEST PRIORITY</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
