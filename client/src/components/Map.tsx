import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { supabase } from '../services/supabase';

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

interface Issue {
    id: string;
    latitude: number;
    longitude: number;
    location: any;
    title: string;
    severity: number;
    status: string;
}

const CreateCustomIcon = (severity: number) => {
    const colorClass = severity > 8 ? 'bg-red-500' : severity > 5 ? 'bg-orange-500' : 'bg-blue-500';
    const iconMarkup = renderToStaticMarkup(
        <div className={`p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${colorClass}`}>
            <AlertTriangle className="text-white w-4 h-4" />
        </div>
    );

    return L.divIcon({
        html: iconMarkup,
        className: 'custom-leaflet-icon', // Use a dummy class to remove default Leaflet square styles if needed
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
};

export const CivicMap: React.FC = () => {
    const [issues, setIssues] = useState<Issue[]>([]);

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        const { data } = await supabase.from('issues').select('*');
        if (data) {
            const parsed = data.map((d: any) => {
                let lat = 0, lon = 0;
                if (d.location && typeof d.location === 'string') {
                    const match = d.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
                    if (match) {
                        lon = parseFloat(match[1]);
                        lat = parseFloat(match[2]);
                    }
                }
                return { ...d, longitude: lon, latitude: lat };
            });
            setIssues(parsed);
        }
    };

    return (
        <div className="h-screen w-full relative z-0">
            <MapContainer
                key="civic-map"
                center={[40, -74.5]}
                zoom={9}
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {issues.map(issue => (
                    <Marker
                        key={issue.id}
                        position={[issue.latitude, issue.longitude]}
                        icon={CreateCustomIcon(issue.severity)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg mb-1">{issue.title}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${issue.status === 'resolved' ? 'bg-green-600' : 'bg-yellow-600'
                                        }`}>
                                        {issue.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-500">Risk: {issue.severity}/10</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

