import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapPoint {
    lat: number;
    lng: number;
    severity: number;
    category: string;
}

interface HeatmapSectionProps {
    issues: any[];
}

const defaultPoints: HeatmapPoint[] = [
    { lat: 28.6139, lng: 77.2090, severity: 9, category: 'pothole' },
    { lat: 28.6200, lng: 77.2150, severity: 7, category: 'streetlight' },
    { lat: 28.6100, lng: 77.2000, severity: 6, category: 'garbage' },
    { lat: 28.6050, lng: 77.1950, severity: 8, category: 'pothole' },
    { lat: 28.6180, lng: 77.2200, severity: 5, category: 'water leak' },
    { lat: 28.6300, lng: 77.2190, severity: 4, category: 'road crack' },
    { lat: 28.5700, lng: 77.2100, severity: 3, category: 'garbage' },
    { lat: 28.5500, lng: 77.0600, severity: 7, category: 'streetlight' },
    { lat: 28.6250, lng: 77.2050, severity: 9, category: 'water leak' },
    { lat: 28.6080, lng: 77.2120, severity: 8, category: 'pothole' },
];

const getColor = (severity: number) => {
    if (severity >= 8) return '#ef4444';
    if (severity >= 5) return '#f97316';
    return '#eab308';
};

export const HeatmapSection: React.FC<HeatmapSectionProps> = ({ issues }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);

    const points: HeatmapPoint[] = issues.length > 0
        ? issues.filter(i => i.latitude && i.longitude).map(i => ({
            lat: i.latitude, lng: i.longitude,
            severity: i.severity || Math.round((i.risk_score || 0.5) * 10),
            category: i.category,
        }))
        : defaultPoints;

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([28.6139, 77.2090], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map);

        // Add issue markers as colored circles
        points.forEach(p => {
            const color = getColor(p.severity);
            L.circleMarker([p.lat, p.lng], {
                radius: p.severity * 2.5,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.7,
                fillOpacity: 0.35,
            })
                .bindPopup(`<div style="color:#111;font-size:12px;"><b>${p.category}</b><br/>Severity: ${p.severity}/10</div>`)
                .addTo(map);
        });

        // Predicted risk polygon overlay
        const riskZone = L.polygon(
            [
                [28.608, 77.195],
                [28.615, 77.210],
                [28.622, 77.205],
                [28.618, 77.192],
            ],
            {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.12,
                weight: 1,
                dashArray: '5, 5',
            }
        ).addTo(map);
        riskZone.bindPopup('<div style="color:#111;font-size:12px;"><b>AI Predicted Risk Zone</b><br/>High failure probability</div>');

        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    return (
        <section className="mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <MapIcon className="w-5 h-5 text-red-400" />
                    <h2 className="text-xl font-bold text-white">Urgency Heatmap</h2>
                </div>
                <p className="text-civic-muted text-sm">Issue density & AI predictive risk overlays</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card overflow-hidden"
            >
                <div ref={mapRef} className="w-full h-[400px]" />

                {/* Legend */}
                <div className="flex items-center gap-6 px-5 py-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-civic-muted">
                        <span className="w-3 h-3 rounded-full bg-yellow-500/60" /> Medium
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-civic-muted">
                        <span className="w-3 h-3 rounded-full bg-orange-500/60" /> High
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-civic-muted">
                        <span className="w-3 h-3 rounded-full bg-red-500/60" /> Critical
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-civic-muted">
                        <span className="w-3 h-3 border border-dashed border-red-500/60 rounded-sm" /> AI Risk Zone
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
