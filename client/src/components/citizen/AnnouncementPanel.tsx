import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Construction, CloudRain, Building2, AlertTriangle, Info } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    description: string;
    type: 'water' | 'road' | 'flood' | 'government' | 'warning' | 'info';
    created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    water: { icon: <Droplets className="w-4 h-4" />, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
    road: { icon: <Construction className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/15' },
    flood: { icon: <CloudRain className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    government: { icon: <Building2 className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/15' },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/15' },
    info: { icon: <Info className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-500/15' },
};

// Demo announcements (will be replaced with Supabase data)
const demoAnnouncements: Announcement[] = [
    {
        id: '1',
        title: 'Water Supply Maintenance',
        description: 'Scheduled water maintenance in Sector 12 from 10AM-2PM tomorrow.',
        type: 'water',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        id: '2',
        title: 'MG Road Closure Alert',
        description: 'MG Road will be closed for resurfacing work from Feb 20-25.',
        type: 'road',
        created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        id: '3',
        title: 'Flood Warning - Low-lying Areas',
        description: 'Heavy rainfall expected. Citizens in low-lying areas should remain alert.',
        type: 'flood',
        created_at: new Date(Date.now() - 14400000).toISOString(),
    },
    {
        id: '4',
        title: 'Smart City Initiative Update',
        description: 'New AI-powered streetlights being installed across 50 junctions.',
        type: 'government',
        created_at: new Date(Date.now() - 28800000).toISOString(),
    },
];

const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

interface AnnouncementPanelProps {
    announcements?: Announcement[];
}

export const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ announcements }) => {
    const items = announcements && announcements.length > 0 ? announcements : demoAnnouncements;

    return (
        <section id="announcements" className="px-6 md:px-12 lg:px-20 py-24 border-t border-brand-secondary/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12 text-center"
            >
                <h2 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-4">Announcements & Alerts</h2>
                <p className="text-brand-secondary/40 text-[10px] font-black uppercase tracking-[0.3em]">Critical updates from the civic intelligence network</p>
            </motion.div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {items.map((announcement, i) => {
                    const config = typeConfig[announcement.type] || typeConfig.info;
                    return (
                        <motion.div
                            key={announcement.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ x: 4 }}
                            className="minimal-card p-6 flex items-start gap-6 cursor-pointer border-brand-secondary/5"
                        >
                            <div className={`p-3 rounded-2xl ${config.bg} ${config.color} flex-shrink-0 shadow-lg`}>
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-black text-brand-secondary uppercase tracking-tight text-sm">{announcement.title}</h4>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/20 flex-shrink-0 ml-4">
                                        {getTimeAgo(announcement.created_at)}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-brand-secondary/40 leading-relaxed uppercase tracking-tight line-clamp-2">
                                    {announcement.description}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
