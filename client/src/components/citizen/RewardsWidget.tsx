import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, FileText, ShieldCheck, TrendingUp, Star } from 'lucide-react';

interface RewardsData {
    civicPoints: number;
    reportsSubmitted: number;
    issuesVerified: number;
    leaderboardRank: number;
    level: number;
    levelTitle: string;
}

interface RewardsWidgetProps {
    data?: RewardsData;
}

const defaultData: RewardsData = {
    civicPoints: 1250,
    reportsSubmitted: 23,
    issuesVerified: 8,
    leaderboardRank: 47,
    level: 2,
    levelTitle: 'Civic Hero',
};

const stats = (d: RewardsData) => [
    { icon: <Star className="w-4 h-4" />, label: 'Civic Points', value: d.civicPoints.toLocaleString(), color: 'text-brand-secondary' },
    { icon: <FileText className="w-4 h-4" />, label: 'Reports', value: d.reportsSubmitted, color: 'text-brand-secondary/60' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Verified', value: d.issuesVerified, color: 'text-brand-secondary/80' },
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Rank', value: `#${d.leaderboardRank}`, color: 'text-brand-secondary/40' },
];

export const RewardsWidget: React.FC<RewardsWidgetProps> = ({ data }) => {
    const d = data || defaultData;

    return (
        <section id="rewards" className="px-6 md:px-12 lg:px-20 py-24 border-t border-brand-secondary/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12 text-center"
            >
                <h2 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-4">Your Civic Impact</h2>
                <p className="text-brand-secondary/40 text-[10px] font-black uppercase tracking-[0.3em]">Quantifying contribution to the community grid</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="minimal-card p-10"
            >
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    {/* Badge */}
                    <div className="flex items-center gap-6 shrink-0">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-24 rounded-3xl bg-brand-secondary flex items-center justify-center shadow-2xl shadow-brand-secondary/20"
                        >
                            <Trophy className="w-10 h-10 text-brand-primary" />
                        </motion.div>
                        <div>
                            <div className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mb-1">Operational Tier</div>
                            <div className="text-2xl font-black text-brand-secondary uppercase tracking-tighter">{d.levelTitle} Lvl {d.level}</div>
                            <div className="w-48 h-1.5 bg-brand-secondary/5 rounded-full mt-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '60%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-brand-secondary rounded-full"
                                />
                            </div>
                            <div className="text-[9px] font-black text-brand-secondary/20 uppercase tracking-widest mt-2">750 pts to Level {d.level + 1}</div>
                        </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden lg:block w-px h-24 bg-brand-secondary/5" />

                    {/* Stats */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                        {stats(d).map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="text-center group"
                            >
                                <div className={`flex justify-center mb-3 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                                    {stat.icon}
                                </div>
                                <div className="text-3xl font-black text-brand-secondary tracking-tighter mb-1">{stat.value}</div>
                                <div className="text-[9px] font-black text-brand-secondary/30 uppercase tracking-[0.2em]">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
