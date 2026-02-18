import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Search, Zap, Droplets, Lightbulb, AlertTriangle } from 'lucide-react';

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

const severityColors: Record<string, string> = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-green-500',
};

export const AIDispatchPanel: React.FC = () => (
    <section className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">AI Auto-Dispatch</h2>
            </div>
            <p className="text-civic-muted text-sm">AI-generated recommendations based on pattern analysis</p>
        </motion.div>

        <div className="space-y-3">
            {demoRecommendations.map((rec, i) => (
                <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass-card p-4 border-l-2 ${severityColors[rec.severity]} flex items-start gap-4`}
                >
                    <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 flex-shrink-0">
                        {rec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{rec.message}</p>
                        <p className="text-xs text-civic-muted mt-0.5">{rec.zone}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-green-400 glass-card hover:bg-green-500/10 transition-colors">
                            <CheckCircle className="w-3 h-3" /> Accept
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-civic-muted glass-card hover:bg-white/5 transition-colors">
                            <Search className="w-3 h-3" /> Investigate
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-civic-muted glass-card hover:bg-white/5 transition-colors">
                            <XCircle className="w-3 h-3" /> Ignore
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);
