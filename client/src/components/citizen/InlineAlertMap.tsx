import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, AlertCircle, Info, Shield } from 'lucide-react';
import { supabase } from '../../services/supabase';

// Fix for default marker icons in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
});

L.Marker.prototype.options.icon = DefaultIcon;

const CreateAlertIcon = () => {
    const iconMarkup = renderToStaticMarkup(
        <div className="flex items-center justify-center">
            <div className="p-2 rounded-full border-2 border-white shadow-lg bg-brand-secondary flex items-center justify-center">
                <MapPin className="text-brand-primary w-4 h-4" />
            </div>
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-alert-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const CreateIssueIcon = (severity: number) => {
    const colorClass = severity > 8 ? 'bg-red-500' : severity > 5 ? 'bg-orange-500' : 'bg-blue-500';
    const iconMarkup = renderToStaticMarkup(
        <div className={`p-1.5 rounded-full border border-white shadow-sm flex items-center justify-center ${colorClass}`}>
            <AlertCircle className="text-white w-2.5 h-2.5" />
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-issue-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20]
    });
};

interface InlineAlertMapProps {
    lat: number;
    lng: number;
    address?: string;
    title: string;
}

export const InlineAlertMap: React.FC<InlineAlertMapProps> = ({ lat, lng, address, title }) => {
    const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNearby = async () => {
            setLoading(true);
            // Fetch issues near this location (simple bounding box for demo/efficiency)
            const delta = 0.02; // Approx 2km
            const { data, error } = await supabase
                .from('issues')
                .select('*')
                .gte('latitude', lat - delta)
                .lte('latitude', lat + delta)
                .gte('longitude', lng - delta)
                .lte('longitude', lng + delta);

            if (!error && data) {
                setNearbyIssues(data);
            }
            setLoading(false);
        };

        fetchNearby();
    }, [lat, lng]);

    return (
        <div className="w-full h-[300px] rounded-3xl overflow-hidden relative border border-brand-secondary/10 shadow-inner">
            <MapContainer
                center={[lat, lng]}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Main Alert Marker */}
                <Marker position={[lat, lng]} icon={CreateAlertIcon()}>
                    <Popup>
                        <div className="p-2">
                            <h4 className="font-black text-brand-secondary uppercase text-xs">{title}</h4>
                            <p className="text-[10px] text-brand-secondary/60 mt-1">{address}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Nearby Issues */}
                {nearbyIssues.map(issue => (
                    <Marker
                        key={issue.id}
                        position={[issue.latitude, issue.longitude]}
                        icon={CreateIssueIcon(issue.severity || 5)}
                    >
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-bold text-xs uppercase">{issue.category}</h4>
                                <p className="text-[10px] opacity-70">Severity: {issue.severity}/10</p>
                                <p className="text-[10px] opacity-70">Status: {issue.status}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay Info */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md border border-brand-secondary/10 p-3 rounded-2xl flex items-center justify-between pointer-events-auto shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-secondary rounded-lg flex items-center justify-center text-brand-primary">
                            <Info size={16} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-brand-secondary/30 uppercase tracking-widest leading-none mb-1">Sector Intelligence</p>
                            <p className="text-[10px] font-black text-brand-secondary uppercase tracking-tight">Focusing on {address || 'Target Zone'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-brand-secondary tracking-tighter">{nearbyIssues.length} ACTIVE ISSUES</p>
                        <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">In Range</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
