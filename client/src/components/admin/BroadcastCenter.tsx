import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Radio, AlertTriangle, CloudRain, Construction, Megaphone } from 'lucide-react';

const broadcastTypes = [
    { value: 'emergency', label: 'Emergency Alert', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400' },
    { value: 'maintenance', label: 'Maintenance Notice', icon: <Construction className="w-4 h-4" />, color: 'text-orange-400' },
    { value: 'weather', label: 'Weather Warning', icon: <CloudRain className="w-4 h-4" />, color: 'text-blue-400' },
    { value: 'announcement', label: 'General Announcement', icon: <Megaphone className="w-4 h-4" />, color: 'text-purple-400' },
];

const zones = ['All Zones', 'Zone 1 - Highway', 'Zone 2 - Downtown', 'Zone 3 - Industrial', 'Zone 4 - Residential', 'Zone 5 - Market'];

export const BroadcastCenter: React.FC = () => {
    const [type, setType] = useState('announcement');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [zone, setZone] = useState('All Zones');
    const [priority, setPriority] = useState('medium');
    const [sent, setSent] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setTitle(''); setDescription('');
    };

    return (
        <section className="mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Radio className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-bold text-white">Mass Broadcast Center</h2>
                </div>
                <p className="text-civic-muted text-sm">Push alerts & announcements to citizen dashboards</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6"
            >
                {sent && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-sm font-medium"
                    >
                        ✅ Broadcast sent successfully to all citizens!
                    </motion.div>
                )}

                <form onSubmit={handleSend} className="space-y-4">
                    {/* Type selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {broadcastTypes.map(bt => (
                            <button
                                key={bt.value}
                                type="button"
                                onClick={() => setType(bt.value)}
                                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all ${type === bt.value ? 'glass-card-light border-civic-orange/30 text-white' : 'glass-card text-civic-muted hover:text-white'
                                    }`}
                            >
                                <span className={bt.color}>{bt.icon}</span>
                                {bt.label}
                            </button>
                        ))}
                    </div>

                    {/* Title */}
                    <input
                        type="text" required
                        value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Broadcast title..."
                        className="w-full glass-card bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-1 focus:ring-civic-orange/50 placeholder:text-civic-muted/50"
                    />

                    {/* Description */}
                    <textarea
                        required rows={3}
                        value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="Detailed message for citizens..."
                        className="w-full glass-card bg-white/5 text-white text-sm px-4 py-3 focus:outline-none focus:ring-1 focus:ring-civic-orange/50 placeholder:text-civic-muted/50 resize-none"
                    />

                    {/* Zone + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={zone} onChange={e => setZone(e.target.value)}
                            className="glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none"
                        >
                            {zones.map(z => <option key={z} value={z} className="bg-civic-dark">{z}</option>)}
                        </select>
                        <select
                            value={priority} onChange={e => setPriority(e.target.value)}
                            className="glass-card bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none"
                        >
                            <option value="low" className="bg-civic-dark">Low Priority</option>
                            <option value="medium" className="bg-civic-dark">Medium Priority</option>
                            <option value="high" className="bg-civic-dark">High Priority</option>
                            <option value="critical" className="bg-civic-dark">Critical</option>
                        </select>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-civic-orange text-white font-semibold rounded-2xl shadow-lg shadow-red-500/20"
                    >
                        <Send className="w-4 h-4" /> Broadcast to Citizens
                    </motion.button>
                </form>
            </motion.div>
        </section>
    );
};
