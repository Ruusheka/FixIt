import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <section className="mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Live Issue Management</h2>
                <p className="text-civic-muted text-sm">Operational workspace — {filteredIssues.length} issues</p>
            </motion.div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-civic-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search issues..."
                        className="w-full pl-9 pr-4 py-2.5 glass-card bg-white/5 text-white text-sm placeholder:text-civic-muted/60 focus:outline-none focus:ring-1 focus:ring-civic-orange/50"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 glass-card text-sm ${showFilters ? 'text-civic-orange' : 'text-civic-muted'} hover:text-white transition-colors`}
                >
                    <Filter className="w-4 h-4" /> Filters
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-3 mb-4"
                    >
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            className="glass-card bg-white/5 text-white text-xs px-3 py-2 focus:outline-none">
                            {categories.map(c => <option key={c} value={c} className="bg-civic-dark">{c === 'All' ? 'All Categories' : c}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="glass-card bg-white/5 text-white text-xs px-3 py-2 focus:outline-none">
                            {statuses.map(s => <option key={s} value={s} className="bg-civic-dark">{s === 'All' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
                        </select>
                        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
                            className="glass-card bg-white/5 text-white text-xs px-3 py-2 focus:outline-none">
                            {severities.map(s => <option key={s} value={s} className="bg-civic-dark">{s === 'All' ? 'All Severities' : s}</option>)}
                        </select>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Issue cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            whileHover={{ y: -2 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Image + severity */}
                            <div className="h-28 bg-civic-card relative">
                                {issue.image_url ? (
                                    <img src={issue.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-civic-card to-civic-dark flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-civic-muted/30" />
                                    </div>
                                )}
                                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${sevLabel === 'Critical' ? 'severity-critical' :
                                        sevLabel === 'High' ? 'severity-medium' : 'severity-low'
                                    }`}>
                                    {sevLabel} ({severity}/10)
                                </span>
                                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>
                                    {issue.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-3 space-y-2">
                                <h4 className="font-semibold text-sm text-white capitalize">{issue.category}</h4>

                                <div className="flex items-center gap-3 text-[11px] text-civic-muted">
                                    <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{issue.address || 'Unknown'}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(issue.created_at).toLocaleDateString()}</span>
                                </div>

                                {issue.risk_score && (
                                    <div className="flex items-center gap-1 text-[11px] text-purple-400">
                                        <Brain className="w-3 h-3" /> AI Risk: {(issue.risk_score * 100).toFixed(0)}%
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => onAssign(issue)}
                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-civic-orange glass-card hover:bg-civic-orange/10 transition-colors"
                                    >
                                        <User className="w-3 h-3" /> Assign
                                    </button>
                                    <button className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-civic-muted glass-card hover:bg-white/5 transition-colors">
                                        <Eye className="w-3 h-3" />
                                    </button>
                                    <button className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-civic-muted glass-card hover:bg-white/5 transition-colors">
                                        <GitMerge className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(issue.id, 'in_progress')}
                                        className="flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] text-yellow-400 glass-card hover:bg-yellow-500/10 transition-colors"
                                    >
                                        <Star className="w-3 h-3" />
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
