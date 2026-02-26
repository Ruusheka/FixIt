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
    backgroundColor: '#540023',
    border: 'none',
    borderRadius: '12px',
    color: '#CCCFBA',
    fontSize: '10px',
    fontWeight: '900',
    textTransform: 'uppercase' as const,
    boxShadow: '0 10px 25px -5px rgba(84,0,35,0.3)',
};

export const ResourceLoad: React.FC = () => (
    <section className="mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-secondary rounded-xl">
                    <Users className="w-6 h-6 text-brand-primary" />
                </div>
                <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Resource Allocation</h2>
            </div>
            <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">Workload density & workforce utility planning</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="minimal-card p-10 bg-white"
            >
                <h3 className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mb-8">Active Operations Index</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentData} layout="vertical" margin={{ left: -10, right: 20 }}>
                        <CartesianGrid strokeDasharray="8 8" stroke="#54002308" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="dept"
                            tick={{ fill: '#540023', fontSize: 10, fontWeight: 900 }}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            cursor={{ fill: '#54002305' }}
                        />
                        <Bar dataKey="active" fill="#540023" radius={[0, 12, 12, 0]} barSize={32} name="Active Jobs" />
                        <Bar dataKey="workers" fill="#CCCFBA" radius={[0, 12, 12, 0]} barSize={32} name="Workers" />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Department cards */}
            <div className="grid grid-cols-2 gap-4">
                {departmentData.map((dept, i) => (
                    <motion.div
                        key={dept.dept}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="minimal-card p-6 bg-white border border-brand-secondary/5 group hover:bg-brand-secondary transition-all cursor-default"
                    >
                        <h4 className="text-xs font-black text-brand-secondary group-hover:text-brand-primary uppercase tracking-widest mb-4 transition-colors">{dept.dept}</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[9px] font-bold text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest"><Briefcase className="w-3 h-3" /> In-Flight</span>
                                <span className="text-sm font-black text-brand-secondary group-hover:text-brand-primary">{dept.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[9px] font-bold text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest"><Users className="w-3 h-3" /> Assigned</span>
                                <span className="text-sm font-black text-brand-secondary group-hover:text-brand-primary">{dept.workers}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[9px] font-bold text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest"><AlertTriangle className="w-3 h-3" /> Variance</span>
                                <span className={`text-sm font-black transition-colors ${dept.breaches > 0 ? 'text-red-500 group-hover:text-brand-primary' : 'text-brand-secondary group-hover:text-brand-primary opacity-40'}`}>{dept.breaches}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);
