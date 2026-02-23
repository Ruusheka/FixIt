import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Radio, AlertTriangle, CloudRain, Construction, Megaphone } from 'lucide-react';

const broadcastTypes = [
    { value: 'emergency', label: 'Emergency', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600' },
    { value: 'maintenance', label: 'Maintenance', icon: <Construction className="w-4 h-4" />, color: 'text-brand-secondary' },
    { value: 'weather', label: 'Weather', icon: <CloudRain className="w-4 h-4" />, color: 'text-brand-secondary' },
    { value: 'announcement', label: 'General', icon: <Megaphone className="w-4 h-4" />, color: 'text-brand-secondary' },
];

const zones = ['All Operational Zones', 'Zone 1 - Core Highway', 'Zone 2 - Central District', 'Zone 3 - Industrial Hub', 'Zone 4 - Suburban Sector', 'Zone 5 - Perimeter'];

export const BroadcastCenter: React.FC = () => {
    const [type, setType] = useState('announcement');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [zone, setZone] = useState('All Operational Zones');
    const [priority, setPriority] = useState('medium');
    const [sent, setSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setTitle(''); setDescription('');
    };

    return (
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-secondary rounded-xl">
                        <Radio className="w-6 h-6 text-brand-primary animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Mass Ingress Link</h2>
                </div>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">Multi-channel citizen notification system</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="minimal-card p-10 bg-white"
            >
                {sent && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-2xl bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-[11px] font-black uppercase tracking-widest text-center"
                    >
                        ⚡ Transmission successful // all endpoints updated
                    </motion.div>
                )}

                <form onSubmit={handleSend} className="space-y-8">
                    {/* Type selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Alert Vector</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {broadcastTypes.map(bt => (
                                <button
                                    key={bt.value}
                                    type="button"
                                    onClick={() => setType(bt.value)}
                                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${type === bt.value
                                            ? 'bg-brand-secondary text-white border-brand-secondary'
                                            : 'bg-white text-brand-secondary/40 border-brand-secondary/5 hover:border-brand-secondary/20 hover:text-brand-secondary'
                                        }`}
                                >
                                    <span className={type === bt.value ? 'text-brand-primary' : bt.color}>{bt.icon}</span>
                                    {bt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Tactical Title</label>
                                <input
                                    type="text" required
                                    value={title} onChange={e => setTitle(e.target.value)}
                                    placeholder="Brief subject..."
                                    className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-5 py-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 font-bold"
                                />
                            </div>

                            {/* Zone + Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Target Sector</label>
                                    <select
                                        value={zone} onChange={e => setZone(e.target.value)}
                                        className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold appearance-none"
                                    >
                                        {zones.map(z => <option key={z} value={z}>{z.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Priority Index</label>
                                    <select
                                        value={priority} onChange={e => setPriority(e.target.value)}
                                        className="w-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-xs px-5 py-4 rounded-2xl focus:outline-none font-bold appearance-none"
                                    >
                                        <option value="low">LOW PRIORITY</option>
                                        <option value="medium">NORMAL LOAD</option>
                                        <option value="high">HIGH PRIORITY</option>
                                        <option value="critical">CRITICAL ALERT</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2 flex flex-col">
                            <label className="text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest px-1">Primary Payload</label>
                            <textarea
                                required rows={6}
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Detailed broadcast content..."
                                className="w-full h-full bg-brand-secondary/5 border border-brand-secondary/5 text-brand-secondary text-sm px-5 py-5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-secondary/20 placeholder:text-brand-secondary/20 resize-none font-medium leading-relaxed"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex items-center justify-center gap-4 py-5 bg-brand-secondary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-brand-secondary/10 hover:opacity-95 transition-all"
                    >
                        <Send className="w-5 h-5" /> Execute Wide-Range Transmission
                    </motion.button>
                </form>
            </motion.div>
        </section>
    );
};
