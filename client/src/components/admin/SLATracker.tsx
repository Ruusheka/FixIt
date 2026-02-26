import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';

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

    if (remaining <= 0) return { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-500/5', pct: 100 };
    const totalMs = end - new Date(createdAt).getTime();
    const pct = ((totalMs - remaining) / totalMs) * 100;
    if (pct > 75) return { label: formatTime(remaining), color: 'text-brand-secondary', bg: 'bg-brand-secondary/5', pct };
    return { label: formatTime(remaining), color: 'text-brand-secondary', bg: 'bg-brand-secondary/5', pct };
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
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Operational Latency</h2>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest">SLA Compliance Pipeline</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="minimal-card overflow-hidden bg-white shadow-soft"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-brand-secondary/5 bg-brand-secondary/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Identifier</th>
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Designation</th>
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Operative</th>
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Delta</th>
                                <th className="px-6 py-4 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-secondary/5">
                            {tickets.slice(0, 8).map((t) => {
                                const sla = getSLAInfo(t.created_at, t.sla_deadline);
                                return (
                                    <tr key={t.id} className="hover:bg-brand-secondary/[0.01] transition-colors group">
                                        <td className="px-6 py-4 text-brand-secondary font-black text-xs">{t.ticket_id}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-brand-secondary/60 capitalize">{t.category}</td>
                                        <td className="px-6 py-4 text-[11px] font-medium text-brand-secondary/40 truncate max-w-[150px]">{t.address || '--'}</td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-xs font-bold text-brand-secondary/60">
                                                <User className="w-3.5 h-3.5 opacity-30" />{t.assigned_worker}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-tighter ${sla.color}`}>
                                                <Clock className="w-3.5 h-3.5" />{sla.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-20 h-1 bg-brand-secondary/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(sla.pct, 100)}%` }}
                                                    transition={{ duration: 1, ease: "circOut" }}
                                                    className={`h-full rounded-full ${sla.pct >= 100 ? 'bg-red-500' : 'bg-brand-secondary'}`}
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
