import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Vehicle {
  id: string;
  plate_number: string;
  driver_name: string;
  load_type: string;
  load_weight: number;
  cover_status: string;
  water_tank_level: number;
  battery_level: number;
  status: string;
  speed: number;
  dust_emission?: number;
  lat?: number;
  lng?: number;
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  current_aqi: number;
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
  wind_speed: number;
}

interface MapComponentProps {
  vehicles: Vehicle[];
  stations: Station[];
  onSelectVehicle: (id: string) => void;
}

// Static Landmarks along Raipur-Bhilai Industrial Corridor
const LANDMARKS = [
  { name: "Urla Primary Health Center", lat: 21.3050, lng: 81.6120, type: "hospital" },
  { name: "Raipur Public School, Urla", lat: 21.3180, lng: 81.6210, type: "school" },
  { name: "Bhilai Steel Trust Hospital", lat: 21.1850, lng: 81.3850, type: "hospital" },
  { name: "Durg Municipal High School", lat: 21.1960, lng: 81.2910, type: "school" },
  { name: "Siltara Industrial Area (Factory Zone 1)", lat: 21.3880, lng: 81.6610, type: "industry" },
  { name: "Bhilai Steel Plant Gate 3", lat: 21.1910, lng: 81.3980, type: "industry" }
];

const MapComponent: React.FC<MapComponentProps> = ({ vehicles, stations, onSelectVehicle }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Keep track of active map objects to update/remove them easily
  const vehicleMarkersRef = useRef<Record<string, L.Marker>>({});
  const stationMarkersRef = useRef<Record<string, L.Marker>>({});
  const heatmapCirclesRef = useRef<L.Circle[]>([]);

  // Register global window selector for Leaflet html popup triggers
  useEffect(() => {
    (window as any).selectVehicle = (id: string) => {
      onSelectVehicle(id);
    };
    return () => {
      delete (window as any).selectVehicle;
    };
  }, [onSelectVehicle]);

  // 1. Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Centered between Raipur and Bhilai
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([21.2600, 81.4800], 11);

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Render Static Landmarks once
      LANDMARKS.forEach((lm) => {
        let iconHtml = '';
        let color = '';

        if (lm.type === 'hospital') {
          color = '#3B82F6'; // Blue
          iconHtml = `<div class="w-8 h-8 rounded-full bg-blue-500/90 text-white flex items-center justify-center border-2 border-white shadow-lg text-[10px] font-bold">H</div>`;
        } else if (lm.type === 'school') {
          color = '#8B5CF6'; // Purple
          iconHtml = `<div class="w-8 h-8 rounded-full bg-purple-500/90 text-white flex items-center justify-center border-2 border-white shadow-lg text-[10px] font-bold">S</div>`;
        } else {
          color = '#475569'; // Dark Gray
          iconHtml = `<div class="w-8 h-8 rounded-full bg-slate-600/90 text-white flex items-center justify-center border-2 border-white shadow-lg text-[10px] font-bold">🏭</div>`;
        }

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        if (mapRef.current) {
          L.marker([lm.lat, lm.lng], { icon: customIcon })
            .addTo(mapRef.current)
            .bindPopup(`<strong class="text-slate-800 dark:text-slate-100">${lm.name}</strong><br/><span class="text-xs text-slate-400 capitalize">${lm.type} zone</span>`);
        }
      });
    }

    return () => {
      // Map cleanup on unmount
      if (mapRef.current) {
        // We do not destroy maps on hot reload, handled by checking if ref exists.
      }
    };
  }, []);

  // 2. Render and Update AQI Stations (Live data)
  useEffect(() => {
    if (!mapRef.current) return;

    stations.forEach((st) => {
      let aqiColor = 'bg-emerald-500';
      if (st.current_aqi > 250) aqiColor = 'bg-red-600 animate-pulse';
      else if (st.current_aqi > 150) aqiColor = 'bg-amber-500';

      const iconHtml = `
        <div class="w-10 h-10 rounded-full ${aqiColor} text-white flex flex-col items-center justify-center border-2 border-white dark:border-slate-800 shadow-xl leading-none">
          <span class="text-[9px] uppercase font-extrabold tracking-tighter opacity-80">AQI</span>
          <span class="text-xs font-black">${st.current_aqi}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'station-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      if (stationMarkersRef.current[st.id]) {
        // Update existing marker
        const marker = stationMarkersRef.current[st.id];
        marker.setLatLng([st.lat, st.lng]);
        marker.setIcon(customIcon);
        marker.setPopupContent(`
          <div class="p-2">
            <h4 class="font-extrabold text-sm text-slate-800 dark:text-white">${st.name}</h4>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 dark:text-slate-300">
              <div>AQI: <strong>${st.current_aqi}</strong></div>
              <div>PM2.5: <strong>${st.pm25} µg/m³</strong></div>
              <div>PM10: <strong>${st.pm10} µg/m³</strong></div>
              <div>Temp: <strong>${st.temp}°C</strong></div>
              <div>Humidity: <strong>${st.humidity}%</strong></div>
              <div>Wind: <strong>${st.wind_speed} km/h</strong></div>
            </div>
          </div>
        `);
      } else {
        // Create new marker
        const marker = L.marker([st.lat, st.lng], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h4 class="font-extrabold text-sm text-slate-800 dark:text-white">${st.name}</h4>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 dark:text-slate-300">
                <div>AQI: <strong>${st.current_aqi}</strong></div>
                <div>PM2.5: <strong>${st.pm25} µg/m³</strong></div>
                <div>PM10: <strong>${st.pm10} µg/m³</strong></div>
                <div>Temp: <strong>${st.temp}°C</strong></div>
                <div>Humidity: <strong>${st.humidity}%</strong></div>
                <div>Wind: <strong>${st.wind_speed} km/h</strong></div>
              </div>
            </div>
          `);
        stationMarkersRef.current[st.id] = marker;
      }
    });

    // Draw Dynamic Heatmap Circles around Stations (PM10 density)
    // Clear old circles
    heatmapCirclesRef.current.forEach(circle => circle.remove());
    heatmapCirclesRef.current = [];

    stations.forEach((st) => {
      let color = '#10B981'; // Green
      if (st.current_aqi > 250) color = '#EF4444'; // Red
      else if (st.current_aqi > 150) color = '#F59E0B'; // Orange

      const radius = st.pm10 * 10; // Scaled radius in meters

      if (mapRef.current) {
        const circle = L.circle([st.lat, st.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          radius: radius,
          weight: 1
        }).addTo(mapRef.current);
        heatmapCirclesRef.current.push(circle);
      }
    });

  }, [stations]);

  // 3. Render and Update Live Truck Locations (Vehicles)
  useEffect(() => {
    if (!mapRef.current) return;

    vehicles.forEach((trk) => {
      // Skip vehicles without GPS details
      if (trk.lat === undefined || trk.lng === undefined) return;

      const isMaintenance = trk.status === 'Maintenance Due';
      let pinColor = 'bg-emerald-500';
      if (isMaintenance) {
        pinColor = 'bg-slate-500';
      } else if (trk.dust_emission && trk.dust_emission > 60) {
        pinColor = 'bg-red-500 animate-bounce';
      } else if (trk.dust_emission && trk.dust_emission > 25) {
        pinColor = 'bg-amber-500';
      }

      const iconHtml = `
        <div class="w-8 h-8 rounded-full ${pinColor} text-white flex items-center justify-center border-2 border-white shadow-lg relative">
          <span class="text-xs">🚚</span>
          <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-800 text-white rounded-full text-[7px] font-bold flex items-center justify-center border border-white">
            ${trk.id.replace('AS-TRK-', '')}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'vehicle-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (vehicleMarkersRef.current[trk.id]) {
        // Update existing marker
        const marker = vehicleMarkersRef.current[trk.id];
        marker.setLatLng([trk.lat, trk.lng]);
        marker.setIcon(customIcon);
        marker.setPopupContent(`
          <div class="p-2">
            <h4 class="font-extrabold text-sm text-slate-800 dark:text-white">${trk.id} (${trk.plate_number})</h4>
            <p class="text-xs text-slate-400 mt-0.5">Driver: ${trk.driver_name}</p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 dark:text-slate-300 border-t dark:border-slate-800 pt-2">
              <div>Speed: <strong>${Math.round(trk.speed)} km/h</strong></div>
              <div>Load Weight: <strong>${trk.load_weight}t (${trk.load_type})</strong></div>
              <div>Cover: <strong class="${trk.cover_status === 'Covered' ? 'text-secondary' : 'text-danger'}">${trk.cover_status}</strong></div>
              <div>Dust: <strong class="${trk.dust_emission && trk.dust_emission > 40 ? 'text-danger' : 'text-slate-400'}">${trk.dust_emission || 0} mg/m³</strong></div>
              <div>Water Tank: <strong class="${trk.water_tank_level < 20 ? 'text-danger' : 'text-secondary'}">${trk.water_tank_level}%</strong></div>
              <div>AeroShield: <strong class="${trk.water_tank_level > 0 && trk.speed > 0 ? 'text-secondary' : 'text-slate-500'}">${trk.water_tank_level > 0 && trk.speed > 0 ? 'Active' : 'Inactive'}</strong></div>
            </div>
            <div class="mt-2.5 pt-2 border-t dark:border-slate-800 border-slate-100">
              <button onclick="window.selectVehicle('${trk.id}')" class="w-full text-center py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-black tracking-wider transition">
                VIEW DIAGNOSTICS
              </button>
            </div>
          </div>
        `);
      } else {
        // Create new marker
        const marker = L.marker([trk.lat, trk.lng], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h4 class="font-extrabold text-sm text-slate-800 dark:text-white">${trk.id} (${trk.plate_number})</h4>
              <p class="text-xs text-slate-400 mt-0.5">Driver: ${trk.driver_name}</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 dark:text-slate-300 border-t dark:border-slate-800 pt-2">
                <div>Speed: <strong>${Math.round(trk.speed)} km/h</strong></div>
                <div>Load Weight: <strong>${trk.load_weight}t (${trk.load_type})</strong></div>
                <div>Cover: <strong class="${trk.cover_status === 'Covered' ? 'text-secondary' : 'text-danger'}">${trk.cover_status}</strong></div>
                <div>Dust: <strong class="${trk.dust_emission && trk.dust_emission > 40 ? 'text-danger' : 'text-slate-400'}">${trk.dust_emission || 0} mg/m³</strong></div>
                <div>Water Tank: <strong class="${trk.water_tank_level < 20 ? 'text-danger' : 'text-secondary'}">${trk.water_tank_level}%</strong></div>
                <div>AeroShield: <strong class="${trk.water_tank_level > 0 && trk.speed > 0 ? 'text-secondary' : 'text-slate-500'}">${trk.water_tank_level > 0 && trk.speed > 0 ? 'Active' : 'Inactive'}</strong></div>
              </div>
              <div class="mt-2.5 pt-2 border-t dark:border-slate-800 border-slate-100">
                <button onclick="window.selectVehicle('${trk.id}')" class="w-full text-center py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-black tracking-wider transition">
                  VIEW DIAGNOSTICS
                </button>
              </div>
            </div>
          `);
        vehicleMarkersRef.current[trk.id] = marker;
      }
    });

    // Cleanup disconnected/removed vehicles
    Object.keys(vehicleMarkersRef.current).forEach((key) => {
      if (!vehicles.find(v => v.id === key)) {
        vehicleMarkersRef.current[key].remove();
        delete vehicleMarkersRef.current[key];
      }
    });

  }, [vehicles]);

  return (
    <div className="w-full h-[600px] border border-slate-200 dark:border-industrial-border rounded-xl shadow-lg relative overflow-hidden">
      {/* Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Corridor Overlay UI Card */}
      <div className="absolute bottom-4 left-4 p-4 rounded-xl glass text-xs w-60 z-[1000] border dark:border-slate-800 border-slate-200 shadow-xl pointer-events-none">
        <h5 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2 leading-none">Corridor Legend</h5>
        <div className="space-y-1.5 dark:text-slate-300 text-slate-600 font-medium">
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white inline-block"></span><span>AQI: Clean / Moderate (&lt;150)</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white inline-block"></span><span>AQI: Poor / Unhealthy (150-250)</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-white inline-block"></span><span>AQI: Severe / Critical (&gt;250)</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white inline-block text-[8px] text-white flex items-center justify-center">H</span><span>Sensitive Landmark: Hospital</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-white inline-block text-[8px] text-white flex items-center justify-center">S</span><span>Sensitive Landmark: School</span></div>
          <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-white inline-block text-[8px] text-white flex items-center justify-center">🏭</span><span>Industrial Emission Hotspots</span></div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
