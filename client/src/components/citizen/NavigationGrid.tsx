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
    description: string;
}

const navItems: NavItem[] = [
    {
        label: 'Report Issue',
        icon: <Camera className="w-5 h-5" />,
        path: '/citizen/report',
        description: 'Snap & submit civic issues',
    },
    {
        label: 'My Reports',
        icon: <FileText className="w-5 h-5" />,
        path: '#my-reports',
        description: 'Track your submitted tickets',
    },
    {
        label: 'Nearby Issues',
        icon: <MapPin className="w-5 h-5" />,
        path: '#nearby',
        description: 'See what\'s happening around you',
    },
    {
        label: 'Community Feed',
        icon: <MessageSquare className="w-5 h-5" />,
        path: '/reports',
        description: 'Join civic conversations',
    },
    {
        label: 'Rewards',
        icon: <Trophy className="w-5 h-5" />,
        path: '#rewards',
        description: 'Earn civic tokens & badges',
    },
    {
        label: 'Announcements',
        icon: <Megaphone className="w-5 h-5" />,
        path: '#announcements',
        description: 'City updates & notices',
    },
    {
        label: 'Micro-Tasks',
        icon: <ListChecks className="w-5 h-5" />,
        path: '#tasks',
        description: 'Quick civic actions near you',
    },
    {
        label: 'Profile',
        icon: <UserCircle className="w-5 h-5" />,
        path: '#profile',
        description: 'View your civic identity',
    },
];

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.04 },
    },
};

const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
        <section className="py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10 text-center md:text-left"
            >
                <h2 className="text-3xl font-bold tracking-tight mb-2">Service Hub</h2>
                <p className="text-brand-secondary/40 font-medium">Streamlined access to all civic infrastructure tools.</p>
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
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleClick(nav.path)}
                        className="minimal-card p-6 text-left group hover:bg-brand-secondary transition-all duration-300"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl bg-brand-secondary/5 text-brand-secondary group-hover:bg-brand-primary group-hover:text-brand-secondary transition-all">
                                {nav.icon}
                            </div>
                        </div>
                        <h3 className="font-bold text-brand-secondary group-hover:text-brand-primary text-sm mb-1 tracking-tight transition-colors">
                            {nav.label}
                        </h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-brand-secondary/30 group-hover:text-brand-primary/40 transition-colors">
                            {nav.description}
                        </p>
                    </motion.button>
                ))}
            </motion.div>
        </section>
    );
};
