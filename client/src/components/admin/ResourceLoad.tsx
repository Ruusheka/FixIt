import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, AlertTriangle, Briefcase } from 'lucide-react';

const departmentData = [
    { dept: 'Roads', active: 15, workers: 8, breaches: 2 },
    { dept: 'Water', active: 9, workers: 5, breaches: 1 },
    { dept: 'Electricity', active: 12, workers: 6, breaches: 3 },
    { dept: 'Sanitation', active: 7, workers: 4, breaches: 0 },
];

const tooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
};

export const ResourceLoad: React.FC = () => (
    <section className="mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Resource Load</h2>
            <p className="text-civic-muted text-sm">Department workload & workforce planning</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-5"
            >
                <h3 className="text-sm font-semibold text-white mb-4">Active Jobs by Department</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={departmentData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} />
                        <YAxis type="category" dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} width={80} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="active" fill="#f97316" radius={[0, 4, 4, 0]} name="Active Jobs" />
                        <Bar dataKey="workers" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Workers" />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Department cards */}
            <div className="grid grid-cols-2 gap-3">
                {departmentData.map((dept, i) => (
                    <motion.div
                        key={dept.dept}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className="glass-card p-4"
                    >
                        <h4 className="text-sm font-semibold text-white mb-3">{dept.dept}</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-civic-muted"><Briefcase className="w-3 h-3" /> Active</span>
                                <span className="font-bold text-white">{dept.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-civic-muted"><Users className="w-3 h-3" /> Workers</span>
                                <span className="font-bold text-white">{dept.workers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 text-civic-muted"><AlertTriangle className="w-3 h-3" /> Breaches</span>
                                <span className={`font-bold ${dept.breaches > 0 ? 'text-red-400' : 'text-green-400'}`}>{dept.breaches}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);
