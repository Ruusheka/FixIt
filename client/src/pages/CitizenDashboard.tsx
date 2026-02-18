import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, LogOut } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

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

/* ── Demo data (used when Supabase tables are not yet populated) ── */
const demoIssues: Issue[] = [
    { id: '1', category: 'pothole', severity: 8, status: 'reported', address: 'MG Road, Sector 12', latitude: 28.6139, longitude: 77.2090, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', category: 'streetlight', severity: 5, status: 'in_progress', address: 'Ring Road Junction', latitude: 28.6200, longitude: 77.2150, created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', category: 'garbage', severity: 6, status: 'assigned', address: 'Park Avenue, Block C', latitude: 28.6100, longitude: 77.2000, created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: '4', category: 'pothole', severity: 9, status: 'reported', address: 'NH-48, Near Toll Plaza', latitude: 28.6050, longitude: 77.1950, created_at: new Date(Date.now() - 28800000).toISOString() },
    { id: '5', category: 'water leak', severity: 7, status: 'in_progress', address: 'Gandhi Nagar, Lane 3', latitude: 28.6180, longitude: 77.2200, created_at: new Date(Date.now() - 36000000).toISOString() },
    { id: '6', category: 'road crack', severity: 4, status: 'resolved', address: 'Connaught Place', latitude: 28.6300, longitude: 77.2190, created_at: new Date(Date.now() - 43200000).toISOString() },
    { id: '7', category: 'garbage', severity: 3, status: 'verified', address: 'Sarojini Market', latitude: 28.5700, longitude: 77.2100, created_at: new Date(Date.now() - 50400000).toISOString() },
    { id: '8', category: 'streetlight', severity: 6, status: 'assigned', address: 'Dwarka Sector 21', latitude: 28.5500, longitude: 77.0600, created_at: new Date(Date.now() - 57600000).toISOString() },
];

const demoTickets: Ticket[] = [
    { id: '1', ticket_id: 'FX-1042', category: 'pothole', status: 'in_progress', created_at: new Date(Date.now() - 86400000).toISOString(), assigned_worker: 'Rajesh K.', sla_deadline: new Date(Date.now() + 172800000).toISOString() },
    { id: '2', ticket_id: 'FX-1038', category: 'garbage', status: 'assigned', created_at: new Date(Date.now() - 172800000).toISOString(), assigned_worker: 'Priya M.' },
    { id: '3', ticket_id: 'FX-1025', category: 'streetlight', status: 'fixed', created_at: new Date(Date.now() - 432000000).toISOString(), assigned_worker: 'Amit S.' },
    { id: '4', ticket_id: 'FX-1019', category: 'water leak', status: 'verified', created_at: new Date(Date.now() - 604800000).toISOString() },
];

/* ── Main Dashboard ── */
export const CitizenDashboard: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const [nearbyIssues, setNearbyIssues] = useState<Issue[]>(demoIssues);
    const [myTickets, setMyTickets] = useState<Ticket[]>(demoTickets);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Get user location
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => setUserLocation({ lat: 28.6139, lng: 77.2090 }) // Default Delhi
        );
    }, []);

    // Fetch nearby issues from Supabase
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

        // Real-time subscription
        const channel = supabase
            .channel('issues-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
                fetchIssues();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Fetch user's tickets
    useEffect(() => {
        if (!user) return;
        const fetchTickets = async () => {
            const { data } = await supabase
                .from('issues')
                .select('*')
                .eq('reporter_id', user.id)
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
        <div className="min-h-screen bg-civic-dark">
            {/* Floating sign-out */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
                {profile && (
                    <span className="glass-card px-3 py-1.5 text-xs text-civic-muted">
                        {profile.full_name || profile.email}
                    </span>
                )}
                <button
                    onClick={() => signOut()}
                    className="glass-card p-2 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>

            {/* Section 1: Hero 3D Landing */}
            <HeroScene />

            {/* Section 2: Quick Navigation */}
            <NavigationGrid />

            {/* Section 3: Nearby Issues */}
            <section id="nearby" className="px-6 md:px-12 lg:px-20 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Nearby Issues</h2>
                        <p className="text-civic-muted text-sm">Latest reports around your area</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 py-2 glass-card text-sm text-civic-blue hover:bg-civic-blue/10 transition-colors"
                    >
                        <MapPin className="w-4 h-4" />
                        View Map
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {nearbyIssues.slice(0, 8).map((issue, i) => (
                        <motion.div
                            key={issue.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
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

            {/* Section 4: My Latest Reports / Tickets */}
            <section id="my-reports" className="px-6 md:px-12 lg:px-20 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">My Latest Reports</h2>
                    <p className="text-civic-muted text-sm">Track your submitted tickets & their progress</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTickets.map((ticket, i) => (
                        <motion.div
                            key={ticket.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <TicketTracker ticket={ticket} />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Section 5: Process Timeline */}
            <ProcessTimeline />

            {/* Section 6: Announcements */}
            <AnnouncementPanel />

            {/* Section 7: Rewards */}
            <RewardsWidget />

            {/* Footer */}
            <footer className="px-6 md:px-12 lg:px-20 py-8 border-t border-civic-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gradient-civic">FixIt</span>
                        <span className="text-xs text-civic-muted">AI Civic Intelligence Platform</span>
                    </div>
                    <p className="text-xs text-civic-muted">
                        © {new Date().getFullYear()} FixIt — Building smarter cities together.
                    </p>
                </div>
            </footer>
        </div>
    );
};
