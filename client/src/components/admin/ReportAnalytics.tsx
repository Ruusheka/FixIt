import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(84,0,35,0.05)',
    borderRadius: '12px',
    color: '#540023',
    fontSize: '11px',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

interface ReportAnalyticsProps {
    issues: any[];
}

export const ReportAnalytics: React.FC<ReportAnalyticsProps> = ({ issues }) => {
    // 1. Process Weekly Velocity (last 7 days)
    const weeklyData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                dateStr: d.toDateString(),
                label: days[d.getDay()],
                reports: 0,
                resolved: 0
            };
        });

        issues.forEach(issue => {
            const issueDate = new Date(issue.created_at).toDateString();
            const daySlot = last7Days.find(d => d.dateStr === issueDate);
            if (daySlot) {
                daySlot.reports++;
                if (issue.status === 'closed' || issue.status === 'resolved') {
                    daySlot.resolved++;
                }
            }
        });

        return last7Days;
    }, [issues]);

    // 2. Process Long-term Growth (last 6 months)
    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
                monthIdx: d.getMonth(),
                year: d.getFullYear(),
                label: months[d.getMonth()],
                total: 0
            };
        });

        issues.forEach(issue => {
            const date = new Date(issue.created_at);
            const slot = last6Months.find(m => m.monthIdx === date.getMonth() && m.year === date.getFullYear());
            if (slot) slot.total++;
        });

        return last6Months;
    }, [issues]);

    return (
        <section className="mb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
            >
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase mb-1">Analytical Ingress</h2>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest">Multi-vector temporal analysis</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Bar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="minimal-card p-6 bg-white"
                >
                    <h3 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mb-6 border-b border-brand-secondary/5 pb-4">Weekly Velocity</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="2 2" stroke="rgba(84,0,35,0.03)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#540023', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#54002366', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(84,0,35,0.02)' }} />
                            <Bar dataKey="reports" fill="#540023" radius={[2, 2, 0, 0]} barSize={12} />
                            <Bar dataKey="resolved" fill="#54002333" radius={[2, 2, 0, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Monthly Line Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="minimal-card p-6 bg-white"
                >
                    <h3 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mb-6 border-b border-brand-secondary/5 pb-4">Long-term Growth</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="2 2" stroke="rgba(84,0,35,0.03)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#540023', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#54002366', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="total" stroke="#540023" strokeWidth={3} dot={{ fill: '#540023', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </section>
    );
};
