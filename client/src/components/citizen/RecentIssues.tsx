import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { MapPin, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Issue {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    risk_score: number;
    image_url: string;
    address: string;
    created_at: string;
}

export const RecentIssues: React.FC = () => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            if (data) setIssues(data);
            setLoading(false);
        };
        fetchRecent();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-3xl bg-brand-secondary/5 animate-pulse" />
            ))}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {issues.map((issue, i) => (
                <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -10 }}
                    onClick={() => navigate(`/citizen/reports/${issue.id}`)}
                    className="minimal-card p-0 rounded-3xl overflow-hidden cursor-pointer border-brand-secondary/5 bg-white shadow-xl shadow-brand-secondary/5 hover:shadow-2xl transition-all group"
                >
                    <div className="h-48 relative overflow-hidden">
                        {issue.image_url ? (
                            <img src={issue.image_url} alt={issue.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                            <div className="w-full h-full bg-brand-secondary/5 flex items-center justify-center">
                                <ShieldAlert size={32} className="opacity-10 text-brand-secondary" />
                            </div>
                        )}
                        <div className="absolute top-4 left-4">
                            <div className="px-3 py-1 bg-brand-primary/80 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-brand-secondary border border-brand-secondary/5">
                                {issue.category}
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between">
                                <div className="px-3 py-1 bg-brand-secondary text-brand-primary rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    {Math.round((issue.risk_score || 0) * 100)}% RISK
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tighter truncate mb-2">
                            {issue.title}
                        </h3>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest truncate">
                                <MapPin size={10} /> {issue.address?.split(',')[0]}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-brand-secondary/40 uppercase tracking-widest">
                                <Clock size={10} /> {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-secondary/5">
                            <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex items-center gap-1">
                                Secure Access <ChevronRight size={12} />
                            </span>
                            <div className={`w-2 h-2 rounded-full ${issue.status === 'RESOLVED' ? 'bg-green-500 shadow-green-500/50' : 'bg-yellow-500 shadow-yellow-500/50'} shadow-lg`} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
