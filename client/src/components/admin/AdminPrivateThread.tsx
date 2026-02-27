import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Lock,
    User,
    ShieldCheck,
    MessageCircle,
    Clock
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Report, PrivateMessage, Profile } from '../../types/reports';

interface AdminPrivateThreadProps {
    report: Report;
    adminId: string;
}

export const AdminPrivateThread: React.FC<AdminPrivateThreadProps> = ({ report, adminId }) => {
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [threadId, setThreadId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (report.id) {
            fetchMessages();
            subscribeToMessages();
        }
    }, [report.id]);

    const fetchMessages = async () => {
        setLoading(true);
        const { data } = await (supabase
            .from('report_messages') as any)
            .select('*, sender:profiles(*)')
            .eq('report_id', report.id)
            .neq('channel', 'worker')
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
        setLoading(false);
        scrollToBottom();
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`report_messages_${report.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                table: 'report_messages',
                schema: 'public',
                filter: `report_id=eq.${report.id}`
            }, async (payload) => {
                if (payload.new.channel === 'worker') return;

                const { data: newMessage } = await (supabase
                    .from('report_messages') as any)
                    .select('*, sender:profiles(*)')
                    .eq('id', payload.new.id)
                    .single();

                if (newMessage) {
                    setMessages(prev => [...prev, newMessage]);
                    scrollToBottom();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');

        const { error } = await (supabase
            .from('report_messages') as any)
            .insert({
                report_id: report.id,
                sender_id: adminId,
                message_text: text,
                channel: 'admin_citizen'
            });

        if (error) {
            console.error("Error sending message:", error);
            setInputText(text); // Restore on error
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    if (loading) return <div className="h-64 flex items-center justify-center text-brand-secondary/20 font-black animate-pulse">ESTABLISHING ENCRYPTED LINK...</div>;

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-3xl border border-brand-secondary/10 shadow-soft overflow-hidden">
            {/* Thread Header */}
            <div className="p-4 bg-brand-secondary text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                        <Lock size={16} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Admin Link</h4>
                        <p className="text-[9px] font-bold text-white/40 uppercase">Citizen: {report.reporter?.full_name || 'Anonymous'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Realtime</span>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-brand-primary/5"
            >
                <div className="flex flex-col items-center justify-center py-4 space-y-2 text-center">
                    <MessageCircle size={24} className="text-brand-secondary/10" />
                    <p className="text-[9px] font-bold text-brand-secondary/30 uppercase max-w-[200px] leading-relaxed">
                        This channel is private. Only the citizen and assigned admins can view these messages.
                    </p>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_id === adminId;
                    return (
                        <motion.div
                            initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all ${isMe
                                    ? 'bg-brand-secondary text-white rounded-tr-none'
                                    : 'bg-white text-brand-secondary border border-brand-secondary/5 rounded-tl-none'
                                    }`}>
                                    {msg.message_text}
                                </div>
                                <div className="flex items-center gap-2 mt-1 px-1">
                                    {!isMe && <span className="text-[8px] font-black text-brand-secondary/40 uppercase">{msg.sender?.full_name || 'Citizen'}</span>}
                                    <span className="text-[8px] font-bold text-brand-secondary/20">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-brand-secondary/5">
                <div className="relative">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Secure message..."
                        className="w-full pl-4 pr-12 py-3 bg-brand-primary/10 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-secondary/10 transition-all placeholder:text-brand-secondary/20"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-secondary text-white rounded-xl disabled:opacity-50 disabled:bg-brand-secondary/20 transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};
