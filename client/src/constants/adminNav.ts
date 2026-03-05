import {
    LayoutDashboard, ClipboardCheck, Shield, Radio,
    BarChart3, Target, Zap
} from 'lucide-react';

export const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Micro-Tasks', path: '/admin/micro-tasks', icon: Target },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Engage Command', path: '/admin/engagement', icon: Zap },
];
