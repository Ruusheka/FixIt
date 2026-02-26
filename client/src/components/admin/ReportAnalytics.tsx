import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

/* ── Demo data ── */
const weeklyData = [
    { day: 'Mon', reports: 18, resolved: 14 },
    { day: 'Tue', reports: 24, resolved: 19 },
    { day: 'Wed', reports: 15, resolved: 22 },
    { day: 'Thu', reports: 30, resolved: 16 },
    { day: 'Fri', reports: 22, resolved: 25 },
    { day: 'Sat', reports: 10, resolved: 12 },
    { day: 'Sun', reports: 8, resolved: 6 },
];

const monthlyData = [
    { month: 'Aug', total: 120 }, { month: 'Sep', total: 145 },
    { month: 'Oct', total: 190 }, { month: 'Nov', total: 165 },
    { month: 'Dec', total: 210 }, { month: 'Jan', total: 240 },
    { month: 'Feb', total: 180 },
];

const statusDistribution = [
    { name: 'Reported', value: 35, color: '#54002344' },
    { name: 'In Progress', value: 25, color: '#54002388' },
    { name: 'Assigned', value: 15, color: '#540023BB' },
    { name: 'Resolved', value: 20, color: '#540023' },
    { name: 'Verified', value: 5, color: '#000000' },
];

const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(84,0,35,0.05)',
    borderRadius: '12px',
    color: '#540023',
    fontSize: '11px',
    fontWeight: 'bold',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

export const ReportAnalytics: React.FC = () => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <XAxis dataKey="day" tick={{ fill: '#540023', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
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
                        <XAxis dataKey="month" tick={{ fill: '#540023', fontSize: 10, fontWeight: 900 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#54002366', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="total" stroke="#540023" strokeWidth={3} dot={{ fill: '#540023', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Status Pie */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="minimal-card p-6 bg-white"
            >
                <h3 className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest mb-6 border-b border-brand-secondary/5 pb-4">Operational Mix</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={statusDistribution}
                            cx="50%" cy="45%"
                            innerRadius={50} outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {statusDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            formatter={(value: string) => <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/60">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    </section>
);
