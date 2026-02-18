import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

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

interface IssueCardProps {
    issue: Issue;
    userLat?: number;
    userLng?: number;
}

const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
        reported: { class: 'badge-reported', label: 'Reported' },
        in_progress: { class: 'badge-in-progress', label: 'In Progress' },
        assigned: { class: 'badge-assigned', label: 'Assigned' },
        resolved: { class: 'badge-fixed', label: 'Fixed' },
        fixed: { class: 'badge-fixed', label: 'Fixed' },
        verified: { class: 'badge-verified', label: 'Verified' },
        rejected: { class: 'badge-rejected', label: 'Rejected' },
    };
    return map[status] || { class: 'badge-reported', label: status };
};

const getSeverityBadge = (severity: number) => {
    if (severity >= 7) return { class: 'severity-critical', label: 'Critical' };
    if (severity >= 4) return { class: 'severity-medium', label: 'Medium' };
    return { class: 'severity-low', label: 'Low' };
};

const getDistance = (lat1?: number, lng1?: number, lat2?: number, lng2?: number): string => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return '--';
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
};

export const IssueCard: React.FC<IssueCardProps> = ({ issue, userLat, userLng }) => {
    const status = getStatusBadge(issue.status);
    const severity = getSeverityBadge(issue.severity);
    const distance = getDistance(userLat, userLng, issue.latitude, issue.longitude);

    return (
        <motion.div
            whileHover={{ y: -3 }}
            className="glass-card overflow-hidden group cursor-pointer"
        >
            {/* Image */}
            <div className="h-32 bg-civic-card relative overflow-hidden">
                {issue.image_url ? (
                    <img
                        src={issue.image_url}
                        alt={issue.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-civic-card to-civic-dark">
                        <MapPin className="w-8 h-8 text-civic-muted/50" />
                    </div>
                )}
                {/* Severity badge overlay */}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${severity.class}`}>
                    {severity.label}
                </span>
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-white capitalize">{issue.category}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.class}`}>
                        {status.label}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs text-civic-muted">
                    <span className="flex items-center gap-1 truncate max-w-[60%]">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {issue.address || 'Unknown location'}
                    </span>
                    <span className="font-mono">{distance}</span>
                </div>
            </div>
        </motion.div>
    );
};
