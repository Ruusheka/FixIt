import React from 'react';
import { LayoutDashboard, ClipboardCheck, Shield, Radio, BarChart3, Target } from 'lucide-react';
import { MinimalLayout } from '../components/MinimalLayout';
import { adminNavItems } from '../constants/adminNav';
import { BroadcastCenter } from '../components/admin/BroadcastCenter';

const navItems = adminNavItems;

export const AdminBroadcast: React.FC = () => {
    return (
        <MinimalLayout navItems={navItems} title="City Broadcast System">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 space-y-12">
                <BroadcastCenter />
            </div>
        </MinimalLayout>
    );
};
