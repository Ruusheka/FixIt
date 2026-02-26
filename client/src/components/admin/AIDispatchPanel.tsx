import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Search, Zap, Droplets, Lightbulb, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Recommendation {
    id: string;
    message: string;
    zone: string;
    severity: 'high' | 'medium' | 'low';
    type: 'cluster' | 'prediction' | 'anomaly';
    icon: React.ReactNode;
}

const demoRecommendations: Recommendation[] = [
    {
        id: '1',
        message: '5 streetlight failures in Zone 3 → Assign Electrical Team',
        zone: 'Zone 3 - Industrial Area',
        severity: 'high',
        type: 'cluster',
        icon: <Lightbulb className="w-4 h-4" />,
    },
    {
        id: '2',
        message: 'Water leak cluster detected → Possible pipeline burst',
        zone: 'Zone 7 - Residential Block C',
        severity: 'high',
        type: 'prediction',
        icon: <Droplets className="w-4 h-4" />,
    },
    {
        id: '3',
        message: 'Pothole density increasing on NH-48 → Schedule preventive maintenance',
        zone: 'Zone 1 - Highway Corridor',
        severity: 'medium',
        type: 'anomaly',
        icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
        id: '4',
        message: 'Sanitation reports up 200% in Sector 12 → Deploy extra crew',
        zone: 'Zone 5 - Market Area',
        severity: 'medium',
        type: 'cluster',
        icon: <Zap className="w-4 h-4" />,
    },
];

const severityBorder: Record<string, string> = {
    high: 'border-l-red-500',
    medium: 'border-l-brand-secondary/40',
    low: 'border-l-brand-secondary/10',
};

export const AIDispatchPanel: React.FC = () => (
    <section className="mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-secondary rounded-xl">
                    <Brain className="w-6 h-6 text-brand-primary" />
                </div>
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Predictive Dispatch</h2>
            </div>
            <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">AI-synthesized pattern recommendations</p>
        </motion.div>

        <div className="space-y-4">
            {demoRecommendations.map((rec, i) => (
                <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 5 }}
                    className={`minimal-card p-5 bg-white border-l-4 ${severityBorder[rec.severity]} flex items-center justify-between gap-6 group cursor-pointer shadow-soft`}
                >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="p-3 rounded-2xl bg-brand-secondary/5 text-brand-secondary group-hover:bg-brand-secondary group-hover:text-brand-primary transition-all">
                            {rec.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-brand-secondary font-black tracking-tight leading-tight mb-1">{rec.message}</p>
                            <p className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-widest">{rec.zone}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <Link
                            to={`/admin/reports?search=${encodeURIComponent(rec.zone.split(' - ')[0])}`}
                            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-brand-secondary rounded-xl hover:opacity-90 transition-all"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> Deploy
                        </Link>
                        <Link
                            to={`/admin/reports?search=${encodeURIComponent(rec.zone.split(' - ')[0])}`}
                            className="flex items-center justify-center p-2.5 text-brand-secondary/20 hover:text-brand-secondary transition-colors bg-brand-secondary/5 rounded-xl"
                        >
                            <Search className="w-4 h-4" />
                        </Link>
                        <button className="flex items-center justify-center p-2.5 text-brand-secondary/20 hover:text-brand-secondary transition-colors bg-brand-secondary/5 rounded-xl">
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);
