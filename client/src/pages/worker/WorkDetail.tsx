import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Clock, MapPin, AlertTriangle, ArrowLeft, Camera, Send, MessageSquare, CheckCircle, Target, Image as ImageIcon, AlertOctagon, RotateCcw } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ProofUploadModal } from '../../components/worker/ProofUploadModal';

// Deadline countdown helper
const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const dl = new Date(deadline);
    const diffMs = dl.getTime() - now.getTime();
    if (diffMs <= 0) return { label: 'EXPIRED', expired: true };
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `${hrs}h ${mins}m remaining`, expired: false };
};

export const WorkDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [task, setTask] = useState<any>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const [reworkLog, setReworkLog] = useState<any>(null);
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const chatRef = useRef<HTMLDivElement>(null);

    // Proof Upload
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        if (!id || !profile?.id) return;
        fetchTaskDetails();
        fetchMessages();

        const channel = supabase.channel(`chat_${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'report_messages',
                filter: `report_id=eq.${id}`
            }, (payload) => {
                if (payload.new.channel !== 'worker') return;
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        // Realtime: listen for status changes (admin approves/rejects)
        const issueChannel = supabase.channel(`issue_status_${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'issues',
                filter: `id=eq.${id}`
            }, () => fetchTaskDetails())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(issueChannel);
        };
    }, [id, profile?.id]);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchTaskDetails = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('issues')
            .select(`*, reporter:profiles!user_id(full_name, avatar_url)`)
            .eq('id', id as string)
            .single();

        if (data) setTask(data);

        // Fetch active assignment (for deadline)
        const { data: assignData } = await (supabase.from('report_assignments') as any)
            .select('*, assigned_by_profile:assigned_by(full_name)')
            .eq('report_id', id as string)
            .eq('is_active', true)
            .maybeSingle();
        setAssignment(assignData);

        // Fetch rework log (most recent rejection)
        if ((data as any)?.status === 'reopened') {
            const { data: logData } = await (supabase.from('report_verification_logs') as any)
                .select('*, admin:admin_id(full_name)')
                .eq('report_id', id as string)
                .eq('action', 'rejected')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            setReworkLog(logData);
        }

        // Fetch Proofs (Gallery)
        const { data: proofData } = await (supabase.from('work_proofs') as any)
            .select('*')
            .eq('report_id', id)
            .order('submitted_at', { ascending: true });

        if (proofData) setProofs(proofData);

        setLoading(false);
    };

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('report_messages')
            .select('*, sender:profiles(full_name, role)')
            .eq('report_id', id as string)
            .eq('channel', 'worker')
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !id || !profile) return;

        const tempMsg = newMessage;
        setNewMessage('');

        await supabase.from('report_messages').insert({
            report_id: id,
            sender_id: profile.id,
            sender_role: 'worker',
            channel: 'worker',
            message_text: tempMsg
        } as any);
    };

    if (loading) {
        return (
            <WorkerLayout title="Mission Control">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    if (!task) {
        return (
            <WorkerLayout title="Mission Aborted">
                <div className="max-w-4xl mx-auto py-20 text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter">Intel Not Found</h2>
                    <p className="text-brand-secondary/50 uppercase tracking-widest font-bold text-sm mt-2">The requested mission packet is classified or does not exist.</p>
                    <button onClick={() => navigate('/worker/dashboard')} className="mt-8 px-6 py-3 bg-brand-secondary text-brand-primary font-black uppercase tracking-widest text-xs rounded-full">Return to Base</button>
                </div>
            </WorkerLayout>
        );
    }

    const deadlineInfo = getDeadlineInfo(assignment?.deadline || null);
    const isRework = task.status === 'reopened';
    const isCompleted = task.status === 'closed' || task.status === 'awaiting_verification';

    return (
        <WorkerLayout title={`Op: ${task.title?.substring(0, 15) || 'Confidential'}...`}>
            <div className="max-w-6xl mx-auto py-8">

                {/* ⚠ REWORK REQUIRED BANNER */}
                <AnimatePresence>
                    {isRework && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-6 bg-red-500 rounded-[32px] shadow-xl shadow-red-500/20 flex flex-col md:flex-row items-start md:items-center gap-4"
                        >
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
                                <AlertOctagon size={28} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                    <RotateCcw size={18} /> ⚠ Rework Required
                                </h3>
                                <p className="text-white/80 font-medium text-sm mt-1 leading-relaxed">
                                    {reworkLog?.comment || 'Admin has requested rework on this task. Please review and resubmit your proof.'}
                                </p>
                                {reworkLog?.admin?.full_name && (
                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mt-2">
                                        — {reworkLog.admin.full_name} • {new Date(reworkLog.created_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-6 py-3 bg-white text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shrink-0"
                            >
                                Resubmit Proof
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Approved Banner */}
                {task.status === 'closed' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-green-500 rounded-[32px] shadow-xl shadow-green-500/20 flex items-center gap-4"
                    >
                        <CheckCircle className="text-white shrink-0" size={32} />
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Work Approved!</h3>
                            <p className="text-white/70 text-sm font-medium">Admin has verified and approved your work. Great job!</p>
                        </div>
                    </motion.div>
                )}

                {/* Header Back & Status */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-secondary/60 hover:text-brand-secondary font-black uppercase text-[10px] tracking-widest transition-colors">
                        <ArrowLeft size={16} /> Return to Queue
                    </button>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${task.status === 'reopened' ? 'bg-red-500 shadow-red-500/20' :
                            task.status === 'in_progress' ? 'bg-amber-500 shadow-amber-500/20' :
                                task.status === 'closed' ? 'bg-green-500 shadow-green-500/20' :
                                    task.status === 'awaiting_verification' ? 'bg-blue-500 shadow-blue-500/20' :
                                        'bg-brand-secondary shadow-brand-secondary/20'
                            }`}>
                            STATUS: {task.status.replace(/_/g, ' ')}
                        </span>
                        {task.priority && (
                            <span className="px-4 py-2 bg-brand-secondary/5 text-brand-secondary border border-brand-secondary/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                                PRIORITY: {task.priority}
                            </span>
                        )}
                        {/* Deadline Badge */}
                        {deadlineInfo && (
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${deadlineInfo.expired
                                ? 'bg-red-100 text-red-600 border border-red-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                <Clock size={12} />
                                {deadlineInfo.expired ? 'DEADLINE EXPIRED' : deadlineInfo.label}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Intel & Map */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Dossier Card */}
                        <div className="bg-white rounded-[40px] p-8 md:p-10 border border-brand-secondary/5 shadow-soft">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary shrink-0 border border-brand-secondary/10">
                                    <Target size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-brand-secondary uppercase tracking-tighter mb-2">{task.title || 'Classified Objective'}</h1>
                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                                        <span className="flex items-center gap-2"><MapPin size={14} /> {task.address || 'Location Unknown'}</span>
                                        <span className="flex items-center gap-2"><Clock size={14} /> Reported: {new Date(task.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-brand-secondary/5 rounded-3xl border border-brand-secondary/10 mb-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 mb-3">Description</h3>
                                <p className="text-brand-secondary/80 font-medium leading-relaxed">{task.description || 'No details provided.'}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 border border-brand-secondary/10 rounded-2xl text-center">
                                    <div className="text-2xl font-black text-brand-secondary mb-1">{task.risk_score ? Math.round(task.risk_score * 100) : task.risk_score_int || 'N/A'}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40">Risk Score</div>
                                </div>
                                <div className="p-4 border border-brand-secondary/10 rounded-2xl text-center">
                                    <div className="text-sm font-black text-brand-secondary mb-1 flex items-center justify-center h-8">{task.category || 'General'}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40">Category</div>
                                </div>
                                <div className="p-4 border border-brand-secondary/10 rounded-2xl text-center">
                                    <div className="text-sm font-black text-brand-secondary mb-1 flex items-center justify-center h-8">{task.priority || 'Medium'}</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40">Priority</div>
                                </div>
                                <div className={`p-4 border rounded-2xl text-center ${deadlineInfo?.expired ? 'border-red-200 bg-red-50' : 'border-brand-secondary/10'}`}>
                                    <div className={`text-xs font-black mb-1 flex items-center justify-center h-8 ${deadlineInfo?.expired ? 'text-red-600' : 'text-brand-secondary'}`}>
                                        {deadlineInfo ? deadlineInfo.label : 'Not Set'}
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40">Deadline</div>
                                </div>
                            </div>
                        </div>

                        {/* Evidence & Map Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[40px] p-6 border border-brand-secondary/5 shadow-soft h-[300px] flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 mb-4 flex items-center gap-2">
                                    <ImageIcon size={14} /> Field Evidence
                                </h3>
                                <div className="flex-1 bg-brand-secondary/5 rounded-3xl overflow-hidden border border-brand-secondary/10 relative group">
                                    {task.image_url ? (
                                        <img src={task.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-secondary/30">
                                            <Camera size={32} className="mb-2" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">No Visual Intel</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] p-6 border border-brand-secondary/5 shadow-soft h-[300px] flex flex-col">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 mb-4 flex items-center gap-2">
                                    <MapPin size={14} /> Geo-Target
                                </h3>
                                <div className="flex-1 bg-brand-secondary/5 rounded-3xl overflow-hidden border border-brand-secondary/10 relative">
                                    <img
                                        src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+cc0000(${task.longitude},${task.latitude})/${task.longitude},${task.latitude},15,0/400x300?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
                                        alt="Map"
                                        className="w-full h-full object-cover grayscale contrast-125"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="animate-ping w-8 h-8 rounded-full border-2 border-red-500 opacity-50" />
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute bottom-4 left-4 right-4 py-3 bg-brand-secondary text-brand-primary text-center rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-secondary/90 backdrop-blur-md"
                                    >
                                        Open Navigation
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Direct Comm Channel (Chat) - MOVED TO LEFT GRID AND WIDENED */}
                        <div className="bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft flex flex-col overflow-hidden min-h-[500px]">
                            <div className="p-8 border-b border-brand-secondary/5 bg-brand-secondary/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-primary shadow-lg shadow-brand-secondary/20">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-brand-secondary text-xl uppercase tracking-tight italic">HQ Direct Link</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40 italic">Secure Operational communication channel</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Realtime Active
                                </div>
                            </div>

                            <div ref={chatRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-brand-primary/[0.02]">
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-brand-secondary/20 text-center py-20">
                                        <div className="w-20 h-20 bg-brand-secondary/5 rounded-[40px] flex items-center justify-center mb-4">
                                            <MessageSquare size={40} className="opacity-20 translate-y-1" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Encrypted Connection Established.<br />Awaiting HQ Directive.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.sender_role === 'worker';
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={i}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`shadow-sm px-6 py-4 rounded-[32px] ${isMe
                                                        ? 'bg-brand-secondary text-brand-primary rounded-tr-none font-medium'
                                                        : 'bg-white text-brand-secondary rounded-tl-none border border-brand-secondary/10 font-medium'
                                                        }`}>
                                                        <p className="text-sm leading-relaxed">{msg.message_text || msg.message}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2 px-3">
                                                        {!isMe && <span className="text-[8px] font-black uppercase tracking-widest text-brand-secondary/40 italic">HQ COMMAND</span>}
                                                        <p className={`text-[8px] font-black uppercase tracking-widest ${isMe ? 'text-brand-secondary/40' : 'text-brand-secondary/20'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-6 bg-white border-t border-brand-secondary/5">
                                <form onSubmit={sendMessage} className="flex items-center gap-4">
                                    <div className="flex-1 relative overflow-hidden rounded-[24px]">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Transmit field intel to HQ..."
                                            className="w-full bg-brand-secondary/5 border border-brand-secondary/10 px-8 py-5 text-sm font-bold text-brand-secondary focus:outline-none focus:border-brand-secondary/30 placeholder:text-brand-secondary/30 transition-all rounded-[24px]"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20">
                                            <div className="w-1 h-3 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                            <div className="w-1 h-5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <div className="w-1 h-3 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="w-16 h-16 bg-brand-secondary text-brand-primary rounded-[24px] flex items-center justify-center shrink-0 disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-secondary/20 group"
                                    >
                                        <Send size={24} className="ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Action Panel & Gallery */}
                    <div className="space-y-8 flex flex-col">

                        {/* Action Panel */}
                        <div className="bg-brand-secondary rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 italic translate-y-1">
                                {isRework ? 'Rework Alert' : isCompleted ? 'Task Logged' : 'Submit Ops'}
                            </h2>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8 italic">
                                {isRework ? 'HQ requested changes. Resubmit proof.' :
                                    isCompleted ? 'Transmission logged. Awaiting HQ verification.' :
                                        'Upload tactical evidence for HQ verification.'}
                            </p>

                            {isCompleted && !isRework ? (
                                <div className="w-full py-5 bg-white/10 text-white/60 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 border border-white/5 backdrop-blur-sm">
                                    <CheckCircle size={16} /> Verifying Deep Dive...
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className={`w-full py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:translate-y-[-2px] active:scale-95 transition-all shadow-xl ${isRework
                                        ? 'bg-red-500 text-white shadow-red-500/20 hover:shadow-red-500/40'
                                        : 'bg-brand-primary text-brand-secondary shadow-brand-primary/20 hover:shadow-brand-primary/40'
                                        }`}
                                >
                                    <Camera size={18} /> {isRework ? 'Submit Revised Ops' : 'Mark Ops Complete'}
                                </button>
                            )}
                        </div>

                        {/* Intelligence Gallery */}
                        <div className="bg-white rounded-[40px] p-8 border border-brand-secondary/5 shadow-soft">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40 mb-8 pb-4 border-b border-brand-secondary/5 flex items-center gap-2">
                                <Target size={14} className="opacity-40" /> Intelligence Archive
                            </h3>

                            <div className="space-y-8">
                                {/* Original Photo */}
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 italic flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-brand-secondary/20" /> Initial Tactical View
                                    </p>
                                    <div className="aspect-square rounded-[32px] overflow-hidden border border-brand-secondary/10 group cursor-zoom-in relative">
                                        <img
                                            src={task.image_url}
                                            alt="Initial Evidence"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-brand-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>

                                {/* Proof Photos */}
                                {proofs.map((proof, idx) => (
                                    <div key={proof.id} className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/40 italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" /> Resolution Proof #{idx + 1}
                                            </p>
                                            <span className="text-[8px] font-black text-brand-secondary/20 uppercase tracking-widest">
                                                {new Date(proof.submitted_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="aspect-square rounded-[32px] overflow-hidden border border-brand-secondary/10 group cursor-zoom-in relative">
                                            <img
                                                src={proof.after_image_url}
                                                alt={`Proof ${idx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {proof.verified && (
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/20">
                                                    HQ Verified
                                                </div>
                                            )}
                                        </div>
                                        {proof.worker_notes && (
                                            <div className="bg-brand-secondary/[0.02] p-4 rounded-2xl border border-brand-secondary/5">
                                                <p className="text-[10px] font-bold text-brand-secondary/60 italic leading-relaxed">
                                                    "{proof.worker_notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {proofs.length === 0 && (
                                    <div className="aspect-square rounded-[32px] border-2 border-dashed border-brand-secondary/5 flex flex-col items-center justify-center text-center p-8 bg-brand-secondary/[0.01]">
                                        <Camera size={32} className="text-brand-secondary/5 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/20 italic">No Field Proof variants recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-brand-secondary p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-all duration-700" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 italic">Operational Protocol</h3>
                            <p className="text-xs font-bold leading-relaxed opacity-70 uppercase tracking-widest italic !leading-loose">
                                Security classification: Level 4.<br />
                                All transmissions are encrypted and logged at Ops HQ.<br />
                                Standard Field Directive 82 applies.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showUploadModal && (
                    <ProofUploadModal
                        reportId={id!}
                        onSuccess={() => {
                            setShowUploadModal(false);
                            fetchTaskDetails();
                        }}
                        onClose={() => setShowUploadModal(false)}
                    />
                )}
            </AnimatePresence>
        </WorkerLayout>
    );
};
