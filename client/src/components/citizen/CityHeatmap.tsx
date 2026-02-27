import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../services/supabase';

interface IssuePoint {
    id: string;
    latitude: number;
    longitude: number;
    risk_score: number;
    title: string;
}

export const CityHeatmap: React.FC = () => {
    const [points, setPoints] = useState<IssuePoint[]>([]);

    useEffect(() => {
        const fetchPoints = async () => {
            const { data } = await supabase.from('issues').select('id, location, latitude, longitude, risk_score, title');
            if (data) {
                const parsed = data.map((d: any) => {
                    let lat = d.latitude;
                    let lon = d.longitude;

                    if (!lat || !lon) {
                        if (d.location && typeof d.location === 'string') {
                            const match = d.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
                            if (match) {
                                lon = parseFloat(match[1]);
                                lat = parseFloat(match[2]);
                            }
                        }
                    }

                    return {
                        id: d.id,
                        title: d.title,
                        risk_score: d.risk_score || 0.5,
                        latitude: lat || 13.0827,
                        longitude: lon || 80.2707,
                    };
                });
                setPoints(parsed);
            }
        };

        fetchPoints();
    }, []);

    const getColor = (risk: number) => {
        if (risk > 0.8) return '#ef4444'; // Red
        if (risk > 0.5) return '#f59e0b'; // Amber
        return '#10b981'; // Green
    };

    return (
        <div className="h-full w-full rounded-[40px] overflow-hidden shadow-2xl shadow-brand-secondary/10 border border-brand-secondary/5 relative z-0">
            <MapContainer
                center={[13.0827, 80.2707]}
                zoom={11}
                style={{ width: '100%', height: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {points.map((point) => (
                    <CircleMarker
                        key={point.id}
                        center={[point.latitude, point.longitude]}
                        radius={15}
                        fillColor={getColor(point.risk_score)}
                        color="white"
                        weight={2}
                        opacity={0.3}
                        fillOpacity={0.6}
                    >
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-black text-brand-secondary uppercase tracking-tighter text-sm mb-1">{point.title}</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-secondary/40">
                                    Risk Index: {Math.round(point.risk_score * 100)}%
                                </p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-8 left-8 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-brand-secondary/5 shadow-xl max-w-[200px] z-[1000]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary mb-4">Issue Density Index</h4>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/60">High Concentration</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/60">Medium Alert</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/20" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-secondary/60">Nominal Zone</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
