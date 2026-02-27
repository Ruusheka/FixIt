import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Send,
    Shield,
    MessageSquare,
    Zap,
    Terminal,
    Lock
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Report } from '../../types/reports';

interface AdminWorkerThreadProps {
    report: Report;
    adminId: string;
}

interface Message {
    id: string;
    report_id: string;
    sender_id: string;
    sender_role: string;
    channel: string;
    message_text: string;
    message?: string; // Compatibility
    created_at: string;
    sender?: {
        full_name: string;
    };
}

export const AdminWorkerThread: React.FC<AdminWorkerThreadProps> = ({ report, adminId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
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
            .select('*, sender:profiles(full_name)')
            .eq('report_id', report.id)
            .eq('channel', 'worker')
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
        setLoading(false);
        scrollToBottom();
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`worker_messages_${report.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                table: 'report_messages',
                schema: 'public',
                filter: `report_id=eq.${report.id}`
            }, async (payload) => {
                // Only take worker channel messages
                if (payload.new.channel !== 'worker') return;

                const { data: newMessage } = await (supabase
                    .from('report_messages') as any)
                    .select('*, sender:profiles(full_name)')
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
                sender_role: 'admin',
                channel: 'worker',
                message_text: text
            });

        if (error) {
            console.error("Error sending message:", error);
            setInputText(text);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    if (loading) return (
        <div className="h-[500px] flex items-center justify-center bg-brand-secondary/[0.02] rounded-[32px] border border-brand-secondary/5">
            <div className="flex flex-col items-center gap-4">
                <Terminal size={32} className="text-brand-secondary/20 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/20 italic">Initializing Tactical Link...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft overflow-hidden">
            {/* Thread Header */}
            <div className="p-6 bg-brand-secondary text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] italic flex items-center gap-2">
                            Field Ops Direct Link <Zap size={10} className="text-brand-primary" />
                        </h4>
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest italic">
                            Report ID: {report.id.split('-')[0]} // Secure Channel
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/10">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Link Active</span>
                    </div>
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] italic">Encryption: AES-256</span>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-brand-primary/[0.02]"
            >
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center opacity-30">
                    <div className="p-4 bg-brand-secondary/5 rounded-full">
                        <Lock size={24} className="text-brand-secondary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em]">Tactical Interface Locked</p>
                        <p className="text-[8px] font-bold text-brand-secondary italic uppercase max-w-[250px] leading-relaxed">
                            Communication restricted to assigned field operatives and authorized command personnel.
                        </p>
                    </div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_role === 'admin';
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-6 py-4 rounded-[24px] text-sm font-bold shadow-sm transition-all ${isMe
                                    ? 'bg-brand-secondary text-white rounded-tr-none'
                                    : 'bg-white text-brand-secondary border border-brand-secondary/10 rounded-tl-none'
                                    }`}>
                                    {msg.message_text || msg.message}
                                </div>
                                <div className="flex items-center gap-2 mt-2 px-2">
                                    {!isMe && (
                                        <span className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-[0.1em] italic">
                                            [FIELD OPS] {msg.sender?.full_name || 'Worker'}
                                        </span>
                                    )}
                                    {isMe && (
                                        <span className="text-[8px] font-black text-brand-secondary/40 uppercase tracking-[0.1em] italic">
                                            [COMMAND]
                                        </span>
                                    )}
                                    <span className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest italic">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-brand-secondary/5 relative">
                <form onSubmit={sendMessage} className="relative group">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Issue directive to field operative..."
                        className="w-full pl-8 pr-16 py-5 bg-brand-secondary/5 border-none rounded-[24px] text-sm font-bold text-brand-secondary focus:ring-2 focus:ring-brand-secondary/10 transition-all placeholder:text-brand-secondary/20 italic"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-secondary text-white rounded-2xl disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-secondary/20 flex items-center justify-center shrink-0"
                    >
                        <Send size={20} className="ml-1" />
                    </button>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-secondary/20 flex items-center justify-center">
                        <div className="w-0.5 h-0.5 rounded-full bg-brand-secondary" />
                    </div>
                </form>
            </div>
        </div>
    );
};
