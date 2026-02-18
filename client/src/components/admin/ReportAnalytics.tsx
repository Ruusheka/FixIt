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
    { name: 'Reported', value: 35, color: '#6b7280' },
    { name: 'In Progress', value: 25, color: '#f97316' },
    { name: 'Assigned', value: 15, color: '#3b82f6' },
    { name: 'Resolved', value: 20, color: '#22c55e' },
    { name: 'Verified', value: 5, color: '#a855f7' },
];

const tooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
};

export const ReportAnalytics: React.FC = () => (
    <section className="mb-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6"
        >
            <h2 className="text-xl font-bold text-white mb-1">Report Analytics</h2>
            <p className="text-civic-muted text-sm">Reporting trends & status distribution</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weekly Bar Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-white mb-4">This Week</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="reports" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Monthly Line Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-white mb-4">Monthly Growth</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Status Pie */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-white mb-4">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={statusDistribution}
                            cx="50%" cy="50%"
                            innerRadius={45} outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {statusDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend
                            verticalAlign="bottom"
                            formatter={(value: string) => <span className="text-xs text-civic-muted">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    </section>
);
