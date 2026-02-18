import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, User } from 'lucide-react';

interface SLATicket {
    id: string;
    ticket_id: string;
    category: string;
    address?: string;
    assigned_worker?: string;
    created_at: string;
    sla_deadline?: string;
    status: string;
}

interface SLATrackerProps {
    issues: any[];
}

const getSLAInfo = (createdAt: string, deadline?: string) => {
    const now = Date.now();
    const end = deadline ? new Date(deadline).getTime() : new Date(createdAt).getTime() + 86400000; // 24h default
    const remaining = end - now;

    if (remaining <= 0) return { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/20', pct: 100 };
    const totalMs = end - new Date(createdAt).getTime();
    const pct = ((totalMs - remaining) / totalMs) * 100;
    if (pct > 75) return { label: formatTime(remaining), color: 'text-orange-400', bg: 'bg-orange-500/20', pct };
    return { label: formatTime(remaining), color: 'text-green-400', bg: 'bg-green-500/20', pct };
};

const formatTime = (ms: number): string => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
};

const demoSLA: SLATicket[] = [
    { id: '1', ticket_id: 'FX-1042', category: 'pothole', address: 'MG Road, Sector 12', assigned_worker: 'Rajesh K.', created_at: new Date(Date.now() - 43200000).toISOString(), status: 'in_progress' },
    { id: '2', ticket_id: 'FX-1038', category: 'garbage', address: 'Ring Road Junction', assigned_worker: 'Priya M.', created_at: new Date(Date.now() - 72000000).toISOString(), status: 'assigned' },
    { id: '3', ticket_id: 'FX-1035', category: 'streetlight', address: 'Park Avenue', assigned_worker: 'Amit S.', created_at: new Date(Date.now() - 90000000).toISOString(), status: 'in_progress' },
    { id: '4', ticket_id: 'FX-1031', category: 'water leak', address: 'Gandhi Nagar', assigned_worker: 'Neha R.', created_at: new Date(Date.now() - 36000000).toISOString(), status: 'assigned' },
    { id: '5', ticket_id: 'FX-1028', category: 'road crack', address: 'NH-48 Toll Plaza', assigned_worker: 'Vikram P.', created_at: new Date(Date.now() - 14400000).toISOString(), status: 'in_progress' },
];

export const SLATracker: React.FC<SLATrackerProps> = ({ issues }) => {
    const [, setTick] = useState(0);
    // Re-render every minute for countdown
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    const tickets: SLATicket[] = issues.length > 0
        ? issues.filter(i => ['assigned', 'in_progress'].includes(i.status)).map((i: any, idx: number) => ({
            id: i.id, ticket_id: `FX-${1000 + idx}`, category: i.category,
            address: i.address, assigned_worker: i.assigned_worker || 'Unassigned',
            created_at: i.created_at, sla_deadline: i.sla_deadline, status: i.status,
        }))
        : demoSLA;

    return (
        <section className="mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">SLA Performance</h2>
                <p className="text-civic-muted text-sm">24-hour resolution compliance tracker</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Ticket</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Worker</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">Time Left</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-civic-muted uppercase tracking-wider">SLA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tickets.slice(0, 8).map((t) => {
                                const sla = getSLAInfo(t.created_at, t.sla_deadline);
                                return (
                                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-civic-orange font-mono text-xs font-bold">{t.ticket_id}</td>
                                        <td className="px-4 py-3 text-sm text-white capitalize">{t.category}</td>
                                        <td className="px-4 py-3 text-xs text-civic-muted truncate max-w-[150px]">{t.address || '--'}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1 text-xs text-civic-muted">
                                                <User className="w-3 h-3" />{t.assigned_worker}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 text-xs font-semibold ${sla.color}`}>
                                                <Clock className="w-3 h-3" />{sla.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="w-16 h-1.5 bg-civic-border rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${sla.pct >= 100 ? 'bg-red-500' : sla.pct > 75 ? 'bg-orange-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(sla.pct, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </section>
    );
};
