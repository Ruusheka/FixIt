import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface LocationPickerMapProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

// Sub-component to handle map clicks and marker synchronization
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Sub-component to update map view when props change
const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ lat, lng, onChange }) => {
    const position = useMemo(() => [lat, lng] as [number, number], [lat, lng]);

    const handleMapClick = useCallback((newLat: number, newLng: number) => {
        onChange(newLat, newLng);
    }, [onChange]);

    const eventHandlers = useMemo(
        () => ({
            dragend(e: any) {
                const marker = e.target;
                if (marker != null) {
                    const { lat: dLat, lng: dLng } = marker.getLatLng();
                    onChange(dLat, dLng);
                }
            },
        }),
        [onChange]
    );

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden border border-brand-secondary/10 shadow-inner bg-brand-secondary/5">
            <MapContainer
                center={position}
                zoom={15}
                scrollWheelZoom={true}
                className="h-full w-full"
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker
                    draggable={true}
                    eventHandlers={eventHandlers}
                    position={position}
                    icon={DefaultIcon}
                />
                <MapEvents onMapClick={handleMapClick} />
                <ChangeView center={position} />
            </MapContainer>

            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-brand-secondary text-brand-primary rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl">
                    Drag marker to pinpoint
                </div>
            </div>
        </div>
    );
};
