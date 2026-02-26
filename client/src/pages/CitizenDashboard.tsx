import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, LayoutDashboard, FileText, Gift, Bell } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MinimalLayout } from '../components/MinimalLayout';

// Citizen components
import { HeroScene } from '../components/citizen/HeroScene';
import { NavigationGrid } from '../components/citizen/NavigationGrid';
import { IssueCard } from '../components/citizen/IssueCard';
import { TicketTracker } from '../components/citizen/TicketTracker';
import { ProcessTimeline } from '../components/citizen/ProcessTimeline';
import { AnnouncementPanel } from '../components/citizen/AnnouncementPanel';
import { RewardsWidget } from '../components/citizen/RewardsWidget';

/* ── Types ── */
interface Issue {
    id: string;
    image_url?: string;
    category: string;
    severity: number;
    status: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    created_at: string;
}

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

/* ── Demo data ── */
const demoIssues: Issue[] = [
    { id: '1', category: 'pothole', severity: 8, status: 'reported', address: 'MG Road, Sector 12', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', category: 'streetlight', severity: 5, status: 'in_progress', address: 'Ring Road Junction', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', category: 'garbage', severity: 6, status: 'assigned', address: 'Park Avenue, Block C', created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: '4', category: 'pothole', severity: 9, status: 'reported', address: 'NH-48, Near Toll Plaza', created_at: new Date(Date.now() - 28800000).toISOString() },
];

const demoTickets: Ticket[] = [
    { id: '1', ticket_id: 'FX-1042', category: 'pothole', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString(), assigned_worker: 'Rajesh K.', sla_deadline: new Date(Date.now() + 172800000).toISOString() },
    { id: '2', ticket_id: 'FX-1038', category: 'garbage', status: 'assigned', created_at: new Date(Date.now() - 172800000).toISOString(), assigned_worker: 'Priya M.' },
];

const navItems = [
    { label: 'Dashboard', path: '/citizen', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/reports', icon: FileText },
    { label: 'Rewards', path: '/rewards', icon: Gift },
    { label: 'Alerts', path: '/citizen#announcements', icon: Bell },
];

export const CitizenDashboard: React.FC = () => {
    const { user } = useAuth();
    const [nearbyIssues, setNearbyIssues] = useState<Issue[]>(demoIssues);
    const [myTickets, setMyTickets] = useState<Ticket[]>(demoTickets);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setUserLocation({ lat: 28.6139, lng: 77.2090 })
        );
    }, []);

    useEffect(() => {
        const fetchIssues = async () => {
            const { data } = await supabase
                .from('issues')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8);
            if (data && data.length > 0) setNearbyIssues(data);
        };
        fetchIssues();

        const channel = supabase
            .channel('issues-realtime-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
                fetchIssues();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

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
        <MinimalLayout
            navItems={navItems}
            title="Citizen Dashboard"
        >
            <div className="space-y-24 py-10">
                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden min-h-[650px] shadow-2xl shadow-brand-secondary/5">
                    <HeroScene />
                </div>

                {/* Quick Navigation (Service Hub) */}
                <div className="relative z-20 px-4 md:px-12 mt-12">
                    <NavigationGrid />
                </div>

                {/* Nearby Issues Grid */}
                <section id="nearby" className="space-y-12">
                    <div className="flex flex-col md:flex-row items-end justify-between border-b border-brand-secondary/5 pb-8 gap-6">
                        <div>
                            <h3 className="text-4xl font-black tracking-tighter text-brand-secondary uppercase">Nearby Issues</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">Real-time reports from the community grid</p>
                        </div>
                        <button className="flex items-center gap-3 px-8 py-3 btn-secondary text-[10px] font-black uppercase tracking-widest">
                            <MapPin size={16} />
                            Spatial View
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {nearbyIssues.map((issue, i) => (
                            <motion.div
                                key={issue.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="minimal-card overflow-hidden group border-brand-secondary/5"
                            >
                                <IssueCard
                                    issue={issue}
                                    userLat={userLocation?.lat}
                                    userLng={userLocation?.lng}
                                />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Personal Reports */}
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

                {/* Informational Sections Stacked for better alignment as requested */}
                <div className="space-y-24">
                    <ProcessTimeline />
                    <RewardsWidget />
                </div>

                {/* Announcements & Alerts Section */}
                <section id="announcements" className="pt-24 border-t border-brand-secondary/5">
                    <div className="mb-12">
                        <h3 className="text-4xl font-black tracking-tighter text-brand-secondary uppercase">Announcements & Alerts</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30 mt-2">Stay updated with civic notifications</p>
                    </div>
                    <AnnouncementPanel />
                </section>

                <footer className="pt-24 border-t border-brand-secondary/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-20">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl font-black tracking-tighter text-brand-secondary uppercase">FixIt</span>
                        <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary">Civic Intelligence Network</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} FixIt Systems. All Rights Reserved.</p>
                </footer>
            </div>
        </MinimalLayout>
    );
};
