import React from 'react';
import { MinimalLayout } from '../MinimalLayout';
import { LayoutDashboard, Calendar, CheckSquare, TrendingUp, MessageSquare, User, ListTodo } from 'lucide-react';

const workerNavItems = [
    { label: 'Dashboard', path: '/worker/dashboard', icon: LayoutDashboard },
    { label: 'Today’s Work', path: '/worker/today', icon: ListTodo },
    { label: 'My Calendar', path: '/worker/calendar', icon: Calendar },
    { label: 'Messages', path: '/worker/messages', icon: MessageSquare },
    { label: 'Profile', path: '/worker/profile', icon: User },
];

export const WorkerLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title = 'Worker Ops Dashboard' }) => {
    return (
        <MinimalLayout navItems={workerNavItems} title={title}>
            {children}
        </MinimalLayout>
    );
};
