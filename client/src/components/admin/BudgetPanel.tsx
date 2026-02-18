import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Eye, EyeOff, Wrench, Clock, Package } from 'lucide-react';

interface BudgetItem {
    id: string;
    ticket_id: string;
    category: string;
    repairCost: number;
    materials: string;
    laborHours: number;
    published: boolean;
}

const demoItems: BudgetItem[] = [
    { id: '1', ticket_id: 'FX-1025', category: 'pothole', repairCost: 4500, materials: 'Asphalt, Gravel', laborHours: 3, published: true },
    { id: '2', ticket_id: 'FX-1019', category: 'streetlight', repairCost: 2800, materials: 'LED Bulb, Wiring', laborHours: 2, published: false },
    { id: '3', ticket_id: 'FX-1015', category: 'water leak', repairCost: 12000, materials: 'PVC Pipe, Sealant', laborHours: 6, published: true },
    { id: '4', ticket_id: 'FX-1010', category: 'garbage', repairCost: 800, materials: 'Bins, Bags', laborHours: 1.5, published: false },
];

export const BudgetPanel: React.FC = () => {
    const totalCost = demoItems.reduce((s, i) => s + i.repairCost, 0);

    return (
        <section className="mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Budget Transparency</h2>
                <p className="text-civic-muted text-sm">Repair cost publishing for civic trust</p>
            </motion.div>

            {/* Total cost card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-5 mb-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-green-500/15 text-green-400">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs text-civic-muted uppercase tracking-wider">Total Expenditure</div>
                        <div className="text-2xl font-bold text-white">₹{totalCost.toLocaleString()}</div>
                    </div>
                </div>
                <div className="text-xs text-civic-muted">{demoItems.filter(i => i.published).length}/{demoItems.length} published</div>
            </motion.div>

            {/* Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {demoItems.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-card p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <span className="text-civic-orange font-mono text-xs font-bold">{item.ticket_id}</span>
                                <span className="text-civic-muted text-xs ml-2 capitalize">• {item.category}</span>
                            </div>
                            <button className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${item.published ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-civic-muted hover:text-white'
                                }`}>
                                {item.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {item.published ? 'Public' : 'Private'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="glass-card-light p-2 rounded-lg">
                                <DollarSign className="w-3 h-3 mx-auto text-green-400 mb-0.5" />
                                <div className="text-sm font-bold text-white">₹{item.repairCost.toLocaleString()}</div>
                                <div className="text-[9px] text-civic-muted">Cost</div>
                            </div>
                            <div className="glass-card-light p-2 rounded-lg">
                                <Package className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                                <div className="text-[11px] font-medium text-white truncate">{item.materials.split(',')[0]}</div>
                                <div className="text-[9px] text-civic-muted">Materials</div>
                            </div>
                            <div className="glass-card-light p-2 rounded-lg">
                                <Clock className="w-3 h-3 mx-auto text-orange-400 mb-0.5" />
                                <div className="text-sm font-bold text-white">{item.laborHours}h</div>
                                <div className="text-[9px] text-civic-muted">Labor</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
