import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Clinic } from '@/types';

// Fix Leaflet marker icons not loading with bundlers
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface ClinicLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number | null;
}

interface Props {
  clinics: Clinic[];
  className?: string;
  onClinicClick?: (clinicId: string) => void;
}

/**
 * Parse clinic address to extract approximate coordinates.
 * In production, this would use geocoding. For now, we generate
 * deterministic pseudo-coordinates based on the clinic name hash
 * centered around a default location (Delhi, India).
 */
function getClinicLocation(clinic: Clinic): ClinicLocation {
  // Simple deterministic hash for demo positioning
  let hash = 0;
  for (let i = 0; i < clinic.name.length; i++) {
    hash = ((hash << 5) - hash) + clinic.name.charCodeAt(i);
    hash |= 0;
  }
  
  // Center around Delhi (28.6139, 77.2090) with small jitter
  const latJitter = (Math.abs(hash % 100) - 50) * 0.003;
  const lngJitter = (Math.abs((hash >> 8) % 100) - 50) * 0.003;
  
  return {
    id: clinic.id,
    name: clinic.name,
    lat: 28.6139 + latJitter,
    lng: 77.2090 + lngJitter,
    rating: clinic.rating,
  };
}

/** Adjusts map bounds to fit all markers */
function FitBounds({ locations }: { locations: ClinicLocation[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (locations.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(locations.map(l => [l.lat, l.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      fitted.current = true;
    }
  }, [locations, map]);

  return null;
}

export function ClinicMap({ clinics, className = '', onClinicClick }: Props) {
  const locations = clinics.map(getClinicLocation);

  // Default center (Delhi)
  const center: [number, number] = locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : [28.6139, 77.2090];

  return (
    <div className={`rounded-[20px] overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        className="rounded-[20px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} />

        {locations.map(loc => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="font-sans text-center min-w-[140px]">
                <p className="font-bold text-[14px] text-slate-900 mb-1">{loc.name}</p>
                {loc.rating && loc.rating > 0 && (
                  <p className="text-[12px] text-amber-600 font-bold mb-2">
                    ★ {Number(loc.rating).toFixed(1)}
                  </p>
                )}
                {onClinicClick && (
                  <button
                    onClick={() => onClinicClick(loc.id)}
                    className="bg-[#006b5f] text-white px-3 py-1 rounded-lg text-[12px] font-bold hover:bg-[#005048] transition-colors"
                  >
                    View Clinic
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
