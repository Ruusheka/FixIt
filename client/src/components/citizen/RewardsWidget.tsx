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
    { icon: <Star className="w-4 h-4" />, label: 'Civic Points', value: d.civicPoints.toLocaleString(), color: 'text-yellow-400' },
    { icon: <FileText className="w-4 h-4" />, label: 'Reports', value: d.reportsSubmitted, color: 'text-civic-orange' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Verified', value: d.issuesVerified, color: 'text-civic-green' },
    { icon: <TrendingUp className="w-4 h-4" />, label: 'Rank', value: `#${d.leaderboardRank}`, color: 'text-civic-blue' },
];

export const RewardsWidget: React.FC<RewardsWidgetProps> = ({ data }) => {
    const d = data || defaultData;

    return (
        <section id="rewards" className="px-6 md:px-12 lg:px-20 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Your Civic Impact</h2>
                <p className="text-civic-muted text-sm">Every report makes a difference</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6 glow-orange"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Badge */}
                    <div className="flex items-center gap-4">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-civic-orange to-yellow-500 flex items-center justify-center shadow-lg shadow-civic-orange/30"
                        >
                            <Trophy className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <div className="text-xs text-civic-muted uppercase tracking-wider">Current Badge</div>
                            <div className="text-lg font-bold text-white">{d.levelTitle} Level {d.level}</div>
                            <div className="w-32 h-1.5 bg-civic-border rounded-full mt-1 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '60%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="h-full bg-gradient-to-r from-civic-orange to-yellow-400 rounded-full"
                                />
                            </div>
                            <div className="text-[10px] text-civic-muted mt-0.5">750 pts to Level {d.level + 1}</div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        {stats(d).map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="glass-card-light p-3 text-center"
                            >
                                <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
                                <div className="text-xl font-bold text-white">{stat.value}</div>
                                <div className="text-[10px] text-civic-muted">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
