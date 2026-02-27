import React, { useState } from 'react';
import { WorkerLayout } from '../../components/worker/WorkerLayout';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { useWorkerData } from '../../hooks/useWorkerData';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const WorkerCalendar: React.FC = () => {
    // Hooks must be at the top
    const { assignments, loading } = useWorkerData();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }));

    if (loading) {
        return (
            <WorkerLayout title="Chronological Ops">
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-brand-secondary/10 border-t-brand-secondary rounded-full animate-spin" />
                </div>
            </WorkerLayout>
        );
    }

    // Group active assignments by date
    const groupedTasks = assignments.reduce((acc, task) => {
        const dateStr = new Date(task.created_at).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(task);
        return acc;
    }, {} as Record<string, any[]>);

    // Helper: Days in month
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const days = Array.from({ length: getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()) }, (_, i) => i + 1);

    return (
        <WorkerLayout title="Operational Schedule">
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-secondary/5">
                    <div>
                        <h1 className="text-4xl font-black text-brand-secondary tracking-tighter uppercase mb-2 italic">Ops Calendar</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/40">Real-time status of all field directives.</p>
                    </div>
                </div>

                {/* 1. Visual Calendar Grid (Glassmorphism) */}
                <div className="mb-12 bg-brand-secondary p-8 rounded-[48px] shadow-2xl relative overflow-hidden text-white border border-white/5">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all font-black"
                                >
                                    &larr;
                                </button>
                                <button
                                    onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all font-black"
                                >
                                    &rarr;
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-white/30 py-4 italic">{day}</div>
                            ))}

                            {/* Offset for first day */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {days.map(day => {
                                const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                                const dateStr = currentDate.toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                                const hasTasks = groupedTasks[dateStr];
                                const isToday = new Date().toDateString() === currentDate.toDateString();

                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`relative aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center group cursor-pointer ${selectedDate === dateStr
                                            ? 'bg-brand-primary text-brand-secondary border-brand-primary shadow-lg shadow-brand-primary/20 scale-105 z-10'
                                            : hasTasks
                                                ? 'bg-brand-secondary/80 text-white border-brand-secondary shadow-lg'
                                                : isToday
                                                    ? 'bg-white/10 border-white/30 text-white'
                                                    : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-sm font-black italic">{day}</span>
                                        {hasTasks && (
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-primary shadow-sm" />
                                        )}
                                        {hasTasks && (
                                            <div className="hidden group-hover:block absolute top-[110%] left-1/2 -translate-x-1/2 w-32 bg-brand-secondary p-2 rounded-lg text-[8px] font-black uppercase tracking-widest text-white/80 z-50 text-center shadow-2xl border border-white/10">
                                                {hasTasks.length} Directive{hasTasks.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 2. Detailed List / Selection View */}
                <div className="space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary/30 mb-8 flex items-center gap-4 px-2">
                        {selectedDate ? `Operations: ${selectedDate}` : 'Select a date to view intelligence'}
                        <div className="h-px flex-1 bg-brand-secondary/5" />
                    </h3>

                    {!selectedDate || !groupedTasks[selectedDate] ? (
                        <div className="text-center py-20 bg-white rounded-[40px] border border-brand-secondary/5 shadow-soft">
                            <CalendarIcon className="w-16 h-16 text-brand-secondary/10 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-brand-secondary tracking-tighter uppercase mb-2 italic">Sector Clear</h3>
                            <p className="text-xs font-bold text-brand-secondary/40 uppercase tracking-widest">No field operations logged for this sequence.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupedTasks[selectedDate].map((task, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={task.id}
                                >
                                    <Link
                                        to={`/worker/works/${task.issues?.id || task.id}`}
                                        className="bg-white rounded-[32px] p-6 border border-brand-secondary/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-brand-secondary/5 text-brand-secondary flex items-center justify-center shrink-0 group-hover:bg-brand-primary group-hover:text-brand-secondary transition-all">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-black text-brand-secondary uppercase tracking-tighter truncate">
                                                {task.issues?.title || 'Classified Protocol'}
                                            </h4>
                                            <p className="text-[9px] font-bold text-brand-secondary/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                <MapPin size={9} /> {task.issues?.address || 'Restricted Location'}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border ${task.is_active ? 'bg-blue-500/5 text-blue-600 border-blue-500/10' : 'bg-brand-secondary/5 text-brand-secondary/40 border-brand-secondary/10'}`}>
                                            {task.is_active ? 'ACTIVE' : 'LOGGED'}
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </WorkerLayout>
    );
};
