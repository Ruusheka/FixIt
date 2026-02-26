import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Search, Filter, User, Eye, GitMerge, Star,
    MapPin, Calendar, Brain
} from 'lucide-react';

interface LiveIssuePanelProps {
    issues: any[];
    onAssign: (issue: any) => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const categories = ['All', 'pothole', 'garbage', 'streetlight', 'water leak', 'road crack'];
const statuses = ['All', 'reported', 'assigned', 'in_progress', 'resolved', 'verified', 'rejected'];
const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

const getSeverityFromScore = (score: number): string => {
    if (score >= 8) return 'Critical';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
};

const statusBadgeClass: Record<string, string> = {
    reported: 'badge-reported',
    assigned: 'badge-assigned',
    in_progress: 'badge-in-progress',
    resolved: 'badge-fixed',
    fixed: 'badge-fixed',
    verified: 'badge-verified',
    rejected: 'badge-rejected',
};

export const LiveIssuePanel: React.FC<LiveIssuePanelProps> = ({ issues, onAssign, onUpdateStatus }) => {
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sevFilter, setSevFilter] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    const filteredIssues = useMemo(() => {
        return issues.filter(i => {
            if (catFilter !== 'All' && i.category !== catFilter) return false;
            if (statusFilter !== 'All' && i.status !== statusFilter) return false;
            if (sevFilter !== 'All' && getSeverityFromScore(i.severity || i.risk_score * 10) !== sevFilter) return false;
            if (search && !(
                i.category?.toLowerCase().includes(search.toLowerCase()) ||
                i.address?.toLowerCase().includes(search.toLowerCase()) ||
                i.ticket_id?.toLowerCase().includes(search.toLowerCase())
            )) return false;
            return true;
        });
    }, [issues, search, catFilter, statusFilter, sevFilter]);

    return (
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Instance Repository</h2>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest">{filteredIssues.length} active operational nodes</p>
            </motion.div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search UUID or location..."
                        className="w-full pl-11 pr-4 py-3.5 minimal-card bg-white border-brand-secondary/5 text-brand-secondary text-sm placeholder:text-brand-secondary/20 focus:outline-none focus:ring-1 focus:ring-brand-secondary/20"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-3 px-6 py-3.5 minimal-card text-sm font-bold uppercase tracking-widest transition-all ${showFilters ? 'bg-brand-secondary text-white' : 'bg-white text-brand-secondary/40 hover:text-brand-secondary'}`}
                >
                    <Filter className="w-4 h-4" /> Filters
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-wrap gap-3 mb-8 p-6 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/5"
                    >
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            className="bg-white border border-brand-secondary/10 rounded-xl text-brand-secondary text-xs px-4 py-2.5 focus:outline-none">
                            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.toUpperCase()}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="bg-white border border-brand-secondary/10 rounded-xl text-brand-secondary text-xs px-4 py-2.5 focus:outline-none">
                            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
                            className="bg-white border border-brand-secondary/10 rounded-xl text-brand-secondary text-xs px-4 py-2.5 focus:outline-none">
                            {severities.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s.toUpperCase()}</option>)}
                        </select>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Issue cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.slice(0, 12).map((issue, idx) => {
                    const severity = issue.severity || Math.round((issue.risk_score || 0.5) * 10);
                    const sevLabel = getSeverityFromScore(severity);
                    const badgeClass = statusBadgeClass[issue.status] || 'badge-reported';

                    return (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -5 }}
                            className="minimal-card overflow-hidden bg-white shadow-soft"
                        >
                            {/* Image + severity */}
                            <div className="h-44 bg-brand-secondary/5 relative overflow-hidden group">
                                {issue.image_url ? (
                                    <img src={issue.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                        <MapPin className="w-12 h-12 text-brand-secondary" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${sevLabel === 'Critical' ? 'bg-red-500 text-white' :
                                        sevLabel === 'High' ? 'bg-brand-secondary text-white' : 'bg-brand-secondary/20 text-brand-secondary'
                                        }`}>
                                        {sevLabel}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${badgeClass}`}>
                                        {issue.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                <h4 className="font-bold text-lg text-brand-secondary capitalize tracking-tight">{issue.category}</h4>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate">{issue.address || 'Location Restricted'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {issue.risk_score && (
                                    <div className="p-3 rounded-xl bg-brand-secondary/[0.03] border border-brand-secondary/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                                            <Brain className="w-3.5 h-3.5 opacity-40" />
                                            <span>AI Risk Index</span>
                                        </div>
                                        <span className="text-sm font-black text-brand-secondary">{(issue.risk_score * 100).toFixed(0)}%</span>
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => onAssign(issue)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-brand-secondary text-white rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        <User className="w-3.5 h-3.5" /> Assign
                                    </button>
                                    <Link
                                        to={`/admin/reports/${issue.id}`}
                                        className="flex items-center justify-center p-2.5 text-brand-secondary/40 bg-brand-secondary/5 rounded-xl hover:text-brand-secondary transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    <button className="flex items-center justify-center p-2.5 text-brand-secondary/40 bg-brand-secondary/5 rounded-xl hover:text-brand-secondary transition-colors">
                                        <GitMerge className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(issue.id, 'in_progress')}
                                        className="flex items-center justify-center p-2.5 text-brand-secondary/40 bg-brand-secondary/5 rounded-xl hover:text-brand-secondary transition-colors"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
