import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { Send, Mail, User, MessageSquare, CheckCircle } from 'lucide-react';

export const ContactAdmin: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const { error } = await (supabase.from('contact_messages') as any).insert([formData]);
            if (error) throw error;
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Error sending message:', err);
            setStatus('error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[40px] border border-brand-secondary/5 shadow-2xl overflow-hidden p-8 lg:p-0">
            {/* Form Side */}
            <div className="p-8 lg:p-16 space-y-8">
                <div>
                    <h2 className="text-4xl font-black text-brand-secondary uppercase tracking-tight mb-2">Engage Command</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Direct transmission to city administration</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full Name"
                                className="input-field pl-12 py-4 w-full bg-brand-secondary/5 border-transparent focus:bg-white focus:border-brand-secondary/20 rounded-2xl"
                            />
                        </div>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Tactical Email"
                                className="input-field pl-12 py-4 w-full bg-brand-secondary/5 border-transparent focus:bg-white focus:border-brand-secondary/20 rounded-2xl"
                            />
                        </div>
                        <div className="relative group">
                            <MessageSquare className="absolute left-4 top-6 w-4 h-4 text-brand-secondary/20 group-focus-within:text-brand-secondary/50 transition-colors" />
                            <textarea
                                required
                                rows={4}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Operational Intel or Feedback..."
                                className="input-field pl-12 py-4 w-full bg-brand-secondary/5 border-transparent focus:bg-white focus:border-brand-secondary/20 rounded-2xl resize-none"
                            />
                        </div>
                    </div>

                    <button
                        disabled={status === 'sending'}
                        className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${status === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-brand-secondary text-brand-primary hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {status === 'sending' ? (
                            <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                        ) : status === 'success' ? (
                            <> <CheckCircle size={18} /> Transmission Received </>
                        ) : (
                            <> <Send size={18} /> Initiate Transmission </>
                        )}
                    </button>
                    {status === 'error' && (
                        <p className="text-[10px] font-black uppercase text-red-500 text-center tracking-widest">Signal Failure. Please try again.</p>
                    )}
                </form>
            </div>

            {/* Info Side */}
            <div className="hidden lg:flex flex-col justify-between p-16 bg-brand-secondary text-brand-primary relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                    <div className="w-16 h-1 bg-brand-primary/20 rounded-full" />
                    <p className="text-xl font-medium leading-relaxed opacity-80 italic">
                        "FixIt Systems prioritize transparency and citizen safety. Your direct feedback helps us optimize city-wide operations and response protocols."
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-xl"><Mail size={20} /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Operational Support</p>
                                <p className="text-sm font-bold">admin@fixit.city</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">Command & Control</h4>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
        </div>
    );
};
