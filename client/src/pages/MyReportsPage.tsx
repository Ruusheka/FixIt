import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { TicketTracker } from '../components/citizen/TicketTracker';

interface Ticket {
    id: string;
    ticket_id: string;
    image_url?: string;
    category: string;
    status: string;
    created_at: string;
    assigned_worker?: string;
    sla_deadline?: string;
}

export const MyReportsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myTickets, setMyTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchTickets = async () => {
            const { data } = await supabase
                .from('issues')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data && data.length > 0) {
                const tickets: Ticket[] = data.map((d: any, i: number) => ({
                    id: d.id,
                    ticket_id: `FX-${1000 + i}`,
                    image_url: d.image_url,
                    category: d.category,
                    status: d.status,
                    created_at: d.created_at,
                    assigned_worker: d.assigned_worker,
                    sla_deadline: d.sla_deadline,
                }));
                setMyTickets(tickets);
            }
        };
        fetchTickets();
    }, [user]);

    return (
        <div className="min-h-screen bg-brand-primary p-6 md:p-12 lg:p-20">
            <div className="max-w-7xl mx-auto">
                {/* Header — exact copy from CitizenDashboard */}
                <button
                    onClick={() => navigate('/citizen')}
                    className="mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 hover:text-brand-secondary transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                <section id="my-reports" className="space-y-12">
                    <div className="border-b border-brand-secondary/5 pb-8">
                        <h3 className="text-4xl font-black tracking-tighter text-brand-secondary uppercase">Active Operations</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">Status and timeline for your specific submissions</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {myTickets.length > 0 ? myTickets.map((ticket, i) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <TicketTracker ticket={ticket} />
                            </motion.div>
                        )) : (
                            <div className="minimal-card p-20 text-center col-span-full border-dashed border-brand-secondary/10">
                                <FileText className="w-16 h-16 text-brand-secondary/5 mx-auto mb-6" />
                                <p className="text-sm font-black text-brand-secondary/20 uppercase tracking-widest">No active operations found</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
