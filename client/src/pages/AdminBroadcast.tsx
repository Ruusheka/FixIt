import React from 'react';
import { LayoutDashboard, ClipboardCheck, Shield, Users, Radio, BarChart3 } from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { BroadcastCenter } from '../components/admin/BroadcastCenter';

const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Reports Hub', path: '/admin/reports', icon: ClipboardCheck },
    { label: 'Operations', path: '/admin/operations', icon: Shield },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Broadcast', path: '/admin/broadcast', icon: Radio },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminBroadcast: React.FC = () => {
    return (
        <MinimalLayout navItems={navItems} title="City Broadcast System">
            <div className="max-w-7xl mx-auto py-8 lg:px-12 space-y-12">
                <BroadcastCenter />
            </div>
        </MinimalLayout>
    );
};
