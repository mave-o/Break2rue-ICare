import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { HospitalCard, DoctorRecord } from "@/types";
import { TAGBILARAN_CENTER } from "@/constants";
import { fetchDoctorsForHospital } from "@/services/apiService";
import { Phone, Navigation, Clock, Users, Stethoscope, Loader2 } from "lucide-react";

// Fix default marker icon issue in Leaflet
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Hospitals
const HospitalIcon = (type: string) => L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background-color: ${type === "Government Hospital" ? "#1f4f45" : "#8fd1bd"}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const UserLocationIcon = L.divIcon({
  className: "user-location-icon",
  html: `<div class="relative flex items-center justify-center">
          <div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
          <div class="absolute h-8 w-8 rounded-full bg-blue-500/20 animate-ping"></div>
        </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Helper component to center map
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

// Doctor list popup sub-component
function DoctorList({ hospitalId }: { hospitalId: number }) {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadDoctors = async () => {
    if (loaded) return;
    setLoading(true);
    const data = await fetchDoctorsForHospital(hospitalId);
    setDoctors(data);
    setLoading(false);
    setLoaded(true);
  };

  if (!loaded) {
    return (
      <button
        onClick={loadDoctors}
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#8fd1bd]/20 py-1.5 text-[10px] font-medium text-[#1f4f45] transition-all hover:bg-[#8fd1bd]/40 border border-[#8fd1bd]/30"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Users className="h-3 w-3" />
        )}
        {loading ? "Loading..." : "View Doctors"}
      </button>
    );
  }

  if (doctors.length === 0) {
    return (
      <p className="mt-2 text-[10px] text-[#4a7a6e] italic">No doctor records available</p>
    );
  }

  return (
    <div className="mt-2 max-h-32 overflow-y-auto space-y-1.5">
      <p className="text-[10px] font-bold text-[#1f4f45] uppercase tracking-wider flex items-center gap-1">
        <Stethoscope className="h-3 w-3" /> Doctors ({doctors.length})
      </p>
      {doctors.slice(0, 5).map((doc, i) => (
        <div key={doc.id || i} className="bg-[#f0f9f6] rounded-lg p-2 border border-[#8fd1bd]/20">
          <p className="text-[11px] font-medium text-[#1a3d35]">{doc.name}</p>
          <p className="text-[9px] text-[#4a7a6e]">{doc.department || doc.type}</p>
          {doc.schedule && (
            <p className="text-[9px] text-[#4a7a6e] flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" /> {doc.schedule}
            </p>
          )}
        </div>
      ))}
      {doctors.length > 5 && (
        <p className="text-[9px] text-[#4a7a6e] italic text-center">+{doctors.length - 5} more doctors</p>
      )}
    </div>
  );
}

interface HospitalMapProps {
  hospitals: HospitalCard[];
  isLoading: boolean;
}

export default function HospitalMap({ hospitals, isLoading }: HospitalMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Perimeter lock for Tagbilaran (approximate)
          const isInTagbilaran = latitude > 9.6 && latitude < 9.7 && longitude > 123.8 && longitude < 123.9;
          if (isInTagbilaran) {
            setUserLocation([latitude, longitude]);
          }
        },
        (error) => console.warn("Geolocation error:", error)
      );
    }
  }, []);

  return (
    <div className="h-full w-full relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#1f4f45] animate-spin" />
            <p className="text-sm font-medium text-[#1f4f45]">Loading hospital network...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[TAGBILARAN_CENTER.lat, TAGBILARAN_CENTER.lng]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {hospitals.map((h) => (
          <Marker 
            key={`${h.id}-${h.name}`} 
            position={[h.lat, h.lng]} 
            icon={HospitalIcon(h.type)}
          >
            <Popup className="max-w-xs" minWidth={220}>
              <div className="p-1 text-[#1a3d35]">
                <h4 className="font-sans font-medium text-sm mb-1">{h.name}</h4>
                <p className="text-[10px] text-[#4a7a6e] uppercase tracking-wider mb-2 font-mono">
                  {h.type}
                </p>

                {/* Distance & Travel (from backend) */}
                {h.distance && (
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-[#4a7a6e]">
                    <span className="bg-[#1f4f45]/10 px-2 py-0.5 rounded-md font-bold text-[#1f4f45]">
                      {h.distance}
                    </span>
                    {h.travel && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {h.travel}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  {h.specializations.slice(0, 4).map((spec, i) => (
                    <span key={i} className="text-[9px] bg-[#8fd1bd]/20 text-[#1f4f45] px-1.5 py-0.5 rounded-md border border-[#8fd1bd]/30">
                      {spec}
                    </span>
                  ))}
                  {h.specializations.length > 4 && (
                    <span className="text-[9px] text-[#4a7a6e] italic">+{h.specializations.length - 4} more</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  {h.status && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Clock className="h-3 w-3 text-[#1f4f45]" />
                      <span>{h.status}</span>
                    </div>
                  )}
                </div>

                {/* Doctor list — lazy loaded from backend */}
                <DoctorList hospitalId={h.id} />

                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`;
                    window.open(url, "_blank");
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f4f45] py-2 text-[11px] font-medium text-white transition-all hover:bg-[#2a665d]"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Get Directions
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation} icon={UserLocationIcon}>
            <Popup>
              <div className="text-xs font-medium">Your current location</div>
            </Popup>
          </Marker>
        )}

        <ChangeView center={[TAGBILARAN_CENTER.lat, TAGBILARAN_CENTER.lng]} zoom={14} />
      </MapContainer>
    </div>
  );
}
