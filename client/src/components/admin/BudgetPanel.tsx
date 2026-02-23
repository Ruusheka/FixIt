import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Eye, EyeOff, Clock, Package } from 'lucide-react';

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
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-secondary rounded-xl">
                        <DollarSign className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Fiscal Ledger</h2>
                </div>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">Operational expenditure transparency portal</p>
            </motion.div>

            {/* Total cost card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="minimal-card p-10 mb-8 flex items-center justify-between bg-white border border-brand-secondary/10"
            >
                <div>
                    <div className="text-[10px] font-black text-brand-secondary/30 uppercase tracking-[0.2em] mb-2">Total Combined Expenditure</div>
                    <div className="text-6xl font-black text-brand-secondary tracking-tighter transition-all hover:scale-[1.02] cursor-default">
                        ₹{totalCost.toLocaleString()}
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-5 py-2.5 rounded-2xl bg-brand-secondary text-brand-primary text-[10px] font-black uppercase tracking-widest mb-3">
                        Audited Infrastructure
                    </div>
                    <div className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
                        {demoItems.filter(i => i.published).length}/{demoItems.length} Nodes Published
                    </div>
                </div>
            </motion.div>

            {/* Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoItems.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="minimal-card p-6 bg-white group hover:border-brand-secondary/20 transition-all cursor-default"
                    >
                        <div className="flex items-center justify-between mb-6 border-b border-brand-secondary/5 pb-4">
                            <div>
                                <span className="text-brand-secondary font-black text-xs uppercase tracking-widest">{item.ticket_id}</span>
                                <span className="text-brand-secondary/30 text-[10px] font-bold ml-3 uppercase tracking-widest">// {item.category}</span>
                            </div>
                            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${item.published
                                    ? 'bg-brand-secondary text-brand-primary'
                                    : 'bg-brand-secondary/5 text-brand-secondary/40 hover:text-brand-secondary'
                                }`}>
                                {item.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                {item.published ? 'Publicized' : 'Restricted'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-brand-secondary/5 group-hover:bg-brand-secondary transition-all">
                                <DollarSign className="w-4 h-4 text-brand-secondary group-hover:text-brand-primary mb-2 opacity-40 mx-auto" />
                                <div className="text-sm font-black text-brand-secondary group-hover:text-brand-primary text-center">₹{item.repairCost.toLocaleString()}</div>
                                <div className="text-[9px] font-black text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest text-center mt-1">Cost</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-brand-secondary/5 group-hover:bg-brand-secondary transition-all">
                                <Package className="w-4 h-4 text-brand-secondary group-hover:text-brand-primary mb-2 opacity-40 mx-auto" />
                                <div className="text-[11px] font-black text-brand-secondary group-hover:text-brand-primary truncate text-center">{item.materials.split(',')[0]}</div>
                                <div className="text-[9px] font-black text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest text-center mt-1">Supply</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-brand-secondary/5 group-hover:bg-brand-secondary transition-all">
                                <Clock className="w-4 h-4 text-brand-secondary group-hover:text-brand-primary mb-2 opacity-40 mx-auto" />
                                <div className="text-sm font-black text-brand-secondary group-hover:text-brand-primary text-center">{item.laborHours}h</div>
                                <div className="text-[9px] font-black text-brand-secondary/30 group-hover:text-brand-primary/40 uppercase tracking-widest text-center mt-1">Load</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
