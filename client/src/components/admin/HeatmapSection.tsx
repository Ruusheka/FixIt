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
    if (severity >= 8) return '#540023';
    if (severity >= 5) return '#8B1E3F';
    return '#CCCFBA';
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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map);

        // Add issue markers as colored circles
        points.forEach(p => {
            const color = getColor(p.severity);
            L.circleMarker([p.lat, p.lng], {
                radius: p.severity * 2,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.4,
            })
                .bindPopup(`<div style="color:#540023;font-size:12px;font-weight:900;text-transform:uppercase;"><b>${p.category}</b><br/><span style="opacity:0.6">Severity Index: ${p.severity}</span></div>`)
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
                color: '#540023',
                fillColor: '#540023',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '8, 8',
            }
        ).addTo(map);
        riskZone.bindPopup('<div style="color:#540023;font-size:12px;font-weight:900;text-transform:uppercase;"><b>AI Predicted Risk Zone</b><br/><span style="opacity:0.6">Automated Critical Coverage</span></div>');

        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    return (
        <section className="mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 border-b border-brand-secondary/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-secondary rounded-xl">
                        <MapIcon className="w-6 h-6 text-brand-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-brand-secondary tracking-tighter uppercase">Spatial Ingress</h2>
                </div>
                <p className="text-brand-secondary/40 text-xs font-bold uppercase tracking-widest ml-12 mt-1">Issue density & AI predictive load variance</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="minimal-card overflow-hidden bg-white shadow-soft"
            >
                <div ref={mapRef} className="w-full h-[450px] grayscale-[0.5] hover:grayscale-0 transition-all duration-700" />

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-8 px-8 py-4 border-t border-brand-secondary/5 bg-brand-secondary/[0.02]">
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-brand-primary border border-brand-secondary/20" /> Trace
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-[#8B1E3F]" /> Moderate
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                        <span className="w-3 h-3 rounded-full bg-brand-secondary" /> Critical
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-brand-secondary/60 uppercase tracking-widest">
                        <span className="w-4 h-3 border-2 border-dashed border-brand-secondary/30 rounded-sm" /> AI Boundary
                    </div>
                </div>
            </motion.div>
        </section>
    );
};
