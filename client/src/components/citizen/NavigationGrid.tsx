import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Camera, FileText, MapPin, MessageSquare,
    Trophy, Megaphone, ListChecks, UserCircle
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    gradient: string;
    description: string;
}

const navItems: NavItem[] = [
    {
        label: 'Report Issue',
        icon: <Camera className="w-6 h-6" />,
        path: '/citizen/report',
        gradient: 'from-orange-500/20 to-red-500/20',
        description: 'Snap & submit civic issues',
    },
    {
        label: 'My Reports',
        icon: <FileText className="w-6 h-6" />,
        path: '#my-reports',
        gradient: 'from-blue-500/20 to-cyan-500/20',
        description: 'Track your submitted tickets',
    },
    {
        label: 'Nearby Issues',
        icon: <MapPin className="w-6 h-6" />,
        path: '#nearby',
        gradient: 'from-green-500/20 to-emerald-500/20',
        description: 'See what\'s happening around you',
    },
    {
        label: 'Community Feed',
        icon: <MessageSquare className="w-6 h-6" />,
        path: '#community',
        gradient: 'from-purple-500/20 to-pink-500/20',
        description: 'Join civic conversations',
    },
    {
        label: 'Rewards',
        icon: <Trophy className="w-6 h-6" />,
        path: '#rewards',
        gradient: 'from-yellow-500/20 to-orange-500/20',
        description: 'Earn civic tokens & badges',
    },
    {
        label: 'Announcements',
        icon: <Megaphone className="w-6 h-6" />,
        path: '#announcements',
        gradient: 'from-cyan-500/20 to-blue-500/20',
        description: 'City updates & notices',
    },
    {
        label: 'Micro-Tasks',
        icon: <ListChecks className="w-6 h-6" />,
        path: '#tasks',
        gradient: 'from-emerald-500/20 to-teal-500/20',
        description: 'Quick civic actions near you',
    },
    {
        label: 'Profile',
        icon: <UserCircle className="w-6 h-6" />,
        path: '#profile',
        gradient: 'from-slate-500/20 to-zinc-500/20',
        description: 'View your civic identity',
    },
];

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.06 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const NavigationGrid: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = (path: string) => {
        if (path.startsWith('#')) {
            const el = document.getElementById(path.slice(1));
            el?.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate(path);
        }
    };

    return (
        <section className="px-6 md:px-12 lg:px-20 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Quick Actions</h2>
                <p className="text-civic-muted text-sm">Everything you need, one click away</p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {navItems.map((nav) => (
                    <motion.button
                        key={nav.label}
                        variants={item}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleClick(nav.path)}
                        className={`glass-card-hover p-5 text-left group cursor-pointer bg-gradient-to-br ${nav.gradient}`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-white/10 text-white group-hover:bg-white/15 transition-colors">
                                {nav.icon}
                            </div>
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">{nav.label}</h3>
                        <p className="text-xs text-civic-muted leading-relaxed">{nav.description}</p>
                    </motion.button>
                ))}
            </motion.div>
        </section>
    );
};
